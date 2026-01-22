import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const legacyBucket = process.env.AWS_S3_LEGACY_BUCKET || process.env.LEGACY_BUCKET || 'miyzapis-storage';
const legacyUrl = (process.env.AWS_S3_LEGACY_URL || process.env.LEGACY_BUCKET_URL || '').replace(/\/+$/, '');
const targetBucket = process.env.AWS_S3_BUCKET || process.env.TARGET_BUCKET || '';
const targetRegion = process.env.AWS_REGION || process.env.TARGET_REGION || 'us-east-1';
const targetUrl = (process.env.AWS_S3_URL || process.env.TARGET_BUCKET_URL || '').replace(/\/+$/, '');

const dryRun = process.env.DRY_RUN !== 'false';
const updateUrls = process.env.UPDATE_URLS !== 'false';
const batchSize = Number.parseInt(process.env.BATCH_SIZE || '200', 10);
const sampleLimit = Number.parseInt(process.env.SAMPLE_LIMIT || '5', 10);

type RewriteResult = {
  value: string;
  changed: boolean;
  bucket?: string;
  key?: string;
};

const buildTargetBaseUrl = (): string => {
  if (targetUrl) {
    return targetUrl;
  }
  if (!targetBucket) {
    return '';
  }
  return `https://${targetBucket}.s3.${targetRegion}.amazonaws.com`;
};

const extractS3Info = (input: string): { bucket?: string; key?: string } => {
  try {
    const parsed = new URL(input);
    const host = parsed.hostname;
    const isS3Host = host.includes('amazonaws.com') && host.includes('s3');
    if (!isS3Host) {
      return {};
    }

    const path = parsed.pathname.replace(/^\/+/, '');
    const isPathStyle =
      host === 's3.amazonaws.com' ||
      host.startsWith('s3.') ||
      host.startsWith('s3-');

    if (isPathStyle) {
      const parts = path.split('/');
      if (parts.length < 2) {
        return {};
      }
      const bucket = parts.shift();
      const key = parts.join('/');
      return { bucket, key };
    }

    const isVirtualHosted = host.includes('.s3.') || host.endsWith('.s3.amazonaws.com');
    if (isVirtualHosted) {
      const bucket = host.split('.')[0];
      return { bucket, key: path };
    }
  } catch {
    return {};
  }

  return {};
};

const rewriteString = (input: string): RewriteResult => {
  if (!input) {
    return { value: input, changed: false };
  }

  if (input.includes('X-Amz-') || input.includes('Signature=')) {
    return { value: input, changed: false };
  }

  const { bucket, key } = extractS3Info(input);
  const targetBase = buildTargetBaseUrl();

  if (bucket && key && bucket === legacyBucket && targetBase) {
    return {
      value: `${targetBase}/${key}`,
      changed: true,
      bucket,
      key
    };
  }

  if (legacyUrl && input.includes(legacyUrl) && targetBase) {
    const rewritten = input.replaceAll(legacyUrl, targetBase);
    const info = extractS3Info(rewritten);
    return {
      value: rewritten,
      changed: rewritten !== input,
      bucket: info.bucket,
      key: info.key
    };
  }

  return { value: input, changed: false, bucket, key };
};

const replaceInJson = (value: any): { value: any; changed: boolean } => {
  if (typeof value === 'string') {
    const rewritten = rewriteString(value);
    return { value: rewritten.value, changed: rewritten.changed };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const updated = value.map(item => {
      const result = replaceInJson(item);
      if (result.changed) {
        changed = true;
      }
      return result.value;
    });
    return { value: updated, changed };
  }

  if (value && typeof value === 'object') {
    let changed = false;
    const updated: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      const result = replaceInJson(item);
      if (result.changed) {
        changed = true;
      }
      updated[key] = result.value;
    }
    return { value: updated, changed };
  }

  return { value, changed: false };
};

const rewriteJsonString = (input: string | null): { value: string | null; changed: boolean } => {
  if (!input) {
    return { value: input, changed: false };
  }

  try {
    const parsed = JSON.parse(input);
    const result = replaceInJson(parsed);
    if (!result.changed) {
      return { value: input, changed: false };
    }
    return { value: JSON.stringify(result.value), changed: true };
  } catch {
    const rewritten = rewriteString(input);
    return { value: rewritten.value, changed: rewritten.changed };
  }
};

const logSampleUpdate = (() => {
  let logged = 0;
  return (label: string, id: string, updates: Record<string, any>) => {
    if (logged >= sampleLimit) {
      return;
    }
    logged += 1;
    console.log(`Sample update [${label}]`, { id, updates });
  };
})();

async function migrateFileRecords() {
  const where: any = {
    OR: [
      { url: { contains: legacyBucket } },
      legacyUrl ? { url: { contains: legacyUrl } } : undefined,
      { path: { contains: legacyBucket } },
      legacyUrl ? { path: { contains: legacyUrl } } : undefined,
      { cloudBucket: legacyBucket }
    ].filter(Boolean)
  };

  let updated = 0;
  let scanned = 0;
  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.file.findMany({
      where,
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    if (batch.length === 0) {
      break;
    }

    for (const file of batch) {
      scanned += 1;
      const urlResult = file.url ? rewriteString(file.url) : { value: file.url, changed: false };
      const pathResult = file.path ? rewriteString(file.path) : { value: file.path, changed: false };
      const keyCandidate = file.cloudKey || urlResult.key || pathResult.key;

      const updates: Record<string, any> = {};

      if (updateUrls && urlResult.changed && keyCandidate) {
        updates.url = urlResult.value;
        updates.path = keyCandidate;
        updates.cloudBucket = targetBucket || file.cloudBucket;
        updates.cloudKey = keyCandidate;
        updates.cloudProvider = file.cloudProvider || 'S3';
      } else {
        if (!file.cloudBucket && (urlResult.bucket === legacyBucket || file.path?.includes(legacyBucket))) {
          updates.cloudBucket = legacyBucket;
        }
        if (!file.cloudKey && keyCandidate) {
          updates.cloudKey = keyCandidate;
        }
        if (!file.cloudProvider && (file.url?.includes('amazonaws.com') || file.path?.includes('amazonaws.com'))) {
          updates.cloudProvider = 'S3';
        }
      }

      if (Object.keys(updates).length > 0) {
        updated += 1;
        logSampleUpdate('files', file.id, updates);
        if (!dryRun) {
          await prisma.file.update({
            where: { id: file.id },
            data: updates
          });
        }
      }
    }

    cursor = batch[batch.length - 1]?.id;
  }

  console.log('Files migration summary', { scanned, updated });
}

async function migrateStringField(model: any, label: string, field: string) {
  const where: any = {
    OR: [
      { [field]: { contains: legacyBucket } },
      legacyUrl ? { [field]: { contains: legacyUrl } } : undefined
    ].filter(Boolean)
  };

  let updated = 0;
  let scanned = 0;
  let cursor: string | undefined;

  while (true) {
    const batch = await model.findMany({
      where,
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    if (batch.length === 0) {
      break;
    }

    for (const record of batch) {
      scanned += 1;
      const original = record[field] as string | null;
      const rewritten = original ? rewriteString(original) : { value: original, changed: false };

      if (rewritten.changed && updateUrls) {
        updated += 1;
        logSampleUpdate(label, record.id, { [field]: rewritten.value });
        if (!dryRun) {
          await model.update({
            where: { id: record.id },
            data: { [field]: rewritten.value }
          });
        }
      }
    }

    cursor = batch[batch.length - 1]?.id;
  }

  console.log(`${label} ${field} migration summary`, { scanned, updated });
}

async function migrateJsonField(model: any, label: string, field: string) {
  const where: any = {
    OR: [
      { [field]: { contains: legacyBucket } },
      legacyUrl ? { [field]: { contains: legacyUrl } } : undefined
    ].filter(Boolean)
  };

  let updated = 0;
  let scanned = 0;
  let cursor: string | undefined;

  while (true) {
    const batch = await model.findMany({
      where,
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    if (batch.length === 0) {
      break;
    }

    for (const record of batch) {
      scanned += 1;
      const original = record[field] as string | null;
      const rewritten = rewriteJsonString(original);

      if (rewritten.changed && updateUrls) {
        updated += 1;
        logSampleUpdate(label, record.id, { [field]: rewritten.value });
        if (!dryRun) {
          await model.update({
            where: { id: record.id },
            data: { [field]: rewritten.value }
          });
        }
      }
    }

    cursor = batch[batch.length - 1]?.id;
  }

  console.log(`${label} ${field} migration summary`, { scanned, updated });
}

async function run() {
  const targetBaseUrl = buildTargetBaseUrl();
  if (updateUrls && !targetBaseUrl) {
    throw new Error('Target S3 URL is missing. Set AWS_S3_URL or TARGET_BUCKET/TARGET_REGION.');
  }

  console.log('Starting file URL migration', {
    dryRun,
    updateUrls,
    legacyBucket,
    legacyUrl,
    targetBucket,
    targetUrl: targetBaseUrl,
    batchSize
  });

  await migrateFileRecords();
  await migrateStringField(prisma.user, 'user', 'avatar');
  await migrateStringField(prisma.employee, 'employee', 'avatar');
  await migrateStringField(prisma.advertisement, 'advertisement', 'imageUrl');
  await migrateStringField(prisma.business, 'business', 'logo');
  await migrateStringField(prisma.business, 'business', 'coverImage');
  await migrateJsonField(prisma.specialist, 'specialist', 'portfolioImages');
  await migrateJsonField(prisma.specialist, 'specialist', 'certifications');
  await migrateJsonField(prisma.specialist, 'specialist', 'documentsSubmitted');
  await migrateJsonField(prisma.service, 'service', 'images');
  await migrateJsonField(prisma.business, 'business', 'images');
  await migrateJsonField(prisma.businessService, 'businessService', 'images');

  console.log('Migration complete');
}

if (require.main === module) {
  run()
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { run };

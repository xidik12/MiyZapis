import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

interface Base64UploadRequest {
  base64Data: string;  // "data:image/png;base64,iVBORw0KG..."
  filename: string;
  purpose: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate' | 'payment';
}

/**
 * Upload file using Base64 encoding (bypasses Railway's multipart upload timeout)
 *
 * This approach works because:
 * - Railway's proxy blocks multipart/form-data POST requests
 * - JSON POST requests work fine
 * - We send the file as Base64-encoded JSON instead of multipart
 */
export const uploadBase64File = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📦 [BASE64 UPLOAD] Request received:', {
      userId: req.user?.id,
      hasBase64Data: !!req.body.base64Data,
      filename: req.body.filename,
      purpose: req.body.purpose
    });

    const { base64Data, filename, purpose }: Base64UploadRequest = req.body;
    const userId = req.user!.id;

    // Validate request
    if (!base64Data || !filename || !purpose) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: base64Data, filename, or purpose'
      });
      return;
    }

    // Extract MIME type and base64 string
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('❌ [BASE64 UPLOAD] Invalid base64 format');
      res.status(400).json({ success: false, error: 'Invalid base64 format' });
      return;
    }

    const mimeType = matches[1];
    const base64String = matches[2];

    console.log('🔍 [BASE64 UPLOAD] Decoded metadata:', {
      mimeType,
      base64Length: base64String.length,
      estimatedSizeKB: (base64String.length * 0.75 / 1024).toFixed(2) + 'KB'
    });

    // Decode base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    const fileSize = buffer.length;

    console.log('📊 [BASE64 UPLOAD] Buffer created:', {
      actualSizeKB: (fileSize / 1024).toFixed(2) + 'KB',
      actualSizeMB: (fileSize / (1024 * 1024)).toFixed(2) + 'MB'
    });

    // Validate file size (10MB max for Base64)
    if (fileSize > 10 * 1024 * 1024) {
      console.error('❌ [BASE64 UPLOAD] File too large:', fileSize);
      res.status(400).json({ success: false, error: 'File too large (max 10MB)' });
      return;
    }

    // Generate unique filename
    const ext = path.extname(filename) || `.${mimeType.split('/')[1]}`;
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    // Create upload directory path
    const uploadDir = process.env.UPLOAD_DIR || '/panhaha/uploads';
    const purposeDir = path.join(uploadDir, purpose, userId);

    console.log('📁 [BASE64 UPLOAD] Creating directory:', purposeDir);

    // Ensure directory exists with proper permissions
    await fs.mkdir(purposeDir, { recursive: true, mode: 0o755 });

    // Save file to disk
    const filePath = path.join(purposeDir, uniqueFilename);

    console.log('💾 [BASE64 UPLOAD] Writing file to disk:', filePath);

    await fs.writeFile(filePath, buffer, { mode: 0o644 });

    console.log('✅ [BASE64 UPLOAD] File written successfully');

    // Get public URL
    const publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${publicUrl}/uploads/${purpose}/${userId}/${uniqueFilename}`;

    console.log('🌐 [BASE64 UPLOAD] File URL:', fileUrl);

    // Save to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: uniqueFilename,
        originalName: filename,
        mimeType,
        size: fileSize,
        path: path.join(purpose, userId, uniqueFilename),
        url: fileUrl,
        uploadedBy: userId,
        purpose,
        isPublic: true,
        isProcessed: true
      }
    });

    console.log('✅ [BASE64 UPLOAD] Database record created:', fileRecord.id);

    res.json({
      success: true,
      data: {
        url: fileRecord.url,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ [BASE64 UPLOAD] Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: error.message
    });
  }
};

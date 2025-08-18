import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { FileUploadService } from '@/services/fileUpload/index';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { config } from '@/config';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Check file type based on purpose
    const purpose = req.query.purpose as string;
    const allowedTypes = getAllowedFileTypes(purpose);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

function getAllowedFileTypes(purpose: string): string[] {
  switch (purpose) {
    case 'avatar':
      return ['image/jpeg', 'image/png', 'image/webp'];
    case 'service_image':
    case 'portfolio':
      return ['image/jpeg', 'image/png', 'image/webp'];
    case 'message_attachment':
      return [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/quicktime',
        'audio/mpeg', 'audio/wav'
      ];
    default:
      return ['image/jpeg', 'image/png', 'image/webp'];
  }
}

export class FileController {
  private fileUploadService: FileUploadService;

  constructor() {
    this.fileUploadService = new FileUploadService(prisma);
  }

  uploadFiles = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const purpose = req.query.purpose as string || 'general';
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const isPublic = req.query.isPublic === 'true';

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return errorResponse(res, 'No files provided', 400);
      }

      const uploadedFiles = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          // Process the file
          const processedFile = await this.processFile(file, purpose);
          
          // Upload to storage (S3 or local)
          const fileUrl = await this.fileUploadService.uploadToStorage(
            processedFile.buffer,
            processedFile.filename,
            processedFile.mimetype
          );

          // Save file record to database
          const fileRecord = await prisma.file.create({
            data: {
              filename: processedFile.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: processedFile.buffer.length,
              path: fileUrl,
              url: fileUrl,
              width: processedFile.width,
              height: processedFile.height,
              uploadedBy: userId,
              purpose,
              entityType,
              entityId,
              isPublic,
              isProcessed: true
            }
          });

          uploadedFiles.push(fileRecord);
        } catch (fileError) {
          logger.error(`Error processing file ${file.originalname}:`, fileError);
          // Continue with other files
        }
      }

      if (uploadedFiles.length === 0) {
        return errorResponse(res, 'Failed to upload any files', 500);
      }

      return successResponse(res, uploadedFiles, 'Files uploaded successfully', 201);
    } catch (error) {
      logger.error('Error uploading files:', error);
      return errorResponse(res, 'Failed to upload files', 500);
    }
  };

  private async processFile(file: Express.Multer.File, purpose: string) {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${purpose}/${fileId}${ext}`;

    let processedBuffer = file.buffer;
    let width: number | undefined;
    let height: number | undefined;

    // Process images
    if (file.mimetype.startsWith('image/')) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      // Resize based on purpose
      switch (purpose) {
        case 'avatar':
          processedBuffer = await image
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();
          break;
        case 'service_image':
        case 'portfolio':
          processedBuffer = await image
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
          break;
        default:
          // Keep original size for other purposes
          break;
      }
    }

    return {
      buffer: processedBuffer,
      filename,
      mimetype: file.mimetype,
      width,
      height
    };
  }

  getFile = async (req: Request, res: Response) => {
    try {
      const fileId = req.params.id;
      const userId = req.user?.id; // Optional for public files

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return errorResponse(res, 'File not found', 404);
      }

      // Check access permissions
      if (!file.isPublic && (!userId || file.uploadedBy !== userId)) {
        return errorResponse(res, 'Access denied', 403);
      }

      return successResponse(res, file, 'File retrieved successfully');
    } catch (error) {
      logger.error('Error getting file:', error);
      return errorResponse(res, 'Failed to retrieve file', 500);
    }
  };

  deleteFile = async (req: Request, res: Response) => {
    try {
      const fileId = req.params.id;
      const userId = req.user.id;

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return errorResponse(res, 'File not found', 404);
      }

      // Check ownership
      if (file.uploadedBy !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Delete from storage
      await this.fileUploadService.deleteFromStorage(file.path);

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      return successResponse(res, null, 'File deleted successfully');
    } catch (error) {
      logger.error('Error deleting file:', error);
      return errorResponse(res, 'Failed to delete file', 500);
    }
  };

  getUserFiles = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const purpose = req.query.purpose as string;

      const where: any = { uploadedBy: userId };
      if (purpose) {
        where.purpose = purpose;
      }

      const files = await prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.file.count({ where });

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      return successResponse(res, { files, pagination }, 'Files retrieved successfully');
    } catch (error) {
      logger.error('Error getting user files:', error);
      return errorResponse(res, 'Failed to retrieve files', 500);
    }
  };

  // Middleware for multer
  uploadMiddleware = upload.array('files', 5);
}

export const fileController = new FileController();
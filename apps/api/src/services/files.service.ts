import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/libs/prisma';
import { config } from '@/config/env';
import logger from '@/config/logger';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export class FileService {
  static async saveFile(file: Express.Multer.File, uploaderId: string) {
    const fileAsset = await prisma.fileAsset.create({
      data: {
        filename: file.filename,
        mime: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        uploaderId,
      },
    });

    logger.info('File uploaded', { 
      fileId: fileAsset.id, 
      filename: file.filename, 
      uploaderId 
    });

    return fileAsset;
  }

  static async getFileById(id: string) {
    const file = await prisma.fileAsset.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true },
        },
      },
    });

    if (!file) {
      throw new Error('File not found');
    }

    return file;
  }

  static async deleteFile(id: string, userId: string) {
    const file = await prisma.fileAsset.findUnique({
      where: { id },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (file.uploaderId !== userId) {
      throw new Error('Not authorized to delete this file');
    }

    await prisma.fileAsset.delete({
      where: { id },
    });

    logger.info('File deleted', { fileId: id, deletedBy: userId });

    return { message: 'File deleted successfully' };
  }
}

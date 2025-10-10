import { Request, Response } from 'express';
import { FileService, upload } from '@/services/files.service';
import logger from '@/config/logger';

export class FileController {
  static async uploadFile(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileAsset = await FileService.saveFile(req.file, req.user.id);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: fileAsset,
      });
    } catch (error: any) {
      logger.error('Upload file error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getFile(req: any, res: Response) {
    try {
      const { id } = req.params;
      const file = await FileService.getFileById(id);

      res.json({ file });
    } catch (error: any) {
      logger.error('Get file error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async deleteFile(req: any, res: Response) {
    try {
      const { id } = req.params;
      const result = await FileService.deleteFile(id, req.user.id);

      res.json(result);
    } catch (error: any) {
      logger.error('Delete file error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static getUploadMiddleware() {
    return upload.single('file');
  }
}

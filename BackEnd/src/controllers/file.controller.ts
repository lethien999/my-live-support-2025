import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getConnection } from '../db';

export class FileController {
  // Multer configuration for file uploads
  static getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    return multer({ 
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    });
  }

  // Upload file
  static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const sql = await getConnection();
      const result = await sql.query`
        INSERT INTO FileStorage (FileName, FilePath, MimeType, Size, UploadedBy, UploadedAt)
        VALUES (${req.file.originalname}, ${req.file.filename}, ${req.file.mimetype}, ${req.file.size}, ${(req as any).user?.userId}, GETDATE());
        SELECT SCOPE_IDENTITY() AS FileID;
      `;
      const fileId = result.recordset[0].FileID;

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        fileId: fileId,
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  // Get file
  static async getFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sql = await getConnection();
      
      const result = await sql.query`
        SELECT FileName, FilePath, MimeType, Size FROM FileStorage 
        WHERE FileID = ${id} AND UploadedBy = ${(req as any).user?.userId}
      `;

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = result.recordset[0];
      const filePath = path.join(__dirname, '../../uploads', file.FilePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      res.setHeader('Content-Type', file.MimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.FileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('File get error:', error);
      res.status(500).json({ error: 'Failed to get file' });
    }
  }

  // Delete file
  static async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sql = await getConnection();
      
      const result = await sql.query`
        SELECT FilePath FROM FileStorage 
        WHERE FileID = ${id} AND UploadedBy = ${(req as any).user?.userId}
      `;

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const filePath = path.join(__dirname, '../../uploads', result.recordset[0].FilePath);
      
      // Delete from database
      await sql.query`DELETE FROM FileStorage WHERE FileID = ${id}`;
      
      // Delete from disk
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.status(200).json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
}

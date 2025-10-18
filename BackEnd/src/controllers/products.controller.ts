import { Request, Response } from 'express';
import { ProductService } from '@/services/products.service';
import logger from '@/config/logger';

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string;

      const pagination = {
        page,
        limit,
        skip: (page - 1) * limit,
      };

      let result;
      if (search) {
        result = await ProductService.searchProducts(search, limit, pagination.skip);
      } else {
        result = await ProductService.getProducts(categoryId, pagination);
      }

      res.json(result);
    } catch (error: any) {
      logger.error('Get products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(parseInt(id));

      res.json({ product });
    } catch (error: any) {
      logger.error('Get product by ID error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async createProduct(req: any, res: Response) {
    try {
      const {
        productName,
        description,
        longDescription,
        categoryId,
        price,
        originalPrice,
        imagePath,
        stockQuantity
      } = req.body;

      const product = await ProductService.createProduct({
        productName,
        description,
        longDescription,
        categoryId: parseInt(categoryId),
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        imagePath,
        stockQuantity: stockQuantity || 0
      });

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error: any) {
      logger.error('Create product error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async updateProduct(req: any, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductService.updateProduct(parseInt(id), updateData);

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error: any) {
      logger.error('Update product error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteProduct(req: any, res: Response) {
    try {
      const { id } = req.params;

      const result = await ProductService.deleteProduct(parseInt(id));

      res.json(result);
    } catch (error: any) {
      logger.error('Delete product error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await ProductService.getCategories();
      res.json(categories);
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createReview(req: any, res: Response) {
    try {
      const { productId, rating, comment } = req.body;

      const review = await ProductService.createReview({
        productId: parseInt(productId),
        customerId: parseInt(req.user.userId),
        rating: parseInt(rating),
        comment
      });

      res.status(201).json({
        message: 'Review created successfully',
        review
      });
    } catch (error: any) {
      logger.error('Create review error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getReviews(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const reviews = await ProductService.getReviews(parseInt(productId), limit, offset);

      res.json({ reviews });
    } catch (error: any) {
      logger.error('Get reviews error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
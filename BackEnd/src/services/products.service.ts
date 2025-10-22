import { PaginationParams, PaginatedResponse } from '@/types/common';
import DatabaseService from './database.service';
import logger from '@/config/logger';

export class ProductService {
  private static db = DatabaseService.getInstance();

  static async getProducts(
    categoryId?: number,
    pagination: PaginationParams = { page: 1, limit: 20, skip: 0 }
  ): Promise<PaginatedResponse<any>> {
    const products = await this.db.getProducts(categoryId, pagination.limit, pagination.skip);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM Products WHERE IsInStock = 1';
    const countParams: any[] = [];
    
    if (categoryId) {
      countQuery += ' AND CategoryID = @categoryId';
      countParams.push(categoryId);
    }
    
    const countResult = await this.db.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: products,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  static async getProductById(id: number) {
    const product = await this.db.getProductById(id);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get product images
    const images = await this.db.query(
      'SELECT * FROM ProductImages WHERE ProductID = @productId ORDER BY ImageOrder',
      [id]
    );

    // Get reviews
    const reviews = await this.db.getReviews(id, 10, 0);

    return {
      ...product,
      images: images,
      reviews: reviews
    };
  }

  static async getCategories() {
    return await this.db.getCategories();
  }

  static async createProduct(data: {
    productName: string;
    description: string;
    longDescription?: string;
    categoryId: number;
    price: number;
    originalPrice?: number;
    imagePath?: string;
    stockQuantity?: number;
  }) {
    const query = `
      INSERT INTO Products (ProductName, Description, LongDescription, CategoryID, Price, OriginalPrice, ImagePath, StockQuantity)
      OUTPUT INSERTED.ProductID, INSERTED.CreatedAt
      VALUES (@productName, @description, @longDescription, @categoryId, @price, @originalPrice, @imagePath, @stockQuantity)
    `;

    const result = await this.db.execute(query, [
      data.productName,
      data.description,
      data.longDescription || null,
      data.categoryId,
      data.price,
      data.originalPrice || null,
      data.imagePath || null,
      data.stockQuantity || 0
    ]);

    logger.info('Product created', { productId: result.recordset[0].ProductID });

    return result.recordset[0];
  }

  static async updateProduct(id: number, data: {
    productName?: string;
    description?: string;
    longDescription?: string;
    categoryId?: number;
    price?: number;
    originalPrice?: number;
    imagePath?: string;
    stockQuantity?: number;
    isInStock?: boolean;
  }) {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.productName) {
      updateFields.push('ProductName = @productName');
      params.push(data.productName);
    }
    if (data.description) {
      updateFields.push('Description = @description');
      params.push(data.description);
    }
    if (data.longDescription !== undefined) {
      updateFields.push('LongDescription = @longDescription');
      params.push(data.longDescription);
    }
    if (data.categoryId) {
      updateFields.push('CategoryID = @categoryId');
      params.push(data.categoryId);
    }
    if (data.price) {
      updateFields.push('Price = @price');
      params.push(data.price);
    }
    if (data.originalPrice !== undefined) {
      updateFields.push('OriginalPrice = @originalPrice');
      params.push(data.originalPrice);
    }
    if (data.imagePath !== undefined) {
      updateFields.push('ImagePath = @imagePath');
      params.push(data.imagePath);
    }
    if (data.stockQuantity !== undefined) {
      updateFields.push('StockQuantity = @stockQuantity');
      params.push(data.stockQuantity);
    }
    if (data.isInStock !== undefined) {
      updateFields.push('IsInStock = @isInStock');
      params.push(data.isInStock);
    }

    updateFields.push('UpdatedAt = GETDATE()');
    params.push(id);

    const query = `
      UPDATE Products 
      SET ${updateFields.join(', ')}
      WHERE ProductID = @productId
    `;

    await this.db.execute(query, params);

    logger.info('Product updated', { productId: id, changes: data });

    return await this.getProductById(id);
  }

  static async deleteProduct(id: number) {
    // Check if product exists
    const product = await this.db.getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Delete product (cascade will handle related records)
    await this.db.execute('DELETE FROM Products WHERE ProductID = @productId', [id]);

    logger.info('Product deleted', { productId: id });

    return { message: 'Product deleted successfully' };
  }

  static async createReview(data: {
    productId: number;
    customerId: number;
    rating: number;
    comment?: string;
  }) {
    const review = await this.db.createReview(
      data.productId,
      data.customerId,
      data.rating,
      data.comment || ''
    );

    logger.info('Review created', { reviewId: review.ReviewID, productId: data.productId });

    return review;
  }

  static async getReviews(productId: number, limit: number = 10, offset: number = 0) {
    return await this.db.getReviews(productId, limit, offset);
  }

  static async searchProducts(query: string, limit: number = 20, offset: number = 0) {
    const searchQuery = `
      DECLARE @searchTerm NVARCHAR(255) = @p1;
      DECLARE @offset INT = @p2;
      DECLARE @limit INT = @p3;
      
      SELECT p.*, c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsInStock = 1 
      AND (p.ProductName LIKE @searchTerm OR p.Description LIKE @searchTerm)
      ORDER BY p.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const searchTerm = `%${query}%`;
    return await this.db.query(searchQuery, [searchTerm, offset, limit]);
  }
}

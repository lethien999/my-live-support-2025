import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Simple routes for testing
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        OrderID: 1,
        OrderNumber: 'ORD-001',
        CustomerName: 'Nguyễn Văn A',
        ShopName: 'Shop ABC',
        TotalAmount: 500000,
        Status: 'Pending',
        CreatedAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        ProductID: 1,
        Name: 'iPhone 15',
        Price: 25000000,
        Description: 'Latest iPhone',
        ImageURL: 'https://via.placeholder.com/300x200'
      }
    ]
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend started on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`✅ Products API: http://localhost:${PORT}/api/products`);
});

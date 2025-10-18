// Mock Data cho Frontend
export const mockCategories = [
  {
    CategoryID: 1,
    CategoryName: 'Clothing',
    Description: 'Thời trang nam nữ với thiết kế đơn giản và chất lượng cao',
    ParentCategoryID: null,
    IsActive: true,
    Icon: '👕'
  },
  {
    CategoryID: 2,
    CategoryName: 'Beauty',
    Description: 'Mỹ phẩm và chăm sóc da với thành phần tự nhiên',
    ParentCategoryID: null,
    IsActive: true,
    Icon: '💄'
  },
  {
    CategoryID: 3,
    CategoryName: 'Home',
    Description: 'Đồ dùng gia đình và nội thất với thiết kế tối giản',
    ParentCategoryID: null,
    IsActive: true,
    Icon: '🏠'
  },
  {
    CategoryID: 4,
    CategoryName: 'Electronics',
    Description: 'Thiết bị điện tử và công nghệ tiện ích',
    ParentCategoryID: null,
    IsActive: true,
    Icon: '📱'
  },
  {
    CategoryID: 5,
    CategoryName: 'Accessories',
    Description: 'Phụ kiện thời trang và đồ dùng cá nhân',
    ParentCategoryID: null,
    IsActive: true,
    Icon: '👜'
  }
];

export const mockProducts = [
  // Clothing
  {
    ProductID: 1,
    ProductName: 'Áo thun cotton cơ bản',
    Description: 'Áo thun cotton 100% với thiết kế đơn giản, thoải mái và bền bỉ. Phù hợp cho mọi hoạt động hàng ngày.',
    Price: 299000,
    CategoryID: 1,
    CategoryName: 'Clothing',
    SKU: 'MUJI-TSHIRT-001',
    StockQuantity: 100,
    IsActive: true,
    IsFeatured: true,
    Image: '👕',
    Specifications: 'Chất liệu: Cotton 100%, Màu sắc: Trắng, Đen, Xám, Size: S, M, L, XL',
    Tags: 'áo thun, cotton, cơ bản, đơn giản',
    Rating: 4.5,
    ReviewCount: 128
  },
  {
    ProductID: 2,
    ProductName: 'Quần jeans slim fit',
    Description: 'Quần jeans với thiết kế slim fit hiện đại, chất liệu denim cao cấp, co giãn tốt.',
    Price: 899000,
    CategoryID: 1,
    CategoryName: 'Clothing',
    SKU: 'MUJI-JEANS-001',
    StockQuantity: 50,
    IsActive: true,
    IsFeatured: true,
    Image: '👖',
    Specifications: 'Chất liệu: Denim 98% Cotton + 2% Elastane, Màu: Xanh đậm, Size: 28-36',
    Tags: 'quần jeans, slim fit, denim, cao cấp',
    Rating: 4.8,
    ReviewCount: 89
  },
  {
    ProductID: 3,
    ProductName: 'Áo khoác bomber',
    Description: 'Áo khoác bomber với thiết kế thể thao, chất liệu nhẹ và chống nước.',
    Price: 1299000,
    CategoryID: 1,
    CategoryName: 'Clothing',
    SKU: 'MUJI-BOMBER-001',
    StockQuantity: 30,
    IsActive: true,
    IsFeatured: false,
    Image: '🧥',
    Specifications: 'Chất liệu: Polyester + Nylon, Chống nước, Size: S, M, L, XL',
    Tags: 'áo khoác, bomber, thể thao, chống nước',
    Rating: 4.3,
    ReviewCount: 45
  },
  
  // Beauty
  {
    ProductID: 4,
    ProductName: 'Kem dưỡng ẩm tự nhiên',
    Description: 'Kem dưỡng ẩm với thành phần tự nhiên, phù hợp cho mọi loại da, không gây kích ứng.',
    Price: 450000,
    CategoryID: 2,
    CategoryName: 'Beauty',
    SKU: 'MUJI-MOISTURIZER-001',
    StockQuantity: 80,
    IsActive: true,
    IsFeatured: true,
    Image: '🧴',
    Specifications: 'Thành phần: Chiết xuất từ thiên nhiên, Dung tích: 50ml, Loại da: Mọi loại da',
    Tags: 'kem dưỡng, tự nhiên, ẩm, skincare',
    Rating: 4.7,
    ReviewCount: 156
  },
  {
    ProductID: 5,
    ProductName: 'Sữa rửa mặt dịu nhẹ',
    Description: 'Sữa rửa mặt với công thức dịu nhẹ, làm sạch sâu mà không làm khô da.',
    Price: 320000,
    CategoryID: 2,
    CategoryName: 'Beauty',
    SKU: 'MUJI-CLEANSER-001',
    StockQuantity: 120,
    IsActive: true,
    IsFeatured: false,
    Image: '🧼',
    Specifications: 'Dung tích: 150ml, pH: 5.5, Loại da: Da nhạy cảm',
    Tags: 'sữa rửa mặt, dịu nhẹ, làm sạch, nhạy cảm',
    Rating: 4.4,
    ReviewCount: 92
  },
  
  // Home
  {
    ProductID: 6,
    ProductName: 'Bộ chén đĩa gốm sứ',
    Description: 'Bộ chén đĩa gốm sứ với thiết kế tối giản, an toàn cho sức khỏe, dễ vệ sinh.',
    Price: 650000,
    CategoryID: 3,
    CategoryName: 'Home',
    SKU: 'MUJI-CERAMIC-001',
    StockQuantity: 40,
    IsActive: true,
    IsFeatured: true,
    Image: '🍽️',
    Specifications: 'Chất liệu: Gốm sứ cao cấp, Bộ: 6 chén + 6 đĩa, Màu: Trắng',
    Tags: 'chén đĩa, gốm sứ, tối giản, gia đình',
    Rating: 4.6,
    ReviewCount: 73
  },
  {
    ProductID: 7,
    ProductName: 'Đèn bàn LED tiết kiệm điện',
    Description: 'Đèn bàn LED với ánh sáng dịu nhẹ, tiết kiệm điện, điều chỉnh độ sáng.',
    Price: 850000,
    CategoryID: 3,
    CategoryName: 'Home',
    SKU: 'MUJI-LED-LAMP-001',
    StockQuantity: 25,
    IsActive: true,
    IsFeatured: false,
    Image: '💡',
    Specifications: 'Công suất: 12W LED, Điều chỉnh độ sáng, Màu ánh sáng: Trắng ấm',
    Tags: 'đèn bàn, LED, tiết kiệm điện, điều chỉnh',
    Rating: 4.2,
    ReviewCount: 38
  },
  
  // Electronics
  {
    ProductID: 8,
    ProductName: 'Tai nghe không dây',
    Description: 'Tai nghe không dây với âm thanh chất lượng cao, pin lâu, kết nối Bluetooth 5.0.',
    Price: 1599000,
    CategoryID: 4,
    CategoryName: 'Electronics',
    SKU: 'MUJI-EARBUDS-001',
    StockQuantity: 60,
    IsActive: true,
    IsFeatured: true,
    Image: '🎧',
    Specifications: 'Bluetooth 5.0, Pin: 8 giờ, Sạc nhanh, Chống nước IPX4',
    Tags: 'tai nghe, không dây, Bluetooth, âm thanh',
    Rating: 4.9,
    ReviewCount: 201
  },
  {
    ProductID: 9,
    ProductName: 'Sạc dự phòng 10000mAh',
    Description: 'Sạc dự phòng với dung lượng lớn, sạc nhanh, thiết kế nhỏ gọn.',
    Price: 750000,
    CategoryID: 4,
    CategoryName: 'Electronics',
    SKU: 'MUJI-POWERBANK-001',
    StockQuantity: 45,
    IsActive: true,
    IsFeatured: false,
    Image: '🔋',
    Specifications: 'Dung lượng: 10000mAh, Sạc nhanh QC 3.0, 2 cổng USB',
    Tags: 'sạc dự phòng, pin, sạc nhanh, di động',
    Rating: 4.5,
    ReviewCount: 67
  },
  
  // Accessories
  {
    ProductID: 10,
    ProductName: 'Túi xách canvas',
    Description: 'Túi xách canvas với thiết kế đơn giản, bền bỉ, phù hợp cho mọi hoạt động.',
    Price: 550000,
    CategoryID: 5,
    CategoryName: 'Accessories',
    SKU: 'MUJI-CANVAS-BAG-001',
    StockQuantity: 70,
    IsActive: true,
    IsFeatured: true,
    Image: '👜',
    Specifications: 'Chất liệu: Canvas cao cấp, Kích thước: 35x40x15cm, Màu: Be, Đen',
    Tags: 'túi xách, canvas, đơn giản, bền bỉ',
    Rating: 4.4,
    ReviewCount: 84
  },
  {
    ProductID: 11,
    ProductName: 'Đồng hồ đeo tay minimal',
    Description: 'Đồng hồ đeo tay với thiết kế tối giản, mặt số lớn, dây da thật.',
    Price: 1299000,
    CategoryID: 5,
    CategoryName: 'Accessories',
    SKU: 'MUJI-WATCH-001',
    StockQuantity: 35,
    IsActive: true,
    IsFeatured: false,
    Image: '⌚',
    Specifications: 'Mặt số: 40mm, Dây: Da thật, Pin: 2 năm, Chống nước: 3ATM',
    Tags: 'đồng hồ, minimal, da thật, tối giản',
    Rating: 4.7,
    ReviewCount: 52
  }
];

export const mockUsers = [
  {
    id: 1,
    email: 'admin@muji.com',
    name: 'Quản trị viên hệ thống',
    role: 'Admin',
    avatar: '👨‍💼'
  },
  {
    id: 2,
    email: 'agent@muji.com',
    name: 'Nhân viên hỗ trợ',
    role: 'Agent',
    avatar: '👩‍💼'
  },
  {
    id: 3,
    email: 'customer@muji.com',
    name: 'Khách hàng mẫu',
    role: 'Customer',
    avatar: '👤'
  }
];

export const mockConversations = [
  {
    id: '1',
    shopName: 'MUJI Store - Clothing',
    shopId: '2',
    lastMessage: 'Cảm ơn bạn đã quan tâm đến sản phẩm áo thun của chúng tôi!',
    lastMessageTime: '2025-01-17T10:30:00Z',
    unreadCount: 2,
    avatar: '👕',
    isOnline: true,
    isActive: true,
    category: 'Clothing'
  },
  {
    id: '2',
    shopName: 'MUJI Store - Beauty',
    shopId: '2',
    lastMessage: 'Chúng tôi có nhiều sản phẩm chăm sóc da tự nhiên.',
    lastMessageTime: '2025-01-17T09:15:00Z',
    unreadCount: 0,
    avatar: '💄',
    isOnline: false,
    isActive: true,
    category: 'Beauty'
  },
  {
    id: '3',
    shopName: 'MUJI Store - Home',
    shopId: '2',
    lastMessage: 'Bộ chén đĩa gốm sứ đang được ưu đãi đặc biệt.',
    lastMessageTime: '2025-01-16T16:45:00Z',
    unreadCount: 1,
    avatar: '🏠',
    isOnline: true,
    isActive: true,
    category: 'Home'
  }
];

export const mockMessages = {
  '1': [
    {
      id: '1',
      content: 'Xin chào, tôi muốn hỏi về áo thun cotton',
      sender: 'Khách hàng mẫu',
      senderId: '3',
      senderRole: 'Customer',
      timestamp: '2025-01-17T10:25:00Z',
      isUser: true,
      type: 'text'
    },
    {
      id: '2',
      content: '👋 Chào mừng bạn đến với MUJI Store! Cảm ơn bạn đã quan tâm đến sản phẩm áo thun cotton của chúng tôi. Tôi là AI Assistant và sẽ hỗ trợ bạn trong khi chờ nhân viên phản hồi.',
      sender: 'AI Assistant',
      senderId: 'bot',
      senderRole: 'bot',
      timestamp: '2025-01-17T10:25:30Z',
      isUser: false,
      type: 'text'
    },
    {
      id: '3',
      content: 'Áo thun cotton của chúng tôi được làm từ 100% cotton, có các size từ S đến XL và nhiều màu sắc. Bạn quan tâm đến size nào?',
      sender: 'Nhân viên hỗ trợ',
      senderId: '2',
      senderRole: 'Agent',
      timestamp: '2025-01-17T10:30:00Z',
      isUser: false,
      type: 'text'
    }
  ],
  '2': [
    {
      id: '4',
      content: 'Tôi muốn tìm sản phẩm chăm sóc da',
      sender: 'Khách hàng mẫu',
      senderId: '3',
      senderRole: 'Customer',
      timestamp: '2025-01-17T09:10:00Z',
      isUser: true,
      type: 'text'
    },
    {
      id: '5',
      content: 'Chúng tôi có nhiều sản phẩm chăm sóc da tự nhiên như kem dưỡng ẩm và sữa rửa mặt dịu nhẹ. Bạn có loại da nào?',
      sender: 'Nhân viên hỗ trợ',
      senderId: '2',
      senderRole: 'Agent',
      timestamp: '2025-01-17T09:15:00Z',
      isUser: false,
      type: 'text'
    }
  ],
  '3': [
    {
      id: '6',
      content: 'Bộ chén đĩa có giá bao nhiêu?',
      sender: 'Khách hàng mẫu',
      senderId: '3',
      senderRole: 'Customer',
      timestamp: '2025-01-16T16:40:00Z',
      isUser: true,
      type: 'text'
    },
    {
      id: '7',
      content: 'Bộ chén đĩa gốm sứ đang được ưu đãi đặc biệt.',
      sender: 'Nhân viên hỗ trợ',
      senderId: '2',
      senderRole: 'Agent',
      timestamp: '2025-01-16T16:45:00Z',
      isUser: false,
      type: 'text'
    }
  ]
};

export const mockCartItems = [
  {
    CartID: 1,
    ProductID: 1,
    ProductName: 'Áo thun cotton cơ bản',
    Price: 299000,
    Quantity: 2,
    Description: 'Áo thun cotton 100% với thiết kế đơn giản',
    ShopName: 'MUJI Store',
    ShopID: 1,
    Image: '👕',
    SKU: 'MUJI-TSHIRT-001',
    CreatedAt: '2025-01-17T10:00:00Z'
  },
  {
    CartID: 2,
    ProductID: 4,
    ProductName: 'Kem dưỡng ẩm tự nhiên',
    Price: 450000,
    Quantity: 1,
    Description: 'Kem dưỡng ẩm với thành phần tự nhiên',
    ShopName: 'MUJI Store',
    ShopID: 1,
    Image: '🧴',
    SKU: 'MUJI-MOISTURIZER-001',
    CreatedAt: '2025-01-17T09:30:00Z'
  }
];

export const mockOrders = [
  {
    OrderID: 1,
    CustomerID: 3,
    OrderNumber: 'ORD-2025-001',
    Status: 'Delivered',
    TotalAmount: 748000,
    CreatedAt: '2025-01-15T14:30:00Z',
    UpdatedAt: '2025-01-16T10:00:00Z',
    ShippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
    PaymentMethod: 'Credit Card',
    Items: [
      {
        ProductID: 1,
        ProductName: 'Áo thun cotton cơ bản',
        Quantity: 2,
        Price: 299000,
        Image: '👕'
      },
      {
        ProductID: 4,
        ProductName: 'Kem dưỡng ẩm tự nhiên',
        Quantity: 1,
        Price: 450000,
        Image: '🧴'
      }
    ]
  },
  {
    OrderID: 2,
    CustomerID: 3,
    OrderNumber: 'ORD-2025-002',
    Status: 'Processing',
    TotalAmount: 1299000,
    CreatedAt: '2025-01-17T08:15:00Z',
    UpdatedAt: '2025-01-17T08:15:00Z',
    ShippingAddress: '456 Đường XYZ, Quận 2, TP.HCM',
    PaymentMethod: 'Bank Transfer',
    Items: [
      {
        ProductID: 8,
        ProductName: 'Tai nghe không dây',
        Quantity: 1,
        Price: 1299000,
        Image: '🎧'
      }
    ]
  }
];

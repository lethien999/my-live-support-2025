# 🚀 DEPLOYMENT GUIDE

## 📋 Pre-deployment Checklist

### ✅ Backend Requirements
- [ ] Node.js 18+ installed
- [ ] SQL Server accessible
- [ ] Redis server (optional but recommended)
- [ ] Environment variables configured
- [ ] Database schema created

### ✅ Frontend Requirements
- [ ] Node.js 18+ installed
- [ ] Build process working
- [ ] Environment variables configured

## 🔧 Production Configuration

### 1. Environment Variables

Create `.env` file in BackEnd directory:

```env
# Production Configuration
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://yourdomain.com

# Database (Production)
DATABASE_URL=sqlserver://user:password@server:1433;database=live_support_prod;encrypt=true;trustServerCertificate=false

# JWT Secrets (Generate new ones!)
JWT_SECRET=your-super-secure-production-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-production-refresh-secret-key-here

# Redis (Production)
REDIS_URL=redis://your-redis-server:6379
REDIS_PASSWORD=your-redis-password

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# Security
DEBUG_MODE=false
ENABLE_SWAGGER=false
ENABLE_CORS=true
```

### 2. Database Setup

```sql
-- Create production database
CREATE DATABASE live_support_prod;

-- Run your database schema
-- (Use scripts from database/ folder)
```

### 3. Build Process

```bash
# Backend
cd BackEnd
npm install --production
npm run build

# Frontend
cd FrontEnd
npm install
npm run build
```

## 🐳 Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./BackEnd
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  frontend:
    build: ./FrontEnd
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  redis_data:
```

## ☁️ Cloud Deployment

### AWS Deployment

1. **EC2 Instance**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2

   # Deploy application
   pm2 start dist/server.js --name "live-support"
   pm2 startup
   pm2 save
   ```

2. **RDS Database**
   - Create SQL Server RDS instance
   - Configure security groups
   - Update DATABASE_URL

3. **ElastiCache Redis**
   - Create Redis cluster
   - Update REDIS_URL

### Azure Deployment

1. **App Service**
   ```bash
   # Deploy to Azure App Service
   az webapp deployment source config-zip \
     --resource-group myResourceGroup \
     --name myAppName \
     --src myApp.zip
   ```

2. **Azure SQL Database**
   - Create SQL Database
   - Configure firewall rules
   - Update connection string

3. **Azure Cache for Redis**
   - Create Redis cache
   - Update Redis URL

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use secure secret management
- Rotate secrets regularly

### 2. Database Security
- Use encrypted connections
- Implement proper access controls
- Regular backups

### 3. Redis Security
- Use authentication
- Enable TLS encryption
- Restrict network access

### 4. Application Security
- Enable CORS properly
- Implement rate limiting
- Use HTTPS in production

## 📊 Monitoring

### 1. Health Checks
```bash
# Application health
curl https://yourdomain.com/health

# Database health
npm run test:database

# Redis health
redis-cli ping
```

### 2. Logging
- Configure log rotation
- Set up log aggregation
- Monitor error rates

### 3. Performance Monitoring
- Monitor response times
- Track WebSocket connections
- Monitor database performance

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check connection string
   - Verify network access
   - Check firewall rules

2. **Redis Connection Failed**
   - Verify Redis server running
   - Check authentication
   - Monitor memory usage

3. **WebSocket Issues**
   - Check CORS configuration
   - Verify proxy settings
   - Monitor connection limits

### Debug Commands

```bash
# Check system status
npm run test:system

# Check logs
pm2 logs live-support

# Monitor resources
pm2 monit
```

---

**🎯 Production Checklist:**
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Redis server running
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security measures in place

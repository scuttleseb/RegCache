# RegCache Microservices Architecture

## Overview

This document outlines the microservices architecture for the RegCache progressive pricing system. The system is designed to provide real-time pricing calculations through independent, scalable services.

## Architecture

```
RegCache Frontend (React)
    ↓ HTTP requests
Base Pricing Service (Port 3002)
    ↓ Caching & Database
Redis + MySQL
```

## Services

### Base Pricing Microservice

**Purpose**: Calculates base prices for appliances based on manufacturer, model, and premium features.

**Port**: 3002  
**Database**: MySQL (`appliance_registration`)  
**Cache**: Redis  
**Location**: `services/base-pricing/`

#### Key Features

- **Premium Brand Detection**: Automatically adjusts pricing for high-end brands
- **Redis Caching**: Prevents duplicate calculations 
- **Database Fallback**: Uses hardcoded pricing if database is unavailable
- **Session Management**: Compatible with RegCache session system

#### API Endpoints

##### POST `/api/pricing/base`

Calculate base price for an appliance.

**Request Body**:
```json
{
  "manufacturer": "whirlpool",
  "appliance": "washing-machine", 
  "brand": "Cabrio",
  "type": "Top Load",
  "sessionId": "session_12345"
}
```

**Response**:
```json
{
  "basePrice": 500,
  "breakdown": [
    "Base price for whirlpool washing-machine: $450",
    "Premium brand adjustment included"
  ],
  "sessionId": "session_12345",
  "source": "fallback_calculated",
  "metadata": {
    "service": "base-pricing-microservice",
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

##### GET `/health`

Service health check.

**Response**:
```json
{
  "status": "healthy",
  "service": "base-pricing-microservice",
  "services": {
    "redis": "connected",
    "mysql": "connected"
  }
}
```

##### GET `/api/test`

Development test endpoint.

## Database Schema

### New Table: `product_pricing`

This table stores manufacturer-specific pricing data for the base pricing service.

```sql
CREATE TABLE product_pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manufacturer VARCHAR(100) NOT NULL,
  appliance_type VARCHAR(100) NOT NULL,
  brand VARCHAR(100) DEFAULT '',
  model_type VARCHAR(100) DEFAULT '',
  base_price DECIMAL(10,2) NOT NULL,
  cost_basis DECIMAL(10,2),
  margin DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_product (manufacturer, appliance_type, brand, model_type),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_appliance_type (appliance_type)
);
```

#### Sample Data

```sql
INSERT INTO product_pricing (manufacturer, appliance_type, brand, model_type, base_price, cost_basis, margin) VALUES
('whirlpool', 'washing-machine', 'Cabrio', 'Top Load', 525, 350, 0.50),
('samsung', 'refrigerator', 'Bespoke', 'French Door', 1150, 750, 0.53),
('ge', 'dishwasher', 'Profile', 'Built-in', 475, 320, 0.48),
('lg', 'dryer', 'Smart', 'Heat Pump', 580, 380, 0.53);
```

## Pricing Logic

### Premium Brand Detection

The service automatically detects premium brands and applies adjustments:

**Premium Brands**:
- GE: Profile, Cafe, Monogram
- LG: Signature, Studio  
- Samsung: Bespoke, Chef Collection
- Whirlpool: Gold Series, Smart

**Premium Types**:
- Front Load, Smart, WiFi, Steam
- French Door, Side by Side, Counter Depth
- Induction, Convection

### Fallback Pricing

If database queries fail, the service uses sophisticated fallback logic:

```javascript
Base Prices (by manufacturer/appliance):
- Whirlpool Washing Machine: $450 + $50 premium
- Samsung Refrigerator: $900 + $150 premium  
- GE Dishwasher: $320 + $60 premium
- LG Dryer: $430 + $60 premium
```

## Caching Strategy

### Redis Keys

```
base_price:{manufacturer}:{appliance}:{brand}:{type}
pricing:{sessionId}:base
```

### Cache TTL

- **Product Pricing**: 1 hour (3600 seconds)
- **Session Data**: 30 minutes (1800 seconds)
- **Fallback Pricing**: 15 minutes (900 seconds)

## Integration

### Frontend Integration

The RegCache frontend routes base pricing calls to the microservice:

```javascript
// In App.js
const BASE_PRICING_URL = 'http://localhost:3002';

if (endpoint === '/api/pricing/base') {
  url = `${BASE_PRICING_URL}${endpoint}`;
}
```

### Session Compatibility  

The microservice stores session data in Redis using the same format as the main RegCache system:

```json
{
  "basePrice": 500,
  "manufacturer": "whirlpool", 
  "appliance": "washing-machine",
  "source": "database",
  "calculatedAt": "2024-01-15T10:30:00.000Z",
  "service": "base-pricing-microservice"
}
```

## Development Setup

### Prerequisites

- Node.js 16+
- Redis running (Docker or local)
- MySQL running (Docker or local)

### Installation

```bash
# From RegCache project root
cd services/base-pricing

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

### Testing

```bash
# Health check
curl http://localhost:3002/health

# Test pricing calculation
curl -X POST http://localhost:3002/api/pricing/base \
  -H "Content-Type: application/json" \
  -d '{"manufacturer":"samsung","appliance":"refrigerator","brand":"Bespoke","sessionId":"test123"}'
```

## Monitoring

### Logs

The service provides comprehensive logging:

```
✅ Base Pricing Service running on port 3002
Cache hit for base_price:whirlpool:washing-machine:cabrio:top load
Database query error: Table 'product_pricing' doesn't exist (using fallback)
Base pricing request: samsung refrigerator -> $1050
```

### Performance Metrics

Monitor these key indicators:

- **Cache Hit Rate**: Should be >80% for repeated requests
- **Response Time**: Target <100ms for cached requests
- **Error Rate**: Database fallback is expected when table is missing

## Future Enhancements

### Planned Features

- **A/B Testing**: Support for pricing experiments
- **ML Pricing**: Dynamic pricing based on demand
- **Bulk Pricing**: Quantity-based discounts
- **Geographic Pricing**: Location-based adjustments

### Additional Tables

Future services may require:

```sql
-- Tax calculation service
CREATE TABLE tax_rates (
  state VARCHAR(2) PRIMARY KEY,
  state_rate DECIMAL(5,4),
  local_rate DECIMAL(5,4)
);

-- Segment pricing service  
CREATE TABLE customer_segments (
  segment VARCHAR(50) PRIMARY KEY,
  discount_rate DECIMAL(5,4),
  minimum_order DECIMAL(10,2)
);
```

## Troubleshooting

### Common Issues

**Service won't start**:
- Check port 3002 availability: `lsof -i :3002`
- Verify Redis connection: `docker ps`
- Check MySQL connection: Test with health endpoint

**Database errors**:
- Normal if `product_pricing` table doesn't exist
- Service will use fallback pricing automatically
- Create table using SQL above to enable database pricing

**CORS errors**:
- Verify frontend URL in service .env file
- Check browser network tab for blocked requests

### Performance Issues

**Slow responses**:
- Check Redis cache hit rates in logs
- Monitor database query performance  
- Consider adding database indexes

**High memory usage**:
- Monitor Redis cache size
- Adjust cache TTL values if needed
- Check for memory leaks in long-running processes

## Redis Security Configuration

### Development vs Production

**Current Development Setup (No Password)**:
```bash
# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Empty password = no authentication required
```

**Why No Password in Development**:
- **Docker Network Isolation**: Redis container only accessible from localhost
- **Development Speed**: No authentication overhead during testing
- **Default Behavior**: Redis starts without auth by default
- **Security Sufficient**: Local development poses minimal security risk

**Production Requirements**:
```bash
# Production Redis configuration
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=strong_random_password_here
REDIS_TLS=true
```

### Adding Redis Authentication (Optional)

If you want to simulate production security locally:

**1. Update docker-compose.yml**:
```yaml
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
  command: redis-server --requirepass "dev_password_123"
```

**2. Update all .env files**:
```bash
REDIS_PASSWORD=dev_password_123
```

**3. Redis client will automatically use password if provided**:
```javascript
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD || undefined
});
```

**Security Note**: The current passwordless setup is appropriate for local development but should never be used in shared or production environments.

## Configuration

### Environment Variables

```bash
# Service
PORT=3002
NODE_ENV=development

# Database  
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=rootpassword123
DB_NAME=appliance_registration

# Redis (Development - No Password)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Leave empty for local development, set for production

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Production Environment Variables

```bash
# Production overrides
NODE_ENV=production
DB_HOST=your-rds-endpoint.amazonaws.com
REDIS_HOST=your-elasticache-endpoint.amazonaws.com
REDIS_PASSWORD=secure_production_password
REDIS_TLS=true
```

This microservice provides a solid foundation for scaling the RegCache pricing system while maintaining compatibility with the existing monolithic architecture.
// services/base-pricing/server.js
// Base Price Microservice - Independent service for appliance base pricing

const express = require('express');
const cors = require('cors');
const redis = require('redis');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many pricing requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Redis Client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

// MySQL Connection Pool for product catalog
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'appliance_registration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize Redis connection
async function initializeRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connected');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
  }
}

// Base pricing business logic
class BasePricingEngine {
  
  // Get base price with caching
  static async getBasePrice(manufacturer, appliance, brand, type) {
    const cacheKey = `base_price:${manufacturer}:${appliance}:${brand || 'default'}:${type || 'default'}`;
    
    try {
      // Check Redis cache first
      const cachedPrice = await redisClient.get(cacheKey);
      if (cachedPrice) {
        console.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cachedPrice);
      }
      
      // Query database for pricing
      const dbPrice = await this.queryDatabasePrice(manufacturer, appliance, brand, type);
      if (dbPrice) {
        // Cache for 1 hour
        await redisClient.setex(cacheKey, 3600, JSON.stringify(dbPrice));
        return dbPrice;
      }
      
      // Fallback to hardcoded pricing
      const fallbackPrice = this.getFallbackPrice(manufacturer, appliance, brand, type);
      
      // Cache fallback for shorter time (15 minutes)
      await redisClient.setEx(cacheKey, 900, JSON.stringify(fallbackPrice));
      
      return fallbackPrice;
      
    } catch (error) {
      console.error('Base pricing error:', error);
      // Return fallback without caching if there's an error
      return this.getFallbackPrice(manufacturer, appliance, brand, type);
    }
  }
  
  // Query database for product pricing
  static async queryDatabasePrice(manufacturer, appliance, brand, type) {
    try {
      // Try exact match first
      let query = `
        SELECT base_price, cost_basis, margin, last_updated 
        FROM product_pricing 
        WHERE manufacturer = ? AND appliance_type = ? AND brand = ? AND model_type = ?
      `;
      let params = [manufacturer, appliance, brand || '', type || ''];
      
      let [rows] = await pool.execute(query, params);
      
      if (rows.length === 0) {
        // Try without brand and type
        query = `
          SELECT base_price, cost_basis, margin, last_updated 
          FROM product_pricing 
          WHERE manufacturer = ? AND appliance_type = ? AND (brand IS NULL OR brand = '') AND (model_type IS NULL OR model_type = '')
        `;
        params = [manufacturer, appliance];
        [rows] = await pool.execute(query, params);
      }
      
      if (rows.length > 0) {
        const row = rows[0];
        return {
          basePrice: row.base_price,
          source: 'database',
          metadata: {
            costBasis: row.cost_basis,
            margin: row.margin,
            lastUpdated: row.last_updated
          }
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }
  
  // Fallback hardcoded pricing
  static getFallbackPrice(manufacturer, appliance, brand, type) {
    const basePrices = {
      'whirlpool': {
        'washing-machine': { base: 450, premium: 50 },
        'refrigerator': { base: 800, premium: 100 },
        'dishwasher': { base: 350, premium: 75 },
        'dryer': { base: 400, premium: 50 }
      },
      'ge': {
        'washing-machine': { base: 420, premium: 45 },
        'refrigerator': { base: 750, premium: 90 },
        'dishwasher': { base: 320, premium: 60 },
        'dryer': { base: 380, premium: 45 }
      },
      'samsung': {
        'washing-machine': { base: 520, premium: 80 },
        'refrigerator': { base: 900, premium: 150 },
        'dishwasher': { base: 400, premium: 100 },
        'dryer': { base: 450, premium: 70 }
      },
      'lg': {
        'washing-machine': { base: 500, premium: 75 },
        'refrigerator': { base: 850, premium: 125 },
        'dishwasher': { base: 380, premium: 80 },
        'dryer': { base: 430, premium: 60 }
      }
    };
    
    const manufacturerPrices = basePrices[manufacturer.toLowerCase()];
    const appliancePrice = manufacturerPrices?.[appliance.toLowerCase()];
    
    if (!appliancePrice) {
      return {
        basePrice: 400,
        source: 'fallback_default',
        metadata: { reason: 'Unknown manufacturer/appliance combination' }
      };
    }
    
    // Add premium for high-end brands/types
    let finalPrice = appliancePrice.base;
    
    if (brand && this.isPremiumBrand(brand)) {
      finalPrice += appliancePrice.premium;
    }
    
    if (type && this.isPremiumType(type)) {
      finalPrice += Math.floor(appliancePrice.premium * 0.5);
    }
    
    return {
      basePrice: finalPrice,
      source: 'fallback_calculated',
      metadata: {
        basePrice: appliancePrice.base,
        premiumAdjustment: finalPrice - appliancePrice.base,
        brand,
        type
      }
    };
  }
  
  static isPremiumBrand(brand) {
    const premiumBrands = [
      'profile', 'cafe', 'monogram', // GE premium brands
      'signature', 'studio', // LG premium brands  
      'bespoke', 'chef collection', // Samsung premium brands
      'gold series', 'smart' // Whirlpool premium brands
    ];
    return premiumBrands.some(premium => 
      brand.toLowerCase().includes(premium.toLowerCase())
    );
  }
  
  static isPremiumType(type) {
    const premiumTypes = [
      'front load', 'smart', 'wifi', 'steam',
      'french door', 'side by side', 'counter depth',
      'induction', 'convection'
    ];
    return premiumTypes.some(premium => 
      type.toLowerCase().includes(premium.toLowerCase())
    );
  }
}

// API Endpoints
app.post('/api/pricing/base', async (req, res) => {
  try {
    const { manufacturer, appliance, brand, type, sessionId } = req.body;
    
    // Validate required fields
    if (!manufacturer || !appliance) {
      return res.status(400).json({
        error: 'Missing required fields: manufacturer and appliance are required'
      });
    }
    
    // Get base pricing
    const pricingResult = await BasePricingEngine.getBasePrice(
      manufacturer, 
      appliance, 
      brand || '', 
      type || ''
    );
    
    // Store in session cache for RegCache coordination
    if (sessionId) {
      const sessionData = {
        basePrice: pricingResult.basePrice,
        manufacturer,
        appliance,
        brand: brand || '',
        type: type || '',
        source: pricingResult.source,
        metadata: pricingResult.metadata,
        calculatedAt: new Date().toISOString(),
        service: 'base-pricing-microservice'
      };
      
      // Store with 30 minute expiration
      await redisClient.setEx(
  `pricing:${sessionId}:base`, 
  1800, 
  JSON.stringify(sessionData)
);
    }   
    
    // Prepare response
    const breakdown = [
      `Base price for ${manufacturer} ${appliance}: $${pricingResult.basePrice}`
    ];
    
    if (brand && BasePricingEngine.isPremiumBrand(brand)) {
      breakdown.push(`Premium brand adjustment included`);
    }
    
    if (type && BasePricingEngine.isPremiumType(type)) {
      breakdown.push(`Premium type adjustment included`);
    }
    
    res.json({
      basePrice: pricingResult.basePrice,
      breakdown,
      sessionId,
      source: pricingResult.source,
      metadata: {
        service: 'base-pricing-microservice',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ...pricingResult.metadata
      }
    });
    
  } catch (error) {
    console.error('Base pricing endpoint error:', error);
    res.status(500).json({
      error: 'Base pricing calculation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'base-pricing-microservice',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };
  
  // Check Redis connection
  try {
    await redisClient.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check MySQL connection
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    health.services.mysql = 'connected';
  } catch (error) {
    health.services.mysql = 'disconnected';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Test endpoint for development
app.get('/api/test', async (req, res) => {
  try {
    const testResult = await BasePricingEngine.getBasePrice('whirlpool', 'washing-machine', 'Cabrio', 'Top Load');
    
    res.json({
      message: 'Base pricing service test successful',
      testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    service: 'base-pricing-microservice',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    service: 'base-pricing-microservice',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Base Pricing Service shutting down gracefully...');
  
  try {
    await redisClient.quit();
    await pool.end();
    console.log('✅ Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Base Pricing Microservice...');
    
    // Initialize connections
    await initializeRedis();
    await testDatabaseConnection();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Base Pricing Service running on port ${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/pricing/base`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log('📡 Ready to serve base pricing requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start Base Pricing Service:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}




module.exports = app;
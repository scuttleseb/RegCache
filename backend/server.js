// server.js - Complete backend server for progressive pricing service
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Redis Client Setup
let redisClient;

async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    process.exit(1);
  }
}

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'appliance_registration',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Pricing calculation engine
class PricingEngine {
  static async getBasePrice(manufacturer, appliance, brand, type) {
    console.log('Calculating base price for:', { manufacturer, appliance, brand, type });
    
    // Base pricing matrix
    const basePrices = {
      'whirlpool': { 
        'washing-machine': 450, 
        'refrigerator': 800, 
        'dishwasher': 350, 
        'dryer': 400 
      },
      'ge': { 
        'washing-machine': 420, 
        'refrigerator': 750, 
        'dishwasher': 320, 
        'dryer': 380 
      },
      'samsung': { 
        'washing-machine': 520, 
        'refrigerator': 900, 
        'dishwasher': 400, 
        'dryer': 450 
      },
      'lg': { 
        'washing-machine': 500, 
        'refrigerator': 850, 
        'dishwasher': 380, 
        'dryer': 430 
      }
    };

    const basePrice = basePrices[manufacturer.toLowerCase()]?.[appliance.toLowerCase()] || 300;
    
    // Add premiums for specific features
    let premium = 0;
    const brandLower = (brand || '').toLowerCase();
    const typeLower = (type || '').toLowerCase();
    
    if (brandLower.includes('premium') || brandLower.includes('deluxe')) premium += 100;
    if (typeLower.includes('smart') || typeLower.includes('wifi')) premium += 150;
    if (typeLower.includes('energy star') || typeLower.includes('efficient')) premium += 75;
    if (typeLower.includes('stainless') || typeLower.includes('steel')) premium += 50;

    const finalPrice = basePrice + premium;
    
    const breakdown = [
      `Base price for ${manufacturer} ${appliance}: $${basePrice}`,
      ...(premium > 0 ? [`Premium features bonus: +$${premium}`] : [])
    ];

    console.log('Base price calculation result:', { basePrice: finalPrice, breakdown });
    return { basePrice: finalPrice, breakdown };
  }

  static async calculateTax(state, basePrice) {
    console.log('Calculating tax for:', { state, basePrice });
    
    // State tax rates
    const taxRates = {
      'CA': 0.0875,  // California
      'NY': 0.08,    // New York
      'TX': 0.0625,  // Texas
      'FL': 0.06,    // Florida
      'WA': 0.065,   // Washington
      'IL': 0.0625,  // Illinois
      'PA': 0.06,    // Pennsylvania
      'OH': 0.0575,  // Ohio
      'GA': 0.04,    // Georgia
      'NC': 0.0475   // North Carolina
    };

    const taxRate = taxRates[state.toUpperCase()] || 0.05; // Default 5%
    const tax = Math.round(basePrice * taxRate * 100) / 100; // Round to 2 decimal places

    const breakdown = [`${(taxRate * 100).toFixed(2)}% sales tax for ${state.toUpperCase()}: $${tax.toFixed(2)}`];

    console.log('Tax calculation result:', { tax, taxRate: taxRate * 100, breakdown });
    return { tax, taxRate: taxRate * 100, breakdown };
  }

  static async getSegmentDiscount(customerSegment, basePrice) {
    console.log('Calculating segment discount for:', { customerSegment, basePrice });
    
    // Customer segment discount rates
    const discountRates = {
      'premium': 0.15,    // 15% discount
      'standard': 0.05,   // 5% discount
      'basic': 0          // No discount
    };

    const discountRate = discountRates[customerSegment.toLowerCase()] || 0;
    const discount = Math.round(basePrice * discountRate * 100) / 100;

    const breakdown = discount > 0 
      ? [`${(discountRate * 100)}% ${customerSegment} customer discount: -$${discount.toFixed(2)}`] 
      : [`No discount for ${customerSegment} customers`];

    console.log('Segment discount result:', { segmentDiscount: discount, discountRate: discountRate * 100, breakdown });
    return { segmentDiscount: discount, discountRate: discountRate * 100, breakdown };
  }
}

// Cache management utilities
class CacheManager {
  static generateKey(sessionId, step) {
    return `pricing:${sessionId}:${step}`;
  }

  static async set(key, data, expiration = 3600) {
    try {
      await redisClient.setEx(key, expiration, JSON.stringify(data));
      console.log('Cache set:', key);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async get(key) {
    try {
      const data = await redisClient.get(key);
      console.log('Cache get:', key, data ? 'HIT' : 'MISS');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async getSessionData(sessionId) {
    const steps = ['base', 'tax', 'segment'];
    const data = {};

    for (const step of steps) {
      const key = this.generateKey(sessionId, step);
      const stepData = await this.get(key);
      if (stepData) {
        data[step] = stepData;
      }
    }

    console.log('Retrieved session data for:', sessionId, Object.keys(data));
    return data;
  }

  static async clearSession(sessionId) {
    const steps = ['base', 'tax', 'segment'];
    for (const step of steps) {
      const key = this.generateKey(sessionId, step);
      try {
        await redisClient.del(key);
        console.log('Cache cleared:', key);
      } catch (error) {
        console.error('Cache clear error:', error);
      }
    }
  }
}

// API Routes

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redisClient.ping();
    
    // Check MySQL connection
    await pool.execute('SELECT 1');
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        mysql: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Base price calculation endpoint
app.post('/api/pricing/base', async (req, res) => {
  try {
    const { manufacturer, appliance, brand, type, sessionId } = req.body;

    // Validation
    if (!manufacturer || !appliance || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: manufacturer, appliance, sessionId' 
      });
    }

    console.log('Base price request:', { manufacturer, appliance, brand, type, sessionId });

    const result = await PricingEngine.getBasePrice(manufacturer, appliance, brand, type);
    
    // Cache the result
    const cacheKey = CacheManager.generateKey(sessionId, 'base');
    await CacheManager.set(cacheKey, {
      ...result,
      timestamp: new Date().toISOString(),
      inputs: { manufacturer, appliance, brand, type }
    });

    res.json(result);
  } catch (error) {
    console.error('Base pricing error:', error);
    res.status(500).json({ error: 'Internal server error calculating base price' });
  }
});

// Tax calculation endpoint
app.post('/api/pricing/tax', async (req, res) => {
  try {
    const { state, basePrice, sessionId } = req.body;

    // Validation
    if (!state || !basePrice || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: state, basePrice, sessionId' 
      });
    }

    if (isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ 
        error: 'Invalid basePrice: must be a positive number' 
      });
    }

    console.log('Tax calculation request:', { state, basePrice, sessionId });

    const result = await PricingEngine.calculateTax(state, basePrice);
    
    // Cache the result
    const cacheKey = CacheManager.generateKey(sessionId, 'tax');
    await CacheManager.set(cacheKey, {
      ...result,
      timestamp: new Date().toISOString(),
      inputs: { state, basePrice }
    });

    res.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({ error: 'Internal server error calculating tax' });
  }
});

// Customer segment discount endpoint
app.post('/api/pricing/segment', async (req, res) => {
  try {
    const { customerSegment, basePrice, sessionId } = req.body;

    // Validation
    if (!customerSegment || !basePrice || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: customerSegment, basePrice, sessionId' 
      });
    }

    if (isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ 
        error: 'Invalid basePrice: must be a positive number' 
      });
    }

    console.log('Segment discount request:', { customerSegment, basePrice, sessionId });

    const result = await PricingEngine.getSegmentDiscount(customerSegment, basePrice);
    
    // Cache the result
    const cacheKey = CacheManager.generateKey(sessionId, 'segment');
    await CacheManager.set(cacheKey, {
      ...result,
      timestamp: new Date().toISOString(),
      inputs: { customerSegment, basePrice }
    });

    res.json(result);
  } catch (error) {
    console.error('Segment pricing error:', error);
    res.status(500).json({ error: 'Internal server error calculating segment discount' });
  }
});

// Final submission endpoint
app.post('/api/submit', async (req, res) => {
  try {
    const { sessionId, ...formData } = req.body;

    // Validation
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'manufacturer', 'appliance', 'state', 'customerSegment'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    console.log('Order submission request:', { sessionId, formData });

    // Retrieve all cached pricing data
    const cachedPricing = await CacheManager.getSessionData(sessionId);
    console.log('Retrieved cached pricing:', cachedPricing);
    
    // Calculate final price from cached data
    const basePrice = cachedPricing.base?.basePrice || 0;
    const tax = cachedPricing.tax?.tax || 0;
    const discount = cachedPricing.segment?.segmentDiscount || 0;
    const finalPrice = Math.round((basePrice + tax - discount) * 100) / 100;

    console.log('Final pricing calculation:', { basePrice, tax, discount, finalPrice });

    // Database transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert customer data
      const [customerResult] = await connection.execute(
        `INSERT INTO customers (first_name, last_name, email, phone, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [formData.firstName, formData.lastName, formData.email, formData.phone]
      );

      const customerId = customerResult.insertId;
      console.log('Customer created with ID:', customerId);

      // Insert order data
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
           customer_id, manufacturer, appliance, brand, type, state, 
           customer_segment, base_price, tax, discount, final_price, 
           session_id, pricing_breakdown, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          customerId,
          formData.manufacturer,
          formData.appliance,
          formData.brand || null,
          formData.type || null,
          formData.state,
          formData.customerSegment,
          basePrice,
          tax,
          discount,
          finalPrice,
          sessionId,
          JSON.stringify(cachedPricing)
        ]
      );

      const orderId = orderResult.insertId;
      console.log('Order created with ID:', orderId);

      await connection.commit();

      // Clean up cache after successful submission
      await CacheManager.clearSession(sessionId);

      res.json({
        success: true,
        orderId: `ORD_${orderId.toString().padStart(6, '0')}`,
        customerId: customerId,
        finalPrice: finalPrice,
        message: 'Order submitted successfully'
      });

    } catch (dbError) {
      await connection.rollback();
      console.error('Database transaction failed:', dbError);
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit order. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting Progressive Pricing Service...');
    
    // Initialize Redis
    await initializeRedis();
    
    // Test database connection
    await testDatabaseConnection();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API available at: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 Ready to receive requests from frontend!`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
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

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
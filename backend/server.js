// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Redis Client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Pricing calculation functions
class PricingEngine {
  static async getBasePrice(manufacturer, appliance, brand, type) {
    // Simulate complex pricing logic
    const basePrices = {
      'whirlpool': { 'washing-machine': 450, 'refrigerator': 800, 'dishwasher': 350, 'dryer': 400 },
      'ge': { 'washing-machine': 420, 'refrigerator': 750, 'dishwasher': 320, 'dryer': 380 },
      'samsung': { 'washing-machine': 520, 'refrigerator': 900, 'dishwasher': 400, 'dryer': 450 },
      'lg': { 'washing-machine': 500, 'refrigerator': 850, 'dishwasher': 380, 'dryer': 430 }
    };

    const basePrice = basePrices[manufacturer]?.[appliance] || 300;
    
    // Add premium for specific brands/types
    let premium = 0;
    if (brand && brand.toLowerCase().includes('premium')) premium += 100;
    if (type && type.toLowerCase().includes('smart')) premium += 150;

    return {
      basePrice: basePrice + premium,
      breakdown: [
        `Base price for ${manufacturer} ${appliance}`,
        ...(premium > 0 ? [`Premium features: +$${premium}`] : [])
      ]
    };
  }

  static async calculateTax(state, basePrice) {
    const taxRates = {
      'CA': 0.0875,
      'NY': 0.08,
      'TX': 0.0625,
      'FL': 0.06,
      'WA': 0.065
    };

    const taxRate = taxRates[state] || 0.05;
    const tax = Math.round(basePrice * taxRate);

    return {
      tax,
      taxRate: taxRate * 100,
      breakdown: [`${(taxRate * 100).toFixed(2)}% tax for ${state}`]
    };
  }

  static async getSegmentDiscount(customerSegment, basePrice) {
    const discountRates = {
      'premium': 0.15,
      'standard': 0.05,
      'basic': 0
    };

    const discountRate = discountRates[customerSegment] || 0;
    const discount = Math.round(basePrice * discountRate);

    return {
      segmentDiscount: discount,
      discountRate: discountRate * 100,
      breakdown: discount > 0 ? [`${(discountRate * 100)}% ${customerSegment} customer discount`] : []
    };
  }
}

// Cache helper functions
class CacheManager {
  static generateKey(sessionId, step) {
    return `pricing:${sessionId}:${step}`;
  }

  static async set(key, data, expiration = 3600) {
    await redisClient.setEx(key, expiration, JSON.stringify(data));
  }

  static async get(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
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

    return data;
  }
}

// API Routes

// Base price endpoint
app.post('/api/pricing/base', async (req, res) => {
  try {
    const { manufacturer, appliance, brand, type, sessionId } = req.body;

    if (!manufacturer || !appliance || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tax calculation endpoint
app.post('/api/pricing/tax', async (req, res) => {
  try {
    const { state, basePrice, sessionId } = req.body;

    if (!state || !basePrice || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer segment discount endpoint
app.post('/api/pricing/segment', async (req, res) => {
  try {
    const { customerSegment, basePrice, sessionId } = req.body;

    if (!customerSegment || !basePrice || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Final submission endpoint
app.post('/api/submit', async (req, res) => {
  try {
    const { sessionId, ...formData } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve all cached pricing data
    const cachedPricing = await CacheManager.getSessionData(sessionId);
    
    // Calculate final price from cached data
    const basePrice = cachedPricing.base?.basePrice || 0;
    const tax = cachedPricing.tax?.tax || 0;
    const discount = cachedPricing.segment?.segmentDiscount || 0;
    const finalPrice = basePrice + tax - discount;

    // Insert into MySQL database
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

      await connection.commit();

      // Clean up cache after successful submission
      const steps = ['base', 'tax', 'segment'];
      for (const step of steps) {
        const key = CacheManager.generateKey(sessionId, step);
        await redisClient.del(key);
      }

      res.json({
        success: true,
        orderId: `ORD_${orderResult.insertId}`,
        customerId: customerId,
        finalPrice: finalPrice
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redisClient.ping();
    
    // Check MySQL connection
    await pool.execute('SELECT 1');
    
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
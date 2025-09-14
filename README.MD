# Progressive Pricing Service

A modern web application that provides real-time pricing calculations as users fill out an appliance registration form. The system uses progressive pricing where the final cost is calculated step-by-step based on manufacturer, location, and customer type.

## 🏗️ System Architecture

```
Frontend (React)  →  Backend API (Node.js)  →  Database (MySQL)
                           ↓
                     Cache Layer (Redis)
```

- **Frontend**: React form with real-time pricing updates
- **Backend**: Node.js API that processes pricing calculations
- **Cache**: Redis stores intermediate pricing calculations
- **Database**: MySQL stores final orders and customer data

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Frontend Service](#frontend-service)
- [Backend Service](#backend-service)
- [Database Service](#database-service)
- [Testing the Complete System](#testing-the-complete-system)
- [Monitoring & Debugging](#monitoring--debugging)
- [Troubleshooting](#troubleshooting)
- [Development Commands](#development-commands)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Docker Desktop** (for Mac/Windows) or Docker Engine (for Linux)
- **Git** (for version control)
- **Web Browser** (Chrome, Firefox, Safari, etc.)

### Check Your Installation
```bash
# Check Node.js version
node --version

# Check Docker installation
docker --version
docker-compose --version

# Check if ports are available
lsof -i :3000  # React frontend port
lsof -i :3001  # Backend API port
lsof -i :3306  # MySQL port
lsof -i :6379  # Redis port
lsof -i :8080  # phpMyAdmin port
```

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd progressive-pricing-service

# Project structure should look like:
# progressive-pricing-service/
# ├── frontend/
# ├── backend/
# ├── database/
# └── docker-compose.yml
```

### 2. Start the Database Services
```bash
# Start MySQL and Redis containers
docker-compose up -d

# Verify containers are running
docker ps

# You should see 3 containers:
# - appliance_mysql (port 3306)
# - appliance_redis (port 6379) 
# - appliance_phpmyadmin (port 8080)
```

### 3. Start the Backend API
```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start the backend server
npm run dev

# Should see: ✅ Server running on port 3001
```

### 4. Start the Frontend
```bash
# Open a new terminal
cd frontend

# Install dependencies (first time only)
npm install

# Start the React development server
npm start

# Should open browser at http://localhost:3000
```

### 5. Test the Application
1. Open http://localhost:3000 in your browser
2. Fill out the appliance registration form
3. Watch pricing update in real-time
4. Submit the form
5. Check that data was saved to database

## 🎨 Frontend Service

### Overview
The frontend is a React application that provides an interactive form for appliance registration with real-time pricing calculations.

### Key Features
- **Progressive Pricing**: Pricing updates as fields are completed
- **Real-time Updates**: AJAX calls to backend API
- **Form Validation**: Client-side validation with error messages
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Visual feedback during API calls

### How to Start Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm start

# Or use yarn
yarn start
```

**The frontend will be available at: http://localhost:3000**

### How to Test Frontend
1. **Basic Functionality Test**:
   - Fill out manufacturer and appliance type
   - Verify base price appears in pricing panel
   - Add state selection
   - Verify tax calculation updates
   - Select customer segment
   - Verify discount calculation

2. **Form Validation Test**:
   - Try submitting empty form
   - Verify error messages appear
   - Enter invalid email format
   - Verify email validation works

3. **Network Test**:
   - Open browser Developer Tools (F12)
   - Go to Network tab
   - Fill out form and watch API calls
   - Verify calls to `/api/pricing/base`, `/api/pricing/tax`, `/api/pricing/segment`

### Frontend Configuration
The frontend connects to the backend via environment variables:

```bash
# Create frontend/.env (optional)
REACT_APP_API_URL=http://localhost:3001
```

### Frontend Monitoring
```bash
# View development server logs
# Logs appear in terminal where you ran 'npm start'

# Build for production
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

## ⚙️ Backend Service

### Overview
The backend is a Node.js/Express API that handles pricing calculations, caches intermediate results in Redis, and saves final data to MySQL.

### Key Features
- **Progressive Pricing API**: Three endpoints for step-by-step pricing
- **Redis Caching**: Fast intermediate result storage
- **MySQL Integration**: Persistent data storage
- **Session Management**: Tracks user sessions across pricing steps
- **Error Handling**: Comprehensive validation and error responses
- **Security**: Rate limiting, CORS, helmet protection

### API Endpoints
- `GET /health` - Service health check
- `POST /api/pricing/base` - Calculate base price
- `POST /api/pricing/tax` - Calculate tax based on state
- `POST /api/pricing/segment` - Apply customer segment discount
- `POST /api/submit` - Submit final order

### How to Start Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Start development server with auto-reload
npm run dev

# Or start without auto-reload
npm start
```

**The backend will be available at: http://localhost:3001**

### Backend Configuration
Create `backend/.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=rootpassword123
DB_NAME=appliance_registration
DB_PORT=3306

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### How to Test Backend

#### 1. Health Check
```bash
# Test if backend is running
curl http://localhost:3001/health

# Or open in browser: http://localhost:3001/health
# Should return: {"status":"healthy","timestamp":"...","services":{"redis":"connected","mysql":"connected"}}
```

#### 2. API Endpoint Tests
```bash
# Test base pricing endpoint
curl -X POST http://localhost:3001/api/pricing/base \
  -H "Content-Type: application/json" \
  -d '{"manufacturer":"whirlpool","appliance":"washing-machine","brand":"Cabrio","type":"Top Load","sessionId":"test_session_123"}'

# Test tax calculation endpoint  
curl -X POST http://localhost:3001/api/pricing/tax \
  -H "Content-Type: application/json" \
  -d '{"state":"CA","basePrice":450,"sessionId":"test_session_123"}'

# Test segment discount endpoint
curl -X POST http://localhost:3001/api/pricing/segment \
  -H "Content-Type: application/json" \
  -d '{"customerSegment":"premium","basePrice":450,"sessionId":"test_session_123"}'
```

#### 3. Full Submission Test
```bash
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"test_session_123",
    "firstName":"John",
    "lastName":"Doe", 
    "email":"john@example.com",
    "phone":"555-1234",
    "manufacturer":"whirlpool",
    "appliance":"washing-machine",
    "brand":"Cabrio",
    "type":"Top Load",
    "state":"CA",
    "customerSegment":"premium"
  }'
```

### Backend Monitoring
```bash
# View real-time logs
npm run dev
# Logs will show all API requests, database queries, and Redis operations

# View specific log types
# All logs include timestamps and request details

# Monitor API response times
# Look for "Processing time" in logs

# Check memory usage
node -e "console.log(process.memoryUsage())"
```

## 💾 Database Service

### Overview
The database service consists of MySQL for persistent storage and Redis for caching, both running in Docker containers.

### Database Schema
- **customers**: Customer information (name, email, phone)
- **orders**: Order details with pricing breakdown
- **pricing_history**: Audit trail of pricing calculations (future feature)

### How to Start Database Services
```bash
# Start both MySQL and Redis containers
docker-compose up -d

# Start only MySQL
docker-compose up -d mysql

# Start only Redis
docker-compose up -d redis

# View container status
docker ps

# View container logs
docker logs appliance_mysql
docker logs appliance_redis
```

### How to Test Database

#### 1. Test MySQL Connection
```bash
# Connect to MySQL via Docker
docker exec -it appliance_mysql mysql -u root -p
# Password: rootpassword123

# Once connected, test the database:
SHOW DATABASES;
USE appliance_registration;
SHOW TABLES;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM orders;
EXIT;
```

#### 2. Test Redis Connection
```bash
# Test Redis connectivity
docker exec -it appliance_redis redis-cli ping
# Should respond: PONG

# Connect to Redis CLI
docker exec -it appliance_redis redis-cli

# Test Redis operations:
SET test "Hello World"
GET test
EXISTS test
DEL test
EXIT
```

### Database Administration

#### MySQL Management

##### Via Command Line:
```bash
# Connect to database
docker exec -it appliance_mysql mysql -u root -p

# Common queries
USE appliance_registration;

# View recent orders with nice formatting
SELECT 
    o.id as order_id,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    o.manufacturer,
    o.appliance,
    o.final_price,
    o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC 
LIMIT 5\G

# View customers
SELECT * FROM customers ORDER BY created_at DESC LIMIT 5\G

# View JSON pricing breakdown nicely formatted
SELECT 
    id,
    session_id,
    JSON_PRETTY(pricing_breakdown) as pricing_details
FROM orders 
ORDER BY created_at DESC 
LIMIT 1\G
```

##### Via phpMyAdmin Web Interface:
1. Open browser: **http://localhost:8080**
2. Login:
   - Username: `root`
   - Password: `rootpassword123`
3. Click on `appliance_registration` database
4. Browse tables with nice formatting, sorting, and search

#### Redis Management

##### Monitor Cache Activity:
```bash
# Watch all Redis commands in real-time
docker exec -it appliance_redis redis-cli MONITOR

# View all pricing cache keys
docker exec -it appliance_redis redis-cli KEYS "pricing:*"

# View specific cached data
docker exec -it appliance_redis redis-cli GET "pricing:session_123:base"

# View Redis memory usage
docker exec -it appliance_redis redis-cli INFO memory

# Clear all cache (if needed)
docker exec -it appliance_redis redis-cli FLUSHALL
```

### Database Backup & Restore

#### MySQL Backup:
```bash
# Create backup
docker exec appliance_mysql mysqldump -u root -prootpassword123 appliance_registration > backup.sql

# Restore from backup
docker exec -i appliance_mysql mysql -u root -prootpassword123 appliance_registration < backup.sql
```

#### Stop/Start Database Services:
```bash
# Stop all database services
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v

# Start fresh (will recreate database with init.sql)
docker-compose up -d

# Restart single service
docker restart appliance_mysql
docker restart appliance_redis
```

## 🧪 Testing the Complete System

### End-to-End Test Flow

1. **Start All Services**:
   ```bash
   # Terminal 1: Start database services
   docker-compose up -d
   
   # Terminal 2: Start backend
   cd backend && npm run dev
   
   # Terminal 3: Start frontend  
   cd frontend && npm start
   ```

2. **Verify Service Health**:
   - Backend health: http://localhost:3001/health
   - Frontend app: http://localhost:3000
   - Database admin: http://localhost:8080

3. **Test the User Flow**:
   - Open http://localhost:3000
   - Fill manufacturer: "Samsung"
   - Fill appliance: "Refrigerator"
   - Fill brand: "Family Hub"
   - Fill type: "Smart French Door"
   - **Check**: Base price should appear (~$900)
   - Fill state: "CA"  
   - **Check**: Tax should be added (~$78)
   - Fill customer segment: "Premium"
   - **Check**: Discount should be applied (~$135)
   - Fill personal details and submit
   - **Check**: Success message with order ID

4. **Verify Data Storage**:
   ```bash
   # Check MySQL for new order
   docker exec -it appliance_mysql mysql -u root -p
   USE appliance_registration;
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1\G
   
   # Check Redis cache was cleared
   docker exec -it appliance_redis redis-cli KEYS "pricing:*"
   # Should be empty after successful submission
   ```

### Performance Testing
```bash
# Test API response times
time curl -X POST http://localhost:3001/api/pricing/base \
  -H "Content-Type: application/json" \
  -d '{"manufacturer":"whirlpool","appliance":"washing-machine","sessionId":"test"}'

# Load test (if you have 'ab' installed)
ab -n 100 -c 10 http://localhost:3001/health
```

### Error Testing
1. **Test offline mode**: Stop backend, verify frontend shows fallback calculations
2. **Test validation**: Submit form with missing fields
3. **Test database errors**: Stop MySQL, verify graceful error handling
4. **Test Redis errors**: Stop Redis, verify system still functions

## 📊 Monitoring & Debugging

### Backend Monitoring
```bash
# View real-time API logs
cd backend && npm run dev

# Key log messages to watch for:
# ✅ Connected to Redis
# ✅ Connected to MySQL Database
# ✅ Server running on port 3001
# Base price request: {...}
# Cache set: pricing:session_xxx:base
# Order submission request: {...}
```

### Frontend Monitoring
```bash
# View React development logs
cd frontend && npm start

# Browser Developer Tools:
# F12 → Console: View JavaScript errors
# F12 → Network: View API calls and response times
# F12 → Application → Local Storage: View session data
```

### Database Monitoring
```bash
# Monitor MySQL queries
docker exec -it appliance_mysql mysql -u root -p
SET GLOBAL general_log = 'ON';
SHOW VARIABLES LIKE 'general_log%';

# Monitor Redis operations
docker exec -it appliance_redis redis-cli MONITOR

# Check container resource usage
docker stats appliance_mysql appliance_redis
```

### Cache Monitoring
```bash
# Watch cache operations in real-time
docker exec -it appliance_redis redis-cli MONITOR

# View cache hit/miss patterns
docker exec -it appliance_redis redis-cli INFO stats

# Monitor memory usage
docker exec -it appliance_redis redis-cli INFO memory
```

### System Health Dashboard
Create a simple monitoring script:
```bash
#!/bin/bash
# health-check.sh

echo "=== System Health Check ==="
echo

echo "📡 Backend API:"
curl -s http://localhost:3001/health | jq '.status' || echo "❌ Backend down"

echo "🗄️  Database:"
docker exec appliance_mysql mysqladmin ping -u root -prootpassword123 > /dev/null 2>&1 && echo "✅ MySQL healthy" || echo "❌ MySQL down"

echo "💾 Cache:"
docker exec appliance_redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis healthy" || echo "❌ Redis down"

echo "🌐 Frontend:"
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend accessible" || echo "❌ Frontend down"

echo
echo "🐳 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🔧 Troubleshooting

### Common Issues

#### Frontend Issues
**Issue**: "Cannot connect to backend API"
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check CORS configuration in backend .env
CORS_ORIGIN=http://localhost:3000

# Check browser console for CORS errors
```

**Issue**: "Form not updating prices"
```bash
# Check browser Network tab for failed API calls
# Check backend logs for errors
# Verify all required form fields are filled
```

#### Backend Issues
**Issue**: "Cannot connect to database"
```bash
# Verify MySQL container is running
docker ps | grep mysql

# Test database connection
docker exec -it appliance_mysql mysql -u root -p

# Check backend .env configuration
DB_HOST=localhost
DB_PASSWORD=rootpassword123
```

**Issue**: "Redis connection failed"
```bash
# Verify Redis container is running
docker ps | grep redis

# Test Redis connection
docker exec -it appliance_redis redis-cli ping

# Check Redis logs
docker logs appliance_redis
```

#### Database Issues
**Issue**: "Tables don't exist"
```bash
# Recreate database with init.sql
docker-compose down
docker volume rm $(docker volume ls -q | grep mysql)
docker-compose up -d

# Manually create tables
docker exec -it appliance_mysql mysql -u root -p < database/init.sql
```

**Issue**: "Port conflicts"
```bash
# Check what's using ports
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Change ports in docker-compose.yml if needed
```

### Performance Issues
**Issue**: "Slow API responses"
```bash
# Check Redis cache hit rates
docker exec -it appliance_redis redis-cli INFO stats

# Monitor MySQL query performance
docker exec -it appliance_mysql mysql -u root -p
SHOW PROCESSLIST;

# Check Docker container resources
docker stats
```

### Debug Mode
Enable detailed logging:
```bash
# Backend debug mode
export LOG_LEVEL=debug
npm run dev

# MySQL query logging
docker exec -it appliance_mysql mysql -u root -p
SET GLOBAL general_log = 'ON';

# Redis verbose logging
docker exec appliance_redis redis-server --loglevel verbose
```

## 💻 Development Commands

### Quick Start Commands
```bash
# Start everything
docker-compose up -d && cd backend && npm run dev &
cd frontend && npm start

# Stop everything
docker-compose down
killall node  # Stop backend
# Ctrl+C in frontend terminal
```

### Development Workflow
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
cd frontend && npm install
cd backend && npm install

# Reset database with fresh data
docker-compose down -v
docker-compose up -d

# View logs
docker logs -f appliance_mysql
docker logs -f appliance_redis
# Backend logs in terminal
# Frontend logs in browser console
```

### Database Management
```bash
# Backup database
docker exec appliance_mysql mysqldump -u root -prootpassword123 appliance_registration > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i appliance_mysql mysql -u root -prootpassword123 appliance_registration < backup_20240115.sql

# Clear Redis cache
docker exec appliance_redis redis-cli FLUSHALL

# View recent orders
docker exec -it appliance_mysql mysql -u root -p -e "USE appliance_registration; SELECT o.id, CONCAT(c.first_name, ' ', c.last_name) as customer, o.final_price, o.created_at FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 10;"
```

### Useful Scripts
```bash
# Create these as shell scripts for convenience

# restart-all.sh
#!/bin/bash
docker-compose down
docker-compose up -d
sleep 10
cd backend && npm run dev

# check-health.sh  
#!/bin/bash
curl -s http://localhost:3001/health | jq
docker exec appliance_redis redis-cli ping
docker exec appliance_mysql mysqladmin ping -u root -prootpassword123

# view-recent-orders.sh
#!/bin/bash
docker exec -it appliance_mysql mysql -u root -p -e "
USE appliance_registration; 
SELECT 
  o.id as order_id,
  CONCAT(c.first_name, ' ', c.last_name) as customer_name,
  o.manufacturer,
  o.appliance, 
  o.final_price,
  DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') as created
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
ORDER BY o.created_at DESC 
LIMIT 10;"
```

---

## 🎉 Congratulations!

You now have a fully functional progressive pricing service with:
- ✅ Real-time pricing calculations
- ✅ Redis caching for performance  
- ✅ MySQL database for persistence
- ✅ Comprehensive monitoring and debugging tools
- ✅ Professional development workflow

The system is ready for production deployment with proper scaling, security, and monitoring enhancements.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the logs using the monitoring commands
3. Test individual components using the provided test commands
4. Check GitHub issues for common problems

---
*Last updated: January 2024*
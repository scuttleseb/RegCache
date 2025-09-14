# Progressive Pricing Frontend

A modern React application that provides an interactive appliance registration form with real-time pricing calculations. The pricing updates dynamically as users fill out form fields, providing instant feedback on costs including base price, taxes, and customer segment discounts.

## 🎯 Overview

This React frontend is part of a larger Progressive Pricing Service that calculates appliance pricing in real-time. The application features:

- **Progressive Pricing Display**: Pricing panel updates as form fields are completed
- **Real-time API Integration**: Makes AJAX calls to backend for live calculations
- **Professional Form Design**: Modern, responsive UI with validation
- **Session Management**: Tracks user sessions for pricing calculations
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

```
User Input → React Form → API Calls → Backend → Redis Cache
     ↓                                              ↓
Pricing Panel ← Real-time Updates ← JSON Response ← MySQL Database
```

### Key Components:
- **ProgressivePricingForm**: Main form component with pricing logic
- **Pricing Panel**: Sticky sidebar showing live pricing breakdown  
- **Form Validation**: Client-side validation with error handling
- **API Integration**: Fetch-based HTTP client for backend communication

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Development](#development)
- [API Integration](#api-integration)
- [Styling & Customization](#styling--customization)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## 🔧 Prerequisites

Before starting, ensure you have:

### Required Software:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for version control)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Backend Services (Required):
- **Backend API** running on `http://localhost:3001`
- **MySQL Database** with appliance registration schema
- **Redis Cache** for session management

### Verify Prerequisites:
```bash
# Check Node.js version
node --version
# Should show v18.0.0 or higher

# Check npm version  
npm --version

# Verify backend is running
curl http://localhost:3001/health
# Should return: {"status":"healthy"}

# Check if frontend port is available
lsof -i :3000
# Should return empty (port available)
```

## 🚀 Installation

### 1. Navigate to Frontend Directory
```bash
# From project root
cd frontend
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install

# Verify installation
npm list --depth=0
```

### 3. Verify Package Installation
Key packages that should be installed:
- **react**: Core React library
- **lucide-react**: Icon components
- **Custom CSS**: Professional styling (no external CSS framework needed)

## ⚙️ Configuration

### Environment Variables
Create `frontend/.env` (optional):
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3001

# Development settings
REACT_APP_DEBUG=true
REACT_APP_ENV=development

# Production settings (for deployment)
# REACT_APP_API_URL=https://your-production-api.com
# REACT_APP_ENV=production
```

### Default Configuration
If no `.env` file is provided, the application uses these defaults:
- **API URL**: `http://localhost:3001`
- **Development Mode**: Enabled
- **Error Boundaries**: Enabled
- **Hot Reloading**: Enabled

### Browser Support
The application supports:
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🏃 Running the Application

### Development Server
```bash
# Start the development server
npm start

# Or with yarn
yarn start

# Or with custom port
PORT=3001 npm start
```

**The application will be available at: http://localhost:3000**

### What You Should See:
1. **Browser opens automatically** to http://localhost:3000
2. **Development server starts** with hot-reload enabled
3. **Console shows**: "webpack compiled successfully"
4. **Application loads** with the registration form

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000

# Or with yarn
yarn build
```

## 🧪 Testing

### Manual Testing Checklist

#### 1. Basic Functionality Test
```bash
# Start the application
npm start

# Open browser to http://localhost:3000
# Follow this test sequence:
```

**Test Steps:**
1. **Load Test**: Page loads without errors
2. **Form Fields Test**:
   - Select manufacturer: "Samsung"
   - Select appliance: "Refrigerator" 
   - Enter brand: "Family Hub"
   - Enter type: "Smart French Door"
   - **Expected**: Base price appears (~$900)

3. **Tax Calculation Test**:
   - Select state: "CA" (California)
   - **Expected**: Tax added (~$78.75)

4. **Discount Test**:
   - Select customer segment: "Premium"
   - **Expected**: Discount applied (~$135)

5. **Personal Info Test**:
   - Fill in name, email, phone
   - **Expected**: No errors, submit button enabled

6. **Submission Test**:
   - Click "Submit Registration"
   - **Expected**: Success message with order ID

#### 2. Error Handling Test
```bash
# Test form validation
```

**Validation Tests:**
1. **Empty Form Submission**: Try submitting without filling fields
2. **Invalid Email**: Enter "invalid-email" in email field
3. **Missing Required Fields**: Leave mandatory fields empty
4. **Network Error**: Stop backend and test offline mode

#### 3. Responsive Design Test
```bash
# Test mobile responsiveness
```

**Device Tests:**
1. **Desktop**: Full-width layout with sidebar
2. **Tablet**: Stacked layout, touch-friendly
3. **Mobile**: Single column, large touch targets

**Browser Dev Tools Test:**
- Press F12 → Toggle device toolbar
- Test iPhone, iPad, Android viewports
- Verify form is usable on all screen sizes

#### 4. Performance Test
```bash
# Test loading and response times
```

**Performance Checks:**
1. **Initial Load**: Page loads in < 2 seconds
2. **API Response**: Pricing updates in < 1 second
3. **Form Responsiveness**: No lag when typing
4. **Memory Usage**: No memory leaks during extended use

### Automated Testing
```bash
# Run tests (if test suite exists)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Browser Developer Tools Testing

#### Network Tab Testing:
1. Open **F12 → Network tab**
2. Fill out form step by step
3. **Expected API Calls**:
   - `POST /api/pricing/base` when manufacturer/appliance filled
   - `POST /api/pricing/tax` when state selected
   - `POST /api/pricing/segment` when customer segment selected
   - `POST /api/submit` when form submitted

#### Console Tab Testing:
1. Open **F12 → Console tab**
2. Look for errors or warnings
3. **Should be clean** (no red errors)
4. Debug logs available in development mode

#### Application Tab Testing:
1. Open **F12 → Application → Local Storage**
2. **Check session data** is stored properly
3. **Verify API responses** are cached appropriately

## 🛠️ Development

### Project Structure
```
frontend/
├── public/
│   ├── index.html          # HTML template
│   └── favicon.ico         # App icon
├── src/
│   ├── App.js              # Main application component
│   ├── App.css             # Custom styling
│   ├── index.js            # React app entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (optional)
└── README.md               # This file
```

### Key Files Explained

#### `src/App.js`
Main application component containing:
- **ProgressivePricingForm**: Form logic and state management
- **API Integration**: HTTP calls to backend
- **Pricing Calculations**: Real-time price updates
- **Form Validation**: Client-side validation
- **Error Handling**: Graceful error management

#### `src/App.css`  
Professional styling including:
- **Modern Design**: Clean, professional appearance
- **Responsive Layout**: Mobile-first approach
- **Form Styling**: Beautiful form inputs and buttons
- **Animation**: Smooth transitions and loading states
- **Color Scheme**: Professional blue/gray palette

### Development Commands
```bash
# Start development server
npm start

# Build for production  
npm run build

# Run tests
npm test

# Eject configuration (advanced)
npm run eject

# Analyze bundle size
npm run build
npm install -g serve
serve -s build

# Or use bundle analyzer
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

### Development Workflow
```bash
# Daily development routine
git pull origin main        # Get latest changes
npm install                 # Install new dependencies
npm start                   # Start development server

# Make changes to src/App.js or src/App.css
# Browser auto-refreshes with hot reload
# Test changes in browser
# Commit and push changes

git add .
git commit -m "Add new feature"
git push origin main
```

### Code Style Guidelines
- **ES6+ JavaScript**: Use modern JavaScript features
- **React Hooks**: Use functional components with hooks
- **CSS Custom Properties**: Use CSS variables for theming
- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: Include ARIA labels and semantic HTML

## 🔗 API Integration

### Backend API Endpoints Used

#### Base Pricing
```javascript
// Endpoint: POST /api/pricing/base
const response = await fetch('http://localhost:3001/api/pricing/base', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    manufacturer: 'samsung',
    appliance: 'refrigerator',
    brand: 'Family Hub',
    type: 'Smart French Door',
    sessionId: 'session_123456'
  })
});

// Expected Response:
{
  "basePrice": 900,
  "breakdown": [
    "Base price for samsung refrigerator: $750",
    "Premium features bonus: +$150"
  ]
}
```

#### Tax Calculation  
```javascript
// Endpoint: POST /api/pricing/tax
const response = await fetch('http://localhost:3001/api/pricing/tax', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'CA',
    basePrice: 900,
    sessionId: 'session_123456'
  })
});

// Expected Response:
{
  "tax": 78.75,
  "taxRate": 8.75,
  "breakdown": ["8.75% sales tax for CA: $78.75"]
}
```

#### Customer Segment Discount
```javascript
// Endpoint: POST /api/pricing/segment  
const response = await fetch('http://localhost:3001/api/pricing/segment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerSegment: 'premium',
    basePrice: 900,
    sessionId: 'session_123456'
  })
});

// Expected Response:
{
  "segmentDiscount": 135,
  "discountRate": 15,
  "breakdown": ["15% premium customer discount: -$135.00"]
}
```

#### Form Submission
```javascript
// Endpoint: POST /api/submit
const response = await fetch('http://localhost:3001/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123456',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    manufacturer: 'samsung',
    appliance: 'refrigerator',
    // ... other form data
  })
});

// Expected Response:
{
  "success": true,
  "orderId": "ORD_000123",
  "customerId": 456,
  "finalPrice": 843.75,
  "message": "Order submitted successfully"
}
```

### Error Handling
The frontend handles various error scenarios:

```javascript
// Network errors (backend down)
catch (error) {
  // Falls back to offline pricing calculations
  console.log('API unavailable, using offline mode');
  // Shows "(offline mode)" in pricing breakdown
}

// Validation errors (400 status)
if (response.status === 400) {
  // Shows specific field errors to user
  const error = await response.json();
  setErrors(error.fieldErrors);
}

// Server errors (500 status)  
if (response.status === 500) {
  // Shows generic error message
  alert('Server error. Please try again.');
}
```

## 🎨 Styling & Customization

### Color Scheme
The application uses a professional color palette:

```css
/* Primary Colors */
--primary-blue: #2563eb;      /* Buttons, accents */
--primary-gray: #374151;      /* Text */
--light-gray: #f9fafb;        /* Backgrounds */

/* Status Colors */
--success-green: #059669;     /* Discounts, success */
--error-red: #ef4444;         /* Errors, validation */
--warning-orange: #f59e0b;    /* Warnings */

/* Gradients */
--gradient-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-panel: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
```

### Typography
```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;       /* Small labels */
--text-sm: 0.875rem;      /* Form labels */
--text-base: 1rem;        /* Body text */
--text-lg: 1.125rem;      /* Subheadings */
--text-xl: 1.25rem;       /* Section headers */
--text-3xl: 2rem;         /* Main title */
```

### Layout System
```css
/* Responsive Grid */
.grid {
  display: grid;
  grid-template-columns: 1fr;    /* Mobile: single column */
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);  /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: 2fr 1fr;        /* Desktop: form + sidebar */
  }
}
```

### Customization Options

#### Change Primary Color:
```css
/* In src/App.css, update: */
.bg-blue-600 {
  background-color: #your-brand-color;
}

.text-blue-600 {
  color: #your-brand-color;
}
```

#### Modify Form Layout:
```css
/* Change form section background */
.bg-gray-50 {
  background-color: #your-background-color;
}

/* Adjust form spacing */
.gap-4 {
  gap: 20px; /* Increase spacing between form fields */
}
```

#### Update Pricing Panel:
```css
/* Change pricing panel gradient */
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #your-color1, #your-color2);
}
```

## ⚡ Performance

### Optimization Features
- **Code Splitting**: React automatically splits code for faster loading
- **Tree Shaking**: Unused code is eliminated in production builds
- **CSS Optimization**: Custom CSS is minified and optimized
- **Image Optimization**: Icons use lightweight SVG format
- **Lazy Loading**: Components load only when needed

### Performance Monitoring
```bash
# Check bundle size
npm run build
# Look for build/static files - should be under 500KB total

# Analyze performance
# Open Chrome DevTools → Lighthouse → Run audit
# Target scores: Performance >90, Accessibility >95
```

### Performance Best Practices
- **Minimize API calls**: Debounce form inputs if needed
- **Cache responses**: Store pricing calculations locally
- **Optimize images**: Use appropriate formats and sizes  
- **Reduce bundle size**: Only import needed libraries

### Loading Performance
- **First Load**: < 2 seconds
- **API Response**: < 1 second  
- **Form Interactions**: < 100ms
- **Page Navigation**: Instant (single-page app)

## 🔧 Troubleshooting

### Common Issues & Solutions

#### "Cannot connect to backend API"
```bash
# Check if backend is running
curl http://localhost:3001/health

# If backend is down:
cd ../backend && npm run dev

# Check CORS settings in backend .env:
CORS_ORIGIN=http://localhost:3000
```

#### "Form not updating prices"
```bash
# Check browser console for errors (F12 → Console)
# Look for failed API calls (F12 → Network)

# Common causes:
# 1. Backend not running
# 2. Incorrect API URL in .env
# 3. Missing form fields
# 4. Network connectivity issues
```

#### "Styling looks broken"
```bash
# Check if App.css is loading
# View source → look for <style> tags

# If CSS not loading:
# 1. Restart development server: npm start
# 2. Clear browser cache: Ctrl+F5
# 3. Check for CSS syntax errors in App.css
```

#### "Page won't load"
```bash
# Check if port 3000 is available
lsof -i :3000

# If port is busy:
PORT=3001 npm start

# Or kill the process:
killall node
npm start
```

#### "Hot reload not working"
```bash
# Restart development server
Ctrl+C  # Stop current server
npm start

# Clear npm cache if needed
npm cache clean --force
rm -rf node_modules
npm install
npm start
```

### Browser Compatibility Issues

#### Safari Issues:
```javascript
// If fetch API issues on older Safari:
// Add polyfill in public/index.html:
<script src="https://polyfill.io/v3/polyfill.min.js?features=fetch"></script>
```

#### Internet Explorer (not supported):
```bash
# IE is not supported. Minimum browser versions:
# Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
```

### Performance Troubleshooting

#### Slow Loading:
```bash
# Check network speed
# Open DevTools → Network → check load times

# If slow:
# 1. Check internet connection
# 2. Try production build: npm run build && serve -s build
# 3. Optimize images and assets
```

#### Memory Issues:
```bash
# Monitor memory usage
# Chrome DevTools → Memory → Take heap snapshot

# If memory leaks:
# 1. Check for unclosed event listeners
# 2. Clear state on component unmount
# 3. Avoid storing large objects in state
```

### Debug Mode
```bash
# Enable detailed logging
REACT_APP_DEBUG=true npm start

# Or add to .env file:
REACT_APP_DEBUG=true

# Then check browser console for detailed logs
```

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Build folder contents:
build/
├── static/
│   ├── css/    # Minified CSS
│   ├── js/     # Minified JavaScript  
│   └── media/  # Optimized assets
└── index.html  # Main HTML file
```

### Deployment Options

#### Static Hosting (Recommended)
```bash
# Deploy to Netlify
# 1. Connect GitHub repo to Netlify
# 2. Set build command: npm run build
# 3. Set publish directory: build
# 4. Add environment variables

# Deploy to Vercel  
npm install -g vercel
vercel --prod

# Deploy to GitHub Pages
npm install --save-dev gh-pages
# Add to package.json:
"homepage": "https://yourusername.github.io/your-repo",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
npm run deploy
```

#### Server Deployment
```bash
# Deploy to traditional server
npm run build
# Upload build/ folder contents to web server
# Configure web server to serve index.html for all routes
```

### Environment Configuration for Production
```env
# Production .env file:
REACT_APP_API_URL=https://your-production-api.com
REACT_APP_ENV=production
REACT_APP_DEBUG=false
```

### Production Checklist
- ✅ Environment variables configured
- ✅ API URLs point to production backend
- ✅ HTTPS enabled
- ✅ Error tracking configured
- ✅ Analytics setup (Google Analytics, etc.)
- ✅ Performance monitoring enabled
- ✅ Browser compatibility tested
- ✅ Mobile responsiveness verified

---

## 🎉 Success!

Your Progressive Pricing Frontend is now ready for development and production use. The application provides:

- ✅ **Real-time pricing calculations**
- ✅ **Professional, responsive design**  
- ✅ **Comprehensive error handling**
- ✅ **Mobile-friendly interface**
- ✅ **Production-ready performance**

## 📞 Support & Resources

- **React Documentation**: https://reactjs.org/docs/
- **Modern CSS Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS
- **Browser DevTools**: https://developers.google.com/web/tools/chrome-devtools
- **Performance Optimization**: https://web.dev/performance/

For issues specific to this application:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Test API endpoints manually
4. Verify backend service is running

---
*Last updated: January 2024*
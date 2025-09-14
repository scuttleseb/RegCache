import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, DollarSign, ShoppingCart } from 'lucide-react';
import './App.css';

const ProgressivePricingForm = () => {
  const [formData, setFormData] = useState({
    manufacturer: '',
    appliance: '',
    brand: '',
    type: '',
    state: '',
    customerSegment: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [pricing, setPricing] = useState({
    basePrice: 0,
    tax: 0,
    segmentDiscount: 0,
    finalPrice: 0,
    breakdown: []
  });

  const [loading, setLoading] = useState({
    basePrice: false,
    tax: false,
    segment: false,
    submitting: false
  });

  const [sessionId, setSessionId] = useState('');
  const [errors, setErrors] = useState({});

  // Generate session ID on component mount
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // API URLs - Microservices configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const BASE_PRICING_URL = process.env.REACT_APP_BASE_PRICING_URL || 'http://localhost:3002';

  // Enhanced API call function with microservice routing
  const apiCall = useCallback(async (endpoint, data) => {
    try {
      let url = `${API_BASE_URL}${endpoint}`;
      
      // Route base pricing calls to the microservice
      if (endpoint === '/api/pricing/base') {
        url = `${BASE_PRICING_URL}${endpoint}`;
        console.log(`🎯 Calling Base Pricing Microservice: ${url}`);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Log microservice responses
      if (endpoint === '/api/pricing/base' && result.metadata?.service) {
        console.log(`✅ Base Pricing Response from: ${result.metadata.service}`);
      }
      
      return result;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }, [API_BASE_URL, BASE_PRICING_URL]);

  // Base price calculation (manufacturer + appliance)
  useEffect(() => {
    if (formData.manufacturer && formData.appliance && formData.brand && formData.type) {
      setLoading(prev => ({ ...prev, basePrice: true }));
      
      apiCall('/api/pricing/base', {
        manufacturer: formData.manufacturer,
        appliance: formData.appliance,
        brand: formData.brand,
        type: formData.type,
        sessionId
      }).then(response => {
        console.log('Base pricing response:', response);
        setPricing(prev => ({
          ...prev,
          basePrice: response.basePrice,
          breakdown: response.breakdown,
          finalPrice: response.basePrice + prev.tax - prev.segmentDiscount
        }));
      }).catch(error => {
        console.error('Base pricing error:', error);
        // Fallback to mock data if microservice fails
        const fallbackPrice = 400;
        setPricing(prev => ({
          ...prev,
          basePrice: fallbackPrice,
          breakdown: [`Base price for ${formData.manufacturer} ${formData.appliance} (offline mode)`],
          finalPrice: fallbackPrice + prev.tax - prev.segmentDiscount
        }));
      }).finally(() => {
        setLoading(prev => ({ ...prev, basePrice: false }));
      });
    }
  }, [formData.manufacturer, formData.appliance, formData.brand, formData.type, sessionId, apiCall]);

  // Tax calculation (state)
  useEffect(() => {
    if (formData.state && pricing.basePrice > 0) {
      setLoading(prev => ({ ...prev, tax: true }));
      
      apiCall('/api/pricing/tax', {
        state: formData.state,
        basePrice: pricing.basePrice,
        sessionId
      }).then(response => {
        setPricing(prev => ({
          ...prev,
          tax: response.tax,
          breakdown: [...prev.breakdown.filter(item => !item.includes('tax')), ...response.breakdown],
          finalPrice: prev.basePrice + response.tax - prev.segmentDiscount
        }));
      }).catch(error => {
        console.error('Tax calculation error:', error);
        // Fallback tax calculation
        const taxRate = formData.state === 'CA' ? 0.0875 : formData.state === 'NY' ? 0.08 : 0.06;
        const fallbackTax = Math.floor(pricing.basePrice * taxRate);
        setPricing(prev => ({
          ...prev,
          tax: fallbackTax,
          breakdown: [...prev.breakdown.filter(item => !item.includes('tax')), `${(taxRate * 100).toFixed(2)}% tax for ${formData.state} (offline mode)`],
          finalPrice: prev.basePrice + fallbackTax - prev.segmentDiscount
        }));
      }).finally(() => {
        setLoading(prev => ({ ...prev, tax: false }));
      });
    }
  }, [formData.state, pricing.basePrice, sessionId, apiCall]);

  // Customer segment discount
  useEffect(() => {
    if (formData.customerSegment && pricing.basePrice > 0) {
      setLoading(prev => ({ ...prev, segment: true }));
      
      apiCall('/api/pricing/segment', {
        customerSegment: formData.customerSegment,
        basePrice: pricing.basePrice,
        sessionId
      }).then(response => {
        setPricing(prev => ({
          ...prev,
          segmentDiscount: response.segmentDiscount,
          breakdown: [...prev.breakdown.filter(item => !item.includes('discount')), ...response.breakdown],
          finalPrice: prev.basePrice + prev.tax - response.segmentDiscount
        }));
      }).catch(error => {
        console.error('Segment pricing error:', error);
        // Fallback discount calculation
        const discounts = { 'premium': 0.15, 'standard': 0.05, 'basic': 0 };
        const fallbackDiscount = Math.floor(pricing.basePrice * (discounts[formData.customerSegment] || 0));
        setPricing(prev => ({
          ...prev,
          segmentDiscount: fallbackDiscount,
          breakdown: [...prev.breakdown.filter(item => !item.includes('discount')), `${((discounts[formData.customerSegment] || 0) * 100).toFixed(0)}% ${formData.customerSegment} customer discount (offline mode)`],
          finalPrice: prev.basePrice + prev.tax - fallbackDiscount
        }));
      }).finally(() => {
        setLoading(prev => ({ ...prev, segment: false }));
      });
    }
  }, [formData.customerSegment, pricing.basePrice, sessionId, apiCall]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.appliance) newErrors.appliance = 'Appliance type is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.customerSegment) newErrors.customerSegment = 'Customer segment is required';

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(prev => ({ ...prev, submitting: true }));
    
    try {
      const response = await apiCall('/api/submit', {
        ...formData,
        pricing,
        sessionId
      });
      
      alert(`Order submitted successfully! Order ID: ${response.orderId}`);
      
      // Reset form
      setFormData({
        manufacturer: '',
        appliance: '',
        brand: '',
        type: '',
        state: '',
        customerSegment: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      setPricing({
        basePrice: 0,
        tax: 0,
        segmentDiscount: 0,
        finalPrice: 0,
        breakdown: []
      });
      
    } catch (error) {
      alert('Submission failed. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appliance Registration</h1>
        <p className="text-gray-600">Get real-time pricing as you complete your registration</p>
        {/* Development info - remove in production */}
        <div className="mt-2 text-xs text-gray-500">
          Base Pricing: {BASE_PRICING_URL} | Main API: {API_BASE_URL}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-gray-50 p-6 rounded-lg form-section">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer *
                  </label>
                  <select
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    className={errors.manufacturer ? 'border-red-500' : ''}
                  >
                    <option value="">Select manufacturer</option>
                    <option value="whirlpool">Whirlpool</option>
                    <option value="ge">GE</option>
                    <option value="samsung">Samsung</option>
                    <option value="lg">LG</option>
                  </select>
                  {errors.manufacturer && <p className="error-message">{errors.manufacturer}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appliance Type *
                  </label>
                  <select
                    value={formData.appliance}
                    onChange={(e) => handleInputChange('appliance', e.target.value)}
                    className={errors.appliance ? 'border-red-500' : ''}
                  >
                    <option value="">Select appliance</option>
                    <option value="washing-machine">Washing Machine</option>
                    <option value="refrigerator">Refrigerator</option>
                    <option value="dishwasher">Dishwasher</option>
                    <option value="dryer">Dryer</option>
                  </select>
                  {errors.appliance && <p className="error-message">{errors.appliance}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand model"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type/Model
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="Enter specific model"
                  />
                </div>
              </div>
            </div>

            {/* Location & Customer Info */}
            <div className="bg-gray-50 p-6 rounded-lg form-section">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Location & Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={errors.state ? 'border-red-500' : ''}
                  >
                    <option value="">Select state</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="WA">Washington</option>
                  </select>
                  {errors.state && <p className="error-message">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Segment *
                  </label>
                  <select
                    value={formData.customerSegment}
                    onChange={(e) => handleInputChange('customerSegment', e.target.value)}
                    className={errors.customerSegment ? 'border-red-500' : ''}
                  >
                    <option value="">Select segment</option>
                    <option value="premium">Premium Customer</option>
                    <option value="standard">Standard Customer</option>
                    <option value="basic">Basic Customer</option>
                  </select>
                  {errors.customerSegment && <p className="error-message">{errors.customerSegment}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && <p className="error-message">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && <p className="error-message">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="error-message">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="error-message">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading.submitting || isAnyLoading}
              className={`${loading.submitting || isAnyLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
            >
              {loading.submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Submit Registration
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br pricing-panel p-6 rounded-lg sticky top-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Live Pricing</h2>
            </div>

            {isAnyLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-2 text-gray-600">Calculating pricing...</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Base Price:</span>
                <span className="font-semibold">
                  {loading.basePrice ? '...' : `$${pricing.basePrice.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Tax:</span>
                <span className="font-semibold">
                  {loading.tax ? '...' : `$${pricing.tax.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-semibold">
                  {loading.segment ? '...' : `-$${pricing.segmentDiscount.toLocaleString()}`}
                </span>
              </div>

              <hr className="border-gray-300" />

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Final Price:</span>
                <span>${pricing.finalPrice.toLocaleString()}</span>
              </div>

              {pricing.breakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t pricing-breakdown">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Pricing Breakdown:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {pricing.breakdown.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Session ID: {sessionId.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <ProgressivePricingForm />
    </div>
  );
}

export default App;
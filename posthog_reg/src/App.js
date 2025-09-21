import React, { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react'; // Changed this line
import './App.css';
/* eslint-disable react-hooks/exhaustive-deps */
function App() {
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Changed: Use PostHog hook instead of manual init
  const posthog = usePostHog();

  useEffect(() => {
    // Changed: No manual init, just capture pageview
    if (posthog) {
      posthog.capture('$pageview', {
        page_title: 'Negotiation Course Registration',
        page_type: 'registration_form'
      });
    }
  }, [posthog]);

  // Everything else stays EXACTLY the same
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputFocus = (fieldName) => {
    if (posthog) {
      posthog.capture('form_field_focused', {
        field_name: fieldName
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // 🎯 Your registration tracking - stays the same!
      if (posthog) {
        posthog.capture('registration_button_clicked', {
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone,
          course_type: 'negotiation_mastery',
          registration_date: new Date().toISOString(),
          form_location: 'main_registration_page'
        });

        posthog.identify(formData.email, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          interested_course: 'negotiation_mastery'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (posthog) {
        posthog.capture('registration_completed', {
          user_email: formData.email,
          course_type: 'negotiation_mastery'
        });
      }

      setShowSuccess(true);
      setFormData({ name: '', email: '', phone: '' });

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Registration failed:', error);
      if (posthog) {
        posthog.capture('registration_error', {
          error_message: error.message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.phone;

  // Your entire JSX stays EXACTLY the same
  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Negotiation Mastery</h1>
          <p className="subtitle">
            Join our exclusive course for adults who want to master the art of negotiation
          </p>
        </div>

        <div className="benefits">
          <h3>What You'll Learn:</h3>
          <div className="benefit-list">
            <div className="benefit-item">✓ Advanced negotiation strategies</div>
            <div className="benefit-item">✓ Win-win communication techniques</div>
            <div className="benefit-item">✓ Salary and contract negotiation</div>
            <div className="benefit-item">✓ Conflict resolution skills</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onFocus={() => handleInputFocus('name')}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={() => handleInputFocus('email')}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              onFocus={() => handleInputFocus('phone')}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <button
            type="submit"
            className={`register-btn ${(!isFormValid || isSubmitting) ? 'disabled' : ''}`}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              'Register Your Interest'
            )}
          </button>
        </form>

        {showSuccess && (
          <div className="success-message">
            <strong>Thank you for registering!</strong>
            <br />
            We'll contact you soon with course details.
          </div>
        )}

        <div className="security-note">
          🔒 Your information is secure and will never be shared
        </div>
      </div>
    </div>
  );
}
// ... rest of your files obviously stay the same
export default App;
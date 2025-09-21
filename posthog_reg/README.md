# 🎯 Negotiation Course Registration App

A React application with PostHog analytics to track user registrations for a negotiation mastery course.

![Registration Form](https://img.shields.io/badge/React-19.1.1-blue) ![PostHog](https://img.shields.io/badge/PostHog-Analytics-orange) ![License](https://img.shields.io/badge/License-MIT-green)

## 📋 What This App Does

- **Registration Form**: Collects name, email, and phone for course signup
- **Analytics Tracking**: Monitors user behavior with PostHog
- **Real-time Insights**: Tracks button clicks, form interactions, and conversions
- **Beautiful UI**: Modern gradient design with smooth animations

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/posthog_reg.git
cd posthog_reg
npm install
```

### 2. Get PostHog Credentials
1. Sign up at [PostHog.com](https://posthog.com/signup)
2. Go to **Project Settings** → **API Keys**
3. Copy your **Project API Key** (starts with `phc_`)
4. Note your region: **US** or **EU**

### 3. Create Environment File
Create `.env` in the project root:
```bash
# Replace with your actual PostHog credentials
REACT_APP_POSTHOG_KEY=phc_your_api_key_here
REACT_APP_POSTHOG_HOST=https://eu.i.posthog.com

# Hide source map warnings
GENERATE_SOURCEMAP=false
```

### 4. Start Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📊 PostHog Analytics Features

### 🎯 Key Events Tracked
| Event | When It Fires | Why It Matters |
|-------|---------------|----------------|
| `registration_button_clicked` | User submits form | **Main conversion metric** |
| `form_field_focused` | User clicks form fields | Measures engagement |
| `$pageview` | Page loads | Tracks traffic |
| `registration_completed` | Successful submission | Conversion success rate |

### 📈 Data Captured
```javascript
// Example registration event data
{
  user_name: "John Doe",
  user_email: "john@example.com", 
  user_phone: "+1 (555) 123-4567",
  course_type: "negotiation_mastery",
  registration_date: "2025-01-01T12:00:00.000Z"
}
```

### 🔧 PostHog Implementation

**Provider Setup (index.js)**
```javascript
import { PostHogProvider } from 'posthog-js/react';

<PostHogProvider
  apiKey={process.env.REACT_APP_POSTHOG_KEY}
  options={{
    api_host: process.env.REACT_APP_POSTHOG_HOST,
    person_profiles: 'identified_only'
  }}
>
  <App />
</PostHogProvider>
```

**Event Tracking (App.js)**
```javascript
import { usePostHog } from 'posthog-js/react';

const posthog = usePostHog();

// Track registration button click
posthog.capture('registration_button_clicked', {
  user_name: formData.name,
  user_email: formData.email,
  user_phone: formData.phone,
  course_type: 'negotiation_mastery'
});
```

## 📊 Viewing Analytics in PostHog

### Live Events
- Go to **Events** in PostHog dashboard
- See real-time user actions
- Filter for `registration_button_clicked`

### Create Charts
- **Insights** → **New Insight**
- **Trends** → **Bar Chart**
- Select `registration_button_clicked` event
- Track daily registrations

### Conversion Funnel
- **Insights** → **Funnels**
- Steps: `$pageview` → `form_field_focused` → `registration_button_clicked`
- Measure conversion rates

## 🎨 App Features

### ✨ User Interface
- **Responsive Design**: Works on mobile and desktop
- **Form Validation**: Real-time input validation
- **Loading States**: Spinner during submission
- **Success Message**: Confirmation after registration
- **Modern Styling**: Purple gradient with clean design

### 🔒 User Experience
- **Security Note**: "Your information is secure" message
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: Proper labels and focus states
- **Error Handling**: Graceful error management

## 🛠️ Project Structure

```
posthog_reg/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main registration component
│   ├── App.css         # Styling
│   ├── index.js        # PostHog provider setup
│   └── index.css       # Global styles
├── .env                # PostHog credentials (not in repo)
├── package.json        # Dependencies
└── README.md           # This file
```

## 🔧 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (one-way operation)
npm run eject
```

## 🚨 Troubleshooting

### Common Issues:

**❌ 401 Unauthorized Errors**
- Check your PostHog API key in `.env`
- Verify you're using the correct region (US vs EU)

**❌ Events Not Showing in Dashboard**
- Refresh PostHog dashboard manually
- Check time range in dashboard
- Verify environment variables are loaded

**❌ Source Map Warnings**
- Add `GENERATE_SOURCEMAP=false` to `.env`
- These warnings don't affect functionality

**❌ Double Loading Warnings**
- This app uses PostHogProvider pattern correctly
- Warnings are cosmetic and don't affect tracking

### Debug Mode
Add to PostHog options for detailed logging:
```javascript
debug: process.env.NODE_ENV === 'development'
```

## 🚀 Deployment

### Environment Variables
Set these in your hosting platform:
- `REACT_APP_POSTHOG_KEY`
- `REACT_APP_POSTHOG_HOST`

### Hosting Options
- **Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
- **Netlify**: [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
- **GitHub Pages**: [Setup Guide](https://create-react-app.dev/docs/deployment/#github-pages)

## 📈 Analytics Insights

### Key Metrics to Track:
- **Daily Registrations**: Count of button clicks
- **Conversion Rate**: Registrations ÷ Page views
- **Form Engagement**: Which fields users focus on
- **Peak Hours**: When most registrations happen

### Sample Analytics Questions:
- How many people clicked register today?
- What's our page-to-registration conversion rate?
- Which form field do users interact with first?
- What time of day gets the most registrations?

## 🛡️ Privacy & Security

- PostHog is GDPR compliant
- User data is encrypted in transit and at rest
- No sensitive data stored in local storage
- Clear privacy messaging to users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Learn More

- **Create React App**: [Documentation](https://create-react-app.dev/)
- **PostHog**: [Documentation](https://posthog.com/docs)
- **React**: [Documentation](https://reactjs.org/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/posthog_reg/issues)
- **PostHog Support**: [PostHog Community](https://posthog.com/slack)
- **React Support**: [React Community](https://reactjs.org/community/support.html)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PostHog Team** for excellent analytics platform
- **React Team** for the amazing framework
- **Create React App** for the boilerplate

---

**🎉 Ready to track your registrations!** 

Every form submission is tracked in PostHog, giving you valuable insights into user behavior and conversion optimization opportunities.

### 📊 Demo

Try the live demo: [Your Deployed App URL]

![App Screenshot](screenshot.png)

*Screenshot showing the registration form with analytics tracking*
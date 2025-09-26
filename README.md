# FRA Atlas & DSS - Grama Sabha Portal

## Overview

The FRA Atlas & DSS (Forest Rights Act Atlas & Decision Support System) is a comprehensive web application designed to empower Grama Sabhas in managing and monitoring Forest Rights Act implementation. Built with React, TypeScript, and modern web technologies, this system provides an intuitive interface for tribal communities to manage their forest rights claims, monitor encroachment, and access critical information.

## 🌟 Features

### Core Functionality
- **Secure Authentication**: Firebase-based authentication with role-based access control
- **Interactive Dashboard**: Real-time statistics with animated charts using Chart.js
- **WebGIS Integration**: Leaflet-based maps with multiple FRA-specific layers
- **Claim Management**: Complete claim submission and tracking system
- **Alert System**: Real-time notifications for encroachment and claim updates
- **Multilingual Support**: English and Hindi support with react-i18next
- **Offline Capability**: PWA with service worker for offline functionality

### Design Excellence
- **Professional UI**: Apple-level design aesthetics with forest-green theme
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Smooth Animations**: Framer Motion integration for enhanced UX
- **Premium Components**: High-quality icons from Lucide React
- **Accessibility**: WCAG compliant with proper contrast ratios

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Framer Motion** for animations

### Mapping & Visualization
- **React Leaflet** for interactive maps
- **Chart.js** with React Chart.js 2 for data visualization
- **QR Code React** for claim tracking

### State Management & Data
- **Context API** for global state
- **Axios** for HTTP requests
- **React i18next** for internationalization

### PWA & Offline
- **Service Worker** for offline caching
- **Web App Manifest** for installability
- **IndexedDB** for offline data storage

## 🎯 Target States

This system is specifically designed for:
- **Madhya Pradesh**
- **Tripura** 
- **Odisha**
- **Telangana**

## 📊 WebGIS Layers

The system includes comprehensive mapping layers:

1. **Potential FRA Areas** (Yellow #FFFF00, hatched patterns)
2. **Granted Patta Boundaries** (Green #008000, with area labels)
3. **Pending Claims** (Orange #FFA500, dashed lines)
4. **Rejected Claims** (Red #FF0000, with rejection reasons)
5. **Encroachment Zones** (Purple #800080, highlighted with alerts)
6. **Scheme Assets** (Cyan #00FFFF, with scheme-specific icons)
7. **Demographic Hotspots** (Pink #FFC0CB, heatmap visualization)

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fra-atlas-grama-sabha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 🔐 Demo Credentials

For demonstration purposes, use these credentials:
- **Email**: `demo@gramasabha.gov.in`
- **Password**: `password123`

## 📱 PWA Installation

The application can be installed as a Progressive Web App:

1. Visit the application in a compatible browser
2. Click the "Install" prompt or use browser's install option
3. The app will be available as a native-like application

## 🌐 Supported Languages

- **English** (en)
- **Hindi** (hi) - हिंदी

Additional regional languages can be added by extending the i18n configuration.

## 🎨 Design System

### Color Palette
- **Primary**: Emerald (#059669)
- **Secondary**: Forest Green variants
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b) 
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)

### Typography
- **Headings**: Font weight 600-700
- **Body**: Font weight 400-500
- **Line Height**: 1.5 for body, 1.2 for headings

## 📐 Architecture

### Component Structure
```
src/
├── components/
│   ├── Layout/          # Navigation and layout components
│   ├── UI/              # Reusable UI components
│   └── Auth/            # Authentication components
├── pages/
│   └── grama-sabha/     # Grama Sabha specific pages
├── contexts/            # React Context providers
├── types/               # TypeScript interfaces
├── utils/               # Utility functions and API calls
└── i18n/                # Internationalization files
```

### State Management
- **AuthContext**: User authentication and session management
- **AppContext**: Application-wide settings and preferences
- **Local State**: Component-specific state using React hooks

## 🔧 Key Features Implementation

### Claim Management
- Multi-file upload (documents, images, audio)
- AI-assisted form filling (OCR/NER placeholders)
- QR code generation for tracking
- Status monitoring with real-time updates

### Alert System
- Real-time encroachment detection
- Claim status notifications
- Severity-based prioritization
- Acknowledgment workflow

### Offline Capability
- Service worker for asset caching
- Background sync for form submissions
- Offline map layer caching
- IndexedDB for local data storage

## 🔒 Security Features

- Firebase Authentication integration
- Role-based access control
- Secure API token management
- Input validation and sanitization

## 🌍 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## 🚀 Performance Optimizations

- Lazy loading for routes and components
- Image optimization with proper sizing
- Efficient bundle splitting
- Service worker caching strategies

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and queries:
- **Email**: support@fra-atlas.gov.in
- **Documentation**: [Link to detailed documentation]
- **Issue Tracker**: [GitHub Issues]

## 🔮 Future Enhancements

- **AI Integration**: Enhanced OCR and NER capabilities
- **Advanced Analytics**: Predictive modeling for encroachment
- **Mobile Apps**: Native iOS and Android applications
- **Integration**: Connection with government databases
- **Blockchain**: Immutable record keeping for claims

---

**Note**: This system supports SDLC (State District Level Committee) and DLC (District Level Committee) roles but focuses exclusively on Grama Sabha functionality as per project requirements for SIH25108.
# SDLC Portal - Forest Rights Act (FRA) Atlas

## Overview

The SDLC (Sub-Divisional Level Committee) Portal is an extension of the existing Grama Sabha Vite + React + TypeScript project, providing specialized functionality for claim validation and DSS (Decision Support System) monitoring.

## Features

### 🏠 SDLC Dashboard
- **Professional welcome message** and description of SDLC's role in claim validation
- **Claim list** with statuses (Pending, Approved, Rejected) and DSS recommendations
- **Approve/Reject actions** with mandatory reason input via pop-ups
- **WebGIS map** showing claim locations with editable layers
- **Search, sort, and filter** functionality by village/claim ID/status
- **Export claim data** to CSV
- **DSS validation** with AI suggestions for claim authenticity
- **Real-time statistics** and charts

### 🚨 Alerts Page
- **Real-time alerts** for claims requiring urgent review
- **DSS-flagged** claims and region-specific anomalies
- **Acknowledgment system** with optional comments
- **Filtering and search** capabilities
- **Auto-refresh** every 30 seconds

### ⚙️ Settings Page
- **SDLC profile management** (district, language preference)
- **Security settings** with password reset
- **Theme and language** preferences
- **Offline mode** toggle
- **Feedback form** for system improvements

## Technical Implementation

### Architecture
- **Reuses existing styling** from Grama Sabha portal
- **Maintains consistent UI/UX** with Tailwind CSS and Framer Motion
- **Role-based routing** with automatic redirection
- **Context-based state management** for user data and preferences

### Key Components

#### SDLC-Specific Components
- `ClaimReviewModal` - Modal for reviewing and approving/rejecting claims
- `DSSValidationCard` - Displays DSS validation results and recommendations
- `ClaimCard` - Card component for displaying claim information
- `AlertCard` - Card component for displaying alerts

#### Pages
- `src/pages/sdlc/Dashboard.tsx` - Main SDLC dashboard
- `src/pages/sdlc/Alerts.tsx` - Alerts management page
- `src/pages/sdlc/Settings.tsx` - Settings and profile management

### API Integration
- **Mock API functions** in `src/utils/api.ts`
- **DSS validation** with confidence scores and risk factors
- **Claim review** workflow with approval/rejection
- **Alert management** with acknowledgment system
- **CSV export** functionality

### Types and Interfaces
- Extended `User` interface with district information
- Enhanced `Claim` interface with DSS validation fields
- New `DSSValidation` interface for AI recommendations
- `SDLCDashboardStats` for specialized statistics

## Usage

### Accessing SDLC Portal
1. Login with an email containing 'sdlc' (e.g., `sdlc@example.com`)
2. The system automatically redirects to `/sdlc/dashboard`
3. Navigation shows SDLC-specific menu items

### Claim Review Workflow
1. View claims on the dashboard or map
2. Click "Review Claim" to open detailed modal
3. Review DSS validation and recommendations
4. Approve or reject with mandatory reason
5. Claims update in real-time across the system

### Alert Management
1. View real-time alerts on the alerts page
2. Filter by severity, type, or status
3. Acknowledge alerts with optional comments
4. Auto-refresh keeps data current

## Development

### Project Structure
```
src/
├── components/
│   └── SDLC/
│       ├── ClaimReviewModal.tsx
│       ├── DSSValidationCard.tsx
│       ├── ClaimCard.tsx
│       └── AlertCard.tsx
├── pages/
│   └── sdlc/
│       ├── Dashboard.tsx
│       ├── Alerts.tsx
│       └── Settings.tsx
├── types/
│   └── index.ts (extended with SDLC types)
└── utils/
    └── api.ts (extended with SDLC API functions)
```

### Styling
- **Consistent with Grama Sabha** design system
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Lucide React** icons for consistency
- **Responsive design** for all screen sizes

### Internationalization
- **English and Hindi** support
- **SDLC-specific translations** added to i18n
- **Consistent terminology** across all components

## Future Enhancements

### Planned Features
- **Real-time notifications** via WebSocket
- **Advanced filtering** and search capabilities
- **Bulk operations** for claim processing
- **Detailed reporting** and analytics
- **Mobile app** integration

### DLC Integration
- **DLC portal** placeholder routes created
- **Role-based access** system ready for DLC implementation
- **Consistent architecture** for easy extension

## Security Considerations

- **Role-based access control** implemented
- **Input validation** for all forms
- **Secure API calls** with proper error handling
- **Password security** with visibility toggles
- **Session management** through AuthContext

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **Responsive design** for mobile and tablet
- **PWA capabilities** for offline functionality

---

**Note**: This implementation maintains the existing Grama Sabha functionality while adding comprehensive SDLC features. The system supports role-based access for Grama Sabha, SDLC, and DLC users with appropriate navigation and functionality for each role.

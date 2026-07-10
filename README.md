# 🌾 Agrokart - Complete Three-Sided Agricultural Marketplace

A comprehensive mobile-first marketplace connecting farmers, vendors, and delivery partners in the agricultural ecosystem.

## 🚀 Overview

Agrokart is a complete three-sided marketplace that revolutionizes agricultural commerce by connecting:
- **Customers/Farmers** - Browse and purchase agricultural products
- **Vendors/Suppliers** - Sell fertilizers, seeds, and farming equipment
- **Delivery Partners** - Earn by delivering orders to farmers

## 📱 Platform Features

### 🛒 Customer Side (Farmers)
- **Mobile-First Design** - Optimized for smartphones with Flipkart-style navigation
- **Product Catalog** - Browse fertilizers, seeds, and agricultural equipment
- **Smart Search** - AI-powered product recommendations
- **Multi-language Support** - English, Hindi, and Marathi
- **Order Management** - Place, track, and manage orders
- **Payment Options** - UPI, COD, and digital payments
- **AI Chatbot** - 24/7 customer support in multiple languages
- **Labor Hiring** - Find and hire agricultural workers

### 🏪 Vendor Side (Suppliers)
- **Vendor Registration** - Complete onboarding with business verification
- **Inventory Management** - Real-time stock tracking and alerts
- **Order Processing** - Accept/reject orders with automated workflows
- **Earnings Dashboard** - Track sales, commissions, and payouts
- **Analytics** - Customer insights and sales performance
- **Document Verification** - GST, business license, and bank details
- **Multi-location Support** - Serve multiple states and districts

### 🚚 Delivery Side (Logistics)
- **Partner Registration** - Driver verification with document upload
- **Assignment System** - Real-time delivery assignments
- **Route Optimization** - GPS-based navigation and route planning
- **Proof of Delivery** - Photo and signature capture
- **Earnings Tracking** - Transparent payment and commission system
- **Performance Metrics** - Ratings and delivery statistics
- **Flexible Schedule** - Choose working hours and service areas

## 🛠 Tech Stack

### Frontend
- **React.js 18** - Modern UI framework
- **Material-UI 5** - Professional component library
- **Capacitor** - Cross-platform mobile app development
- **Redux Toolkit** - State management
- **React Router 6** - Navigation and routing
- **i18next** - Internationalization
- **Lottie React** - Animations

### Backend
- **Node.js with Express** - RESTful API server
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication and authorization
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Mobile
- **Capacitor** - Native mobile app wrapper
- **Android Studio** - Android development
- **Progressive Web App** - Offline capabilities

### External Services
- **Firebase** - Authentication and push notifications
- **Google Maps API** - Location and routing services
- **Payment Gateways** - UPI, card, and wallet integration
- **SMS/Email Services** - Notification delivery

## 🏗 Architecture

### Three-Sided Marketplace Model
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  CUSTOMERS  │    │   VENDORS   │    │  DELIVERY   │
│  (Farmers)  │    │ (Suppliers) │    │  PARTNERS   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────┐
                  │  AGROKART   │
                  │  PLATFORM   │
                  └─────────────┘
```

### Order Workflow
```
Customer Order → Vendor Notification → Vendor Acceptance →
Inventory Check → Packaging → Delivery Assignment →
Route Optimization → Delivery → Proof of Delivery →
Payment Settlement
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Android Studio (for mobile development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agrokart.git
   cd agrokart
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Start MongoDB
   mongod

   # Start backend server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install

   # Start development server
   npm start
   ```

4. **Mobile App Setup**
   ```bash
   cd frontend

   # Build for production
   npm run build

   # Sync with Capacitor
   npx cap sync android

   # Open in Android Studio
   npx cap open android

   # Or build APK directly
   cd android
   ./gradlew assembleDebug
   ```

### Environment Variables

Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/agrokart
JWT_SECRET=your-secret-key
PORT=5000
HOST=0.0.0.0
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your-firebase-key
```

## 📁 Project Structure

```
agrokart/
├── frontend/                    # React + Capacitor mobile app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── VendorRegistrationPage.js
│   │   │   ├── VendorDashboardPage.js
│   │   │   ├── DeliveryRegistrationPage.js
│   │   │   └── DeliveryDashboardPage.js
│   │   ├── services/          # API services
│   │   ├── context/           # React contexts
│   │   ├── locales/           # Translation files
│   │   └── utils/             # Utility functions
│   ├── android/               # Android app files
│   ├── public/                # Static assets
│   └── capacitor.config.ts    # Capacitor configuration
├── backend/                    # Node.js Express server
│   ├── src/
│   │   ├── models/            # MongoDB models
│   │   │   ├── User.js        # Enhanced with vendor/delivery profiles
│   │   │   ├── VendorInventory.js
│   │   │   ├── DeliveryAssignment.js
│   │   │   ├── Earnings.js
│   │   │   └── Notification.js
│   │   ├── routes/            # API routes
│   │   │   ├── vendor.js      # Vendor-specific endpoints
│   │   │   ├── delivery.js    # Delivery partner endpoints
│   │   │   └── orders.js      # Enhanced order management
│   │   ├── services/          # Business logic
│   │   │   ├── notificationService.js
│   │   │   └── workflowOrchestrator.js
│   │   └── middleware/        # Authentication & validation
│   └── uploads/               # File storage
├── docs/                      # Documentation
└── README.md                  # This file
```

## 🔗 API Endpoints

### Customer APIs
- `POST /api/auth/register` - Customer registration
- `GET /api/products` - Browse products
- `POST /api/orders` - Place order
- `GET /api/orders/my-orders` - Order history

### Vendor APIs
- `POST /api/vendor/register` - Vendor registration
- `POST /api/vendor/upload-documents` - Document verification
- `GET /api/vendor/dashboard` - Vendor dashboard data
- `GET /api/vendor/inventory` - Inventory management
- `POST /api/vendor/orders/:id/respond` - Accept/reject orders

### Delivery APIs
- `POST /api/delivery/register` - Delivery partner registration
- `GET /api/delivery/dashboard` - Delivery dashboard
- `GET /api/delivery/assignments/available` - Available deliveries
- `POST /api/delivery/assignments/:id/accept` - Accept delivery
- `POST /api/delivery/assignments/:id/status` - Update delivery status

## 📱 Mobile App Features

### Customer App
- **Home Screen** - Featured products and categories
- **Product Catalog** - Browse with filters and search
- **Cart & Checkout** - Seamless ordering experience
- **Order Tracking** - Real-time delivery updates
- **Profile Management** - Account and preferences
- **AI Chatbot** - Multilingual customer support

### Vendor App
- **Dashboard** - Sales analytics and KPIs
- **Inventory** - Stock management with alerts
- **Orders** - Process and fulfill customer orders
- **Earnings** - Revenue tracking and payouts
- **Analytics** - Customer insights and trends

### Delivery App
- **Assignment Board** - Available delivery jobs
- **Navigation** - GPS-guided route optimization
- **Proof of Delivery** - Photo and signature capture
- **Earnings Tracker** - Payment and commission details
- **Performance** - Ratings and delivery statistics

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License. 

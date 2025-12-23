# 🌾 Agrokart - Customer/Farmer Side Overview

## 📱 Customer-Facing Pages & Routes

### Public Routes (No Authentication Required)
- **`/home`** - HomePage.js - Main landing page with hero section, testimonials, features
- **`/products`** - ProductsPage.js - Product catalog with search, filters, categories
- **`/product/:id`** - ProductDetailPage.js - Individual product details

### Protected Routes (Customer Authentication Required)
- **`/customer/dashboard`** - CustomerDashboard.js - Main customer dashboard (Flipkart-style)
- **`/cart`** - CartPage.js - Shopping cart management
- **`/delivery-details`** - DeliveryDetailsPage.js - Delivery address and slot selection
- **`/payment`** - PaymentPage.js - Payment method selection and processing
- **`/order-confirmation`** - OrderConfirmationPage.js - Order confirmation screen
- **`/profile`** - ProfilePage.js / MobileProfilePage.js - User profile management
- **`/categories`** - CategoriesPage.js - Browse products by category
- **`/order-tracking`** - OrderTrackingPage.js - Track active orders
- **`/my-orders`** - MyOrdersPage.js - View order history
- **`/order-details/:orderId`** - OrderDetailsPage.js - Detailed order information

### Authentication Routes
- **`/login`** - LoginPage.js - Customer login
- **`/register`** - RegisterPage.js - Customer registration
- **`/email-login`** - EmailLoginPage.js - Email-based login
- **`/otp`** - OtpPage.js - OTP verification

### Mobile-Specific Pages
- **`/mobile/home`** - MobileHomePage.js - Mobile-optimized home
- **`/mobile/products`** - MobileProductsPage.js - Mobile product listing
- **`/mobile/cart`** - MobileCartPage.js - Mobile cart view
- **`/mobile/orders`** - MobileOrdersPage.js - Mobile orders view
- **`/mobile/profile`** - MobileProfilePage.js - Mobile profile
- **`/labor`** - MobileLaborPage.js - Labor hiring feature

## 🎯 Customer Journey Flow

### 1. Discovery Phase
```
Role Selection → Home Page → Browse Products → Product Details
```

### 2. Shopping Phase
```
Add to Cart → Cart Review → Delivery Details → Payment → Order Confirmation
```

### 3. Post-Order Phase
```
Order Tracking → Delivery → Order History → Feedback/Rating
```

## 🎨 Key Features

### Home Page Features
- Hero section with call-to-action
- Featured products showcase
- Category navigation
- Testimonials carousel
- Service highlights (Fast Delivery, Quality Products, Expert Support)
- Multi-language support (English, Hindi, Marathi)

### Product Browsing
- Category-based filtering
- Search functionality
- Sort options (price, rating, name)
- Product cards with images, prices, ratings
- Favorites/wishlist
- Quick add to cart

### Shopping Cart
- Add/remove items
- Quantity management
- Price calculation (subtotal, delivery fee, total)
- Free delivery threshold (₹5000+)
- Proceed to checkout

### Order Management
- Order placement with delivery slot selection
- Real-time order tracking
- Order status updates (pending → processing → out_for_delivery → delivered)
- Order history with filters
- Order cancellation (for pending orders)
- Order details with itemized breakdown

### Profile Management
- Personal information
- Address management
- Payment methods
- Order history
- Settings and preferences

## 🛠 Technical Implementation

### Components Used
- **ResponsiveLayout** - Adapts to mobile/desktop
- **MainLayout** - Standard page layout
- **ProfileLayout** - Profile-specific layout
- **ProductList** - Reusable product listing component
- **SearchSuggestions** - Search autocomplete
- **WorkflowManager** - Tracks user journey

### Context Providers
- **AuthContext** - User authentication state
- **CartContext** - Shopping cart state management
- **LanguageContext** - Multi-language support
- **MobileContext** - Mobile device detection

### State Management
- React hooks (useState, useEffect)
- Context API for global state
- Local storage for cart persistence
- Redux Toolkit (available but not heavily used)

## 📊 Customer Dashboard (Flipkart-Style)

### Layout Structure
1. **Category Strip** - Horizontal scrolling category icons
2. **Hero Carousel** - Promotional banners with navigation
3. **Product Rails** - Horizontal scrolling product sections
   - Best of Agriculture
   - Featured Brands
   - Recommended for You

### Design Features
- Mobile-first responsive design
- Flipkart-inspired UI/UX
- Smooth animations (Framer Motion)
- Card-based product display
- Promotional banners

## 🔐 Authentication Flow

### Customer Registration
1. Role selection (Customer/Farmer)
2. Registration form (name, email, phone, password)
3. Firebase authentication
4. OTP verification (optional)
5. Redirect to home/dashboard

### Customer Login
- Email/Password login
- Phone/OTP login
- Google login (optional)
- Firebase authentication
- JWT token management

## 🛒 Shopping Flow

### Add to Cart
- Product detail page → Add to Cart button
- Cart context updates
- Quantity selection
- Price calculation

### Checkout Process
1. Cart Review (`/cart`)
2. Delivery Details (`/delivery-details`)
   - Address selection/entry
   - Delivery slot selection (morning/afternoon/evening)
3. Payment (`/payment`)
   - Payment method (COD, UPI, Card)
   - Payment processing
4. Order Confirmation (`/order-confirmation`)
   - Order summary
   - Tracking number
   - Estimated delivery time

## 📦 Order Tracking

### Order Statuses
- **Pending** - Order placed, awaiting vendor confirmation
- **Processing** - Vendor confirmed, preparing order
- **Out for Delivery** - Assigned to delivery partner
- **Delivered** - Successfully delivered
- **Cancelled** - Order cancelled

### Tracking Features
- Real-time status updates
- Delivery partner information
- Estimated delivery time
- Delivery location tracking
- Proof of delivery

## 🎨 UI/UX Highlights

### Design Principles
- Mobile-first approach
- Flipkart-style navigation
- Material-UI components
- Smooth animations
- Responsive grid layouts
- Card-based design

### Color Scheme
- Primary: Green (#4CAF50, #2E7D32)
- Accent: Orange, Blue
- Background: Light gray (#F1F3F6, #f8f9fa)
- Text: Dark gray/Black

### Typography
- Material-UI typography system
- Responsive font sizes
- Clear hierarchy

## 🔄 Integration Points

### Backend API
- `/api/products` - Product catalog
- `/api/orders` - Order management
- `/api/auth` - Authentication
- `/api/users` - User profile

### External Services
- Firebase - Authentication
- Google Maps - Location services (for delivery)
- Payment Gateways - UPI, Cards

## 📝 Next Steps for Customer Side Focus

1. **Enhance Product Discovery**
   - Improve search functionality
   - Add product recommendations
   - Category filtering enhancements

2. **Optimize Shopping Experience**
   - One-click ordering
   - Saved addresses
   - Payment method saving

3. **Order Management**
   - Real-time tracking integration
   - Push notifications
   - Delivery updates

4. **User Engagement**
   - Reviews and ratings
   - Wishlist functionality
   - Product comparisons

5. **Mobile Optimization**
   - Progressive Web App features
   - Offline support
   - Push notifications


import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import CustomerLayout from './components/layout/CustomerLayout';
import ProfileLayout from './components/layout/ProfileLayout';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import ResponsivePageWrapper from './components/ResponsivePageWrapper';
import RoleBasedRoute from './components/RoleBasedRoute';
import VendorInterface from './components/VendorInterface';
import DeliveryInterface from './components/DeliveryInterface';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import EmailLoginPage from './pages/EmailLoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OtpPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import AddProduct from './components/admin/AddProduct';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import DeliveryDetailsPage from './pages/DeliveryDetailsPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ProductsPage from './pages/ProductsPage';
import WorkflowDashboard from './components/WorkflowDashboard';
import TestOrderPage from './pages/TestOrderPage';
import TestOrderManagementPage from './pages/TestOrderManagementPage';
import MobileLaborPage from './pages/MobileLaborPage';
import CategoriesPage from './pages/CategoriesPage';
import VendorRegistrationPage from './pages/VendorRegistrationPage';
import VendorLogin from './pages/VendorLogin';
import VendorDashboard from './pages/VendorDashboard';
import UnifiedAuthPage from './pages/UnifiedAuthPage';
import DrAgro from './pages/DrAgro';
import DrAgroResults from './pages/DrAgroResults';
import DeliveryRegistrationPage from './pages/DeliveryRegistrationPage';
import DeliveryLogin from './pages/DeliveryLogin';
import DeliveryDashboard from './pages/DeliveryDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import MarketplaceNavigation from './components/MarketplaceNavigation';
import RoleSelectionPage from './components/RoleSelectionPage';
import LabourManagement from './pages/LabourManagement';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import HelpPage from './pages/HelpPage';


// Helper to redirect based on role
const getDashboardForRole = (role) => {
  switch (role) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'delivery_partner':
    case 'delivery_partner':
      return '/delivery/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/customer/dashboard';
  }
};

// Component to handle /home redirect to customer dashboard (with sidebar)
const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated && user?.role === 'customer') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // For unauthenticated users or other roles, redirect to login
  return <Navigate to="/login" replace />;
};

// Protected Route restricted to Customers
const CustomerRoute = ({ children, useSidebar = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🛡️ CustomerRoute Check:', {
    isAuthenticated,
    loading,
    userRole: user?.role,
    path: window.location.pathname
  });

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    console.warn('⛔ CustomerRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" />;
  }

  if (user && user.role !== 'customer') {
    console.warn(`⛔ CustomerRoute: Role mismatch (${user.role}), redirecting...`);
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  // Use CustomerLayout with sidebar for dashboard, MainLayout for other pages
  if (useSidebar) {
    return <CustomerLayout>{children}</CustomerLayout>;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Public Route that redirects Vendors/Delivery Partners to their specific dashboards
// Used for Home, Products etc which should be accessible to public + customers, but NOT vendors/delivery (who have their own portals)
const CustomerOrPublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated && user && user.role !== 'customer') {
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  return children;
};

// Protected Route Component (Generic)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // TRIPLE CHECK: Trust Token Role OR Master Email OR LocalStorage (Fail-safe)
  const storedRole = localStorage.getItem('userRole');
  const isAdmin = user && (
    user.role === 'admin' ||
    user.email === 'admin@agrokart.com' ||
    storedRole === 'admin'
  );

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Component to handle root route logic
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role === 'customer') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <RoleSelectionPage />;
};

const Routes = () => {
  return (
    <RouterRoutes>
      {/* Public Routes (Redirect Vendors/Delivery) */}
      {/* Root route - redirect authenticated customers to dashboard, show role selection for others */}
      <Route
        path="/"
        element={
          <CustomerOrPublicRoute>
            <RootRedirect />
          </CustomerOrPublicRoute>
        }
      />
      {/* Redirect /home to customer dashboard (with sidebar) for authenticated customers, or to login for others */}
      <Route path="/home" element={<HomeRedirect />} />
      <Route
        path="/products"
        element={
          <CustomerRoute useSidebar={true}>
            <ResponsivePageWrapper pageType="products" />
          </CustomerRoute>
        }
      />

      {/* Other Public Routes */}
      <Route path="/labor" element={<ResponsiveLayout><MobileLaborPage /></ResponsiveLayout>} />
      <Route path="/labour" element={<ResponsiveLayout><MobileLaborPage /></ResponsiveLayout>} />
      <Route path="/workflow" element={<MainLayout><WorkflowDashboard /></MainLayout>} />

      {/* Auth Routes */}
      <Route path="/auth" element={<UnifiedAuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/email-login" element={<EmailLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp" element={<OTPPage />} />
      <Route path="/product/:id" element={<CustomerOrPublicRoute><CustomerLayout><ProductDetailPage /></CustomerLayout></CustomerOrPublicRoute>} />
      <Route path="/test-order" element={<MainLayout><TestOrderPage /></MainLayout>} />
      <Route path="/test-order-management" element={<MainLayout><TestOrderManagementPage /></MainLayout>} />

      {/* Vendor Routes */}
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/register" element={<VendorRegistrationPage />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/inventory" element={<VendorDashboard />} />
      <Route path="/vendor/orders" element={<VendorDashboard />} />
      <Route path="/vendor/orders/:orderId" element={<VendorDashboard />} />
      <Route path="/vendor/earnings" element={<VendorDashboard />} />
      <Route path="/vendor/notifications" element={<VendorDashboard />} />

      {/* Delivery Partner Routes */}
      <Route path="/delivery/login" element={<DeliveryLogin />} />
      <Route path="/delivery/register" element={<DeliveryRegistrationPage />} />
      <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
      <Route path="/delivery/assignments" element={<DeliveryDashboard />} />
      <Route path="/delivery/assignments/:assignmentId/preview" element={<DeliveryDashboard />} />
      <Route path="/delivery/earnings" element={<DeliveryDashboard />} />
      <Route path="/delivery/profile" element={<DeliveryDashboard />} />
      <Route path="/delivery/notifications" element={<DeliveryDashboard />} />
      <Route path="/delivery/location" element={<DeliveryDashboard />} />

      {/* Customer Routes (Protected) */}
      <Route path="/customer/dashboard" element={
        <CustomerRoute useSidebar={true}>
          <CustomerDashboard />
        </CustomerRoute>
      } />

      <Route path="/customer/labour" element={
        <CustomerRoute useSidebar={true}>
          <LabourManagement />
        </CustomerRoute>
      } />

      <Route path="/customer/dr-agro" element={
        <CustomerRoute useSidebar={true}>
          <DrAgro />
        </CustomerRoute>
      } />

      <Route path="/customer/dr-agro/results" element={
        <CustomerRoute useSidebar={true}>
          <DrAgroResults />
        </CustomerRoute>
      } />


      {/* Protected Routes (Customer Only) */}
      <Route
        path="/cart"
        element={
          <CustomerRoute useSidebar={true}>
            <ResponsivePageWrapper pageType="cart" />
          </CustomerRoute>
        }
      />
      <Route
        path="/delivery-details"
        element={
          <CustomerRoute useSidebar={true}>
            <DeliveryDetailsPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <CustomerRoute useSidebar={true}>
            <PaymentPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/order-confirmation"
        element={
          <CustomerRoute useSidebar={true}>
            <OrderConfirmationPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <CustomerRoute useSidebar={true}>
            <ResponsivePageWrapper pageType="profile" />
          </CustomerRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <CustomerRoute useSidebar={true}>
            <WishlistPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <CustomerRoute useSidebar={true}>
            <NotificationsPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <CustomerRoute useSidebar={true}>
            <SettingsPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <CustomerRoute useSidebar={true}>
            <SecurityPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/settings/privacy"
        element={
          <CustomerRoute useSidebar={true}>
            <PrivacyPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/settings/support"
        element={
          <CustomerRoute useSidebar={true}>
            <SupportPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/help"
        element={
          <CustomerRoute useSidebar={true}>
            <HelpPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <CustomerRoute useSidebar={true}>
            <CategoriesPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/customer/tracking/:orderId"
        element={
          <CustomerRoute useSidebar={true}>
            <OrderTrackingPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <CustomerRoute useSidebar={true}>
            <ResponsivePageWrapper pageType="orders" />
          </CustomerRoute>
        }
      />
      <Route
        path="/order-details/:orderId"
        element={
          <CustomerRoute useSidebar={true}>
            <ProfileLayout><OrderDetailsPage /></ProfileLayout>
          </CustomerRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin/add-product"
        element={
          <AdminRoute>
            <MainLayout><AddProduct /></MainLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
};

export default Routes;
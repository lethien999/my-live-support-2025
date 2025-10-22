import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ShoppingCart from './components/ShoppingCart';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CustomerChatPage from './pages/CustomerChatPage';
import './services/TokenSyncService'; // Auto-start token sync
import TicketPageNew from './pages/TicketPageNew';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AgentSupportDashboard from './pages/AgentSupportDashboard';
import OrderManagementPage from './pages/OrderManagementPage';
import TicketManagementPage from './pages/TicketManagementPage';
import ChatShopPage from './pages/ChatShopPage';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple routing based on pathname
  const getCurrentPage = () => {
    switch (currentPath) {
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      case '/auth/google/callback':
        return <GoogleCallbackPage />;
      case '/dashboard':
        return <DashboardPage />;
      case '/admin':
        return <AdminDashboardPage />;
      case '/customer-chat':
        return <CustomerChatPage />;
      case '/agent-dashboard':
        return <AgentSupportDashboard />;
      case '/tickets':
        return <TicketPageNew />;
      case '/ticket-management':
        return <TicketManagementPage />;
      case '/products':
        return <ProductsPage />;
      case '/product':
        return <ProductDetailPage />;
      case '/cart':
        return <CartPage />;
      case '/checkout':
        return <CheckoutPage />;
      case '/shop-chat':
        return <ChatShopPage />;
      case '/orders':
        return <OrderManagementPage />;
      // case '/test-chat':
      //   return <TestChatPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  // Check if current page should hide header/footer
  const isChatPage = currentPath.startsWith('/customer-chat') || 
                     currentPath.startsWith('/agent-chat') || 
                     currentPath.startsWith('/shop-chat');

  if (isChatPage) {
    return getCurrentPage();
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header onCartClick={() => setShowCart(true)} />
      <main style={{ flex: 1 }}>
        {getCurrentPage()}
      </main>
      <Footer />
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}

export default App;
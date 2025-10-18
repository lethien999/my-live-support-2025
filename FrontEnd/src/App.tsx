import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ShoppingCart from './components/ShoppingCart';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ShopChatPage from './pages/ShopChatPage';
import AgentChatPage from './pages/AgentChatPage';
import TicketPage from './pages/TicketPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderManagementPage from './pages/OrderManagementPage';
// import TestChatPage from './pages/TestChatPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';

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
      case '/chat':
        return <ChatPage />;
      case '/shop-chat':
        return <ShopChatPage />;
      case '/agent-chat':
        return <AgentChatPage />;
      case '/tickets':
        return <TicketPage />;
      case '/products':
        return <ProductsPage />;
      case '/product':
        return <ProductDetailPage />;
      case '/cart':
        return <CartPage />;
      case '/checkout':
        return <CheckoutPage />;
      case '/orders':
        return <OrderManagementPage />;
      // case '/test-chat':
      //   return <TestChatPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

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
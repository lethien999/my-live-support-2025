import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RequireAuth } from '@/routes/guard/RequireAuth';
import { RequireRole } from '@/routes/guard/RequireRole';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { ForgotPassword } from '@/pages/Auth/ForgotPassword';
import { Home } from '@/pages/Home';
import { CustomerChat } from '@/pages/Chat/CustomerChat';
import { AgentChat } from '@/pages/Chat/AgentChat';
import { TicketsList } from '@/pages/Tickets/TicketsList';
import { TicketDetail } from '@/pages/Tickets/TicketDetail';
import { Dashboard } from '@/pages/Admin/Dashboard';
import { NotFound } from '@/pages/NotFound';

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      
      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes */}
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        {/* Customer routes */}
        <Route path="chat" element={<CustomerChat />} />
        <Route path="tickets" element={<TicketsList />} />
        <Route path="tickets/:id" element={<TicketDetail />} />

        {/* Agent routes */}
        <Route path="agent" element={<RequireRole roles={['agent', 'admin']} />}>
          <Route path="chat" element={<AgentChat />} />
        </Route>

        {/* Admin routes */}
        <Route path="admin" element={<RequireRole roles={['admin']} />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

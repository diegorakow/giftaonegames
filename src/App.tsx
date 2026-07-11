import { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Start from "./pages/Start";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import HowToRedeem from "./pages/HowToRedeem";
import Help from "./pages/Help";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentPending from "./pages/PaymentPending";
import OrderStatus from "./pages/OrderStatus";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splash_shown');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/start" replace />} />
      <Route path="/start" element={<Start />} />
      <Route path="/home" element={<Index />} />
      <Route path="/catalogo" element={<Catalog />} />
      <Route path="/produtos" element={<Catalog />} />
      <Route path="/produto/:id" element={<Product />} />
      <Route path="/carrinho" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/~oauth/initiate" element={<Navigate to="/login" replace />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pagamento-sucesso" element={<PaymentSuccess />} />
      <Route path="/sucesso" element={<PaymentSuccess />} />
      <Route path="/pendente" element={<PaymentPending />} />
      <Route path="/pedido/:id" element={<OrderStatus />} />
      <Route path="/meus-pedidos" element={<MyOrders />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/como-resgatar" element={<HowToRedeem />} />
      <Route path="/ajuda" element={<Help />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/sobre" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

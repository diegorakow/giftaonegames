import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowLeft, Check, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailGate } from '@/hooks/useEmailGate';
import { formatCurrency, PLATFORMS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckoutPageSEO } from '@/components/SEO';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type CheckoutState = 'cart' | 'processing' | 'paid' | 'cancelled';
type PaymentProvider = 'stripe' | 'mercadopago';

const PAYMENT_PROVIDER = ((import.meta.env.VITE_PAYMENT_PROVIDER || 'stripe') as PaymentProvider);
const PAYMENT_LABEL = PAYMENT_PROVIDER === 'mercadopago' ? 'Mercado Pago Pix' : 'Stripe';
const CHECKOUT_FUNCTION = PAYMENT_PROVIDER === 'mercadopago'
  ? 'create-mercadopago-checkout'
  : 'create-checkout';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { guardAction } = useEmailGate();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('cart');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle return from payment provider
  useEffect(() => {
    const status = searchParams.get('status');
    const returnOrderId = searchParams.get('order_id');

    if (status === 'success' && returnOrderId) {
      // Redirect to dedicated success page
      navigate(`/pagamento-sucesso?order_id=${returnOrderId}`, { replace: true });
    } else if (status === 'cancelled' && returnOrderId) {
      setOrderId(returnOrderId);
      setCheckoutState('cancelled');
    }
  }, [searchParams, clearCart]);

  // Redirect if no items and not returning from payment provider
  useEffect(() => {
    const status = searchParams.get('status');
    if (items.length === 0 && checkoutState === 'cart' && !status) {
      navigate('/carrinho');
    }
  }, [items.length, checkoutState, navigate, searchParams]);

  const handleInitiatePayment = async () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (!guardAction()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setCheckoutState('processing');

    try {
      // Check stock availability
      for (const item of items) {
        const { count } = await supabase
          .from('codes_inventory')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', item.productId)
          .eq('is_sold', false);

        if (!count || count < item.quantity) {
          toast.error(`Estoque insuficiente para: ${item.name}`);
          setLoading(false);
          setCheckoutState('cart');
          return;
        }
      }

      // Create order with pending status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Audit logging is handled server-side for security

      // Call edge function to create the provider checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        CHECKOUT_FUNCTION,
        {
          body: {
            items: items.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              platform: item.platform,
            })),
            orderId: order.id,
          },
        }
      );

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        // Redirect to the payment provider checkout
        clearCart();
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar pedido. Tente novamente.');
      setCheckoutState('cart');
    } finally {
      setLoading(false);
    }
  };

  // Payment Confirmed — redirects to /pagamento-sucesso now
  // (kept as fallback)
  if (checkoutState === 'paid' && orderId) {
    navigate(`/pagamento-sucesso?order_id=${orderId}`, { replace: true });
    return null;
  }

  // Payment Cancelled State
  if (checkoutState === 'cancelled') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">
              Pagamento Cancelado
            </h1>
            <p className="text-muted-foreground mb-8">
              O pagamento não foi concluído. Você pode tentar novamente quando quiser.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/catalogo')} className="gap-2">
                Voltar ao Catálogo
              </Button>
              <Button onClick={() => navigate('/meus-pedidos')} variant="outline" className="gap-2">
                Ver Meus Pedidos
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Processing State
  if (checkoutState === 'processing') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">
              Redirecionando para o pagamento...
            </h1>
            <p className="text-muted-foreground">
              Você será redirecionado para a página de pagamento segura do {PAYMENT_LABEL}.
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Default Cart/Checkout State
  if (items.length === 0) {
    return null;
  }

  return (
    <Layout>
      <CheckoutPageSEO />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/carrinho')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Carrinho
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                {items.map(item => {
                  const platformConfig = Object.values(PLATFORMS).find(
                    p => p.id === item.platform.toLowerCase()
                  );

                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${platformConfig?.gradient || 'from-primary/20 to-secondary/20'} flex items-center justify-center`}>
                            <span className="font-display text-sm font-bold text-foreground/30">
                              {item.platform.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {platformConfig?.name || item.platform} • Qtd: {item.quantity}
                        </p>
                        <p className="text-primary font-bold text-sm mt-1">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pagamento
              </h2>

              {/* Digital Product Warning */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-500 text-sm mb-1">
                      Produto Digital
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Após a confirmação do pagamento, o código ficará disponível em "Meus Pedidos". 
                      Uma vez revelado, o código fica sob sua responsabilidade e não pode ser reembolsado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Provider Info */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                <p className="text-sm text-center">
                  Pagamento seguro via <strong>{PAYMENT_LABEL}</strong>
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 neon-glow"
                disabled={loading}
                onClick={handleInitiatePayment}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Pagar com ${PAYMENT_LABEL} - ${formatCurrency(total)}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                <Shield className="w-4 h-4" />
                Pagamento seguro e criptografado
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pedido</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a realizar um pedido de <strong>{formatCurrency(total)}</strong>.
              </p>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Este é um produto digital. Após a visualização do código, não será possível 
                  solicitar reembolso. Os códigos serão liberados apenas após a confirmação do pagamento.
                </p>
              </div>
              <p className="text-sm">
                Você será redirecionado para a página de pagamento segura do {PAYMENT_LABEL}.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment}>
              Ir para o Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Checkout;

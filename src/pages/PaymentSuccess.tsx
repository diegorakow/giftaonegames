import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Package, ArrowRight, ShoppingBag, Copy, CheckCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, PLATFORMS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderDetails {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    price: number;
    quantity: number;
    product_id: string | null;
  }[];
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId || !user) {
      if (!user) {
        navigate('/login');
      }
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, total, status, created_at')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, product_name, price, quantity, product_id')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        setOrder({
          ...orderData,
          items: itemsData || [],
        });
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Poll for status update (webhook might take a moment)
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (data?.status === 'paid') {
        setOrder(prev => prev ? { ...prev, status: 'paid' } : prev);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, user, navigate]);

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!orderId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          <Button onClick={() => navigate('/catalogo')} className="mt-4">
            Ir para o Catálogo
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Pagamento confirmado
          </h1>
          <p className="text-muted-foreground">
            Obrigado pela sua compra. A entrega será liberada após a confirmação final do gateway.
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Detalhes do Pedido
            </h2>
            {order && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'paid'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {order.status === 'paid' ? 'Pago' : 'Processando'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : order ? (
            <>
              {/* Order ID */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">ID do Pedido</p>
                  <p className="font-mono text-sm">{order.id.slice(0, 8)}...{order.id.slice(-4)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyOrderId}
                  className="gap-1.5"
                >
                  {copiedId ? (
                    <><CheckCheck className="w-4 h-4" /> Copiado</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copiar</>
                  )}
                </Button>
              </div>

              {/* Order Date */}
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground">Data do Pedido</p>
                <p className="text-sm">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-muted-foreground">Itens</p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-primary text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Não foi possível carregar os detalhes do pedido.
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={() => navigate(orderId ? `/pedido/${orderId}` : '/meus-pedidos')}
            className="flex-1 gap-2 neon-glow"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5" />
            Acompanhar Pedido
          </Button>
          <Button
            onClick={() => navigate('/catalogo')}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            Continuar Comprando
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;

import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Package, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <Layout>
      <SEO title="Pagamento Pendente" noIndex />
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-20 h-20 bg-yellow-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">
            Pagamento pendente
          </h1>
          <p className="text-muted-foreground mb-8">
            Estamos aguardando a confirmação do gateway. Quando o pagamento for aprovado, o pedido será liberado automaticamente.
          </p>
          <div className="flex flex-col gap-3">
            {orderId && (
              <Button asChild className="gap-2 neon-glow">
                <Link to={`/pedido/${orderId}`}>
                  <RefreshCw className="w-4 h-4" />
                  Acompanhar pedido
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="gap-2">
              <Link to="/meus-pedidos">
                <Package className="w-4 h-4" />
                Ver meus pedidos
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentPending;

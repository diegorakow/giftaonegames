import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Package,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/constants';

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  payment_intent_id: string | null;
  order_items: OrderItem[];
}

const statusInfo = {
  pending: {
    label: 'Aguardando pagamento',
    description: 'Assim que o gateway confirmar o pagamento, o pedido segue para entrega.',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    icon: Clock,
  },
  paid: {
    label: 'Pagamento aprovado',
    description: 'Pagamento confirmado. Os códigos ficam disponíveis na área Meus Pedidos.',
    className: 'bg-primary/15 text-primary border-primary/30',
    icon: Check,
  },
  cancelled: {
    label: 'Pagamento cancelado',
    description: 'O pagamento não foi concluído e nenhum código foi entregue.',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: XCircle,
  },
  refunded: {
    label: 'Reembolsado',
    description: 'Este pedido foi marcado como reembolsado.',
    className: 'bg-muted text-muted-foreground border-border',
    icon: RefreshCw,
  },
};

const OrderStatus = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['order-status', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          updated_at,
          payment_intent_id,
          order_items (
            id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as OrderDetails;
    },
    enabled: !!id && !!user,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;
      return currentStatus === 'pending' ? 5000 : false;
    },
  });

  const handleCopy = async () => {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authLoading && !user) {
    return (
      <Layout>
        <SEO title="Status do Pedido" noIndex />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShieldCheck className="w-14 h-14 mx-auto mb-5 text-primary" />
          <h1 className="font-display text-2xl font-bold mb-3">Entre para ver seu pedido</h1>
          <p className="text-muted-foreground mb-6">
            O status e os códigos ficam protegidos na sua conta.
          </p>
          <Button onClick={() => navigate(`/login?redirect=/pedido/${id || ''}`)}>
            Entrar
          </Button>
        </div>
      </Layout>
    );
  }

  const info = order ? statusInfo[order.status as keyof typeof statusInfo] || statusInfo.pending : statusInfo.pending;
  const StatusIcon = info.icon;

  return (
    <Layout>
      <SEO title="Status do Pedido" noIndex />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Status do pedido</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe pagamento, separação e liberação dos códigos.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2 self-start md:self-auto">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {isLoading || authLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className={`glass-card p-6 border ${info.className}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background/40 flex items-center justify-center shrink-0">
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                    <h2 className="text-xl font-semibold">{info.label}</h2>
                    <p className="text-sm mt-2 opacity-90">{info.description}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Detalhes
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar ID'}
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total pago</p>
                    <p className="font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm">
                      {new Date(order.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-primary text-sm">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === 'paid' ? (
                <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Código liberado com acesso protegido</p>
                    <p className="text-sm text-muted-foreground">
                      Acesse Meus Pedidos para revelar e copiar seus códigos.
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to="/meus-pedidos">Ver códigos</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm text-muted-foreground">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p>
                    Não entregue comprovante manual como aprovação. A liberação acontece só depois da confirmação direta do gateway.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-14 h-14 mx-auto mb-5 text-muted-foreground" />
              <h2 className="font-display text-2xl font-bold mb-3">Pedido não encontrado</h2>
              <p className="text-muted-foreground mb-6">
                Confira se você está na conta correta ou volte para seus pedidos.
              </p>
              <Button onClick={() => navigate('/meus-pedidos')}>Ver meus pedidos</Button>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderStatus;

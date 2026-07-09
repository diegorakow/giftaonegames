import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Eye, Copy, Check, ShoppingBag, AlertTriangle, Clock, XCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LevelProgressCard } from '@/components/user/LevelProgressCard';
import { MyOrdersPageSEO } from '@/components/SEO';

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  codes?: { id: string }[];
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

// Edge function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-code`;

const MyOrders = () => {
  const { user, isEmailConfirmed } = useAuth();
  const navigate = useNavigate();
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [revealedCodeMap, setRevealedCodeMap] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeToReveal, setCodeToReveal] = useState<{ codeId: string; orderItemId: string } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const { data: orders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get orders with items (NO codes - those come from secure edge function)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          order_items (
            id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For paid orders, get code IDs via secure edge function (NOT the actual codes)
      const ordersWithCodeIds = await Promise.all(
        ordersData.map(async (order) => {
          if (order.status === 'paid') {
            const itemsWithCodeIds = await Promise.all(
              order.order_items.map(async (item) => {
                try {
                  // Get session token for auth
                  const { data: { session } } = await supabase.auth.getSession();
                  
                  if (!session?.access_token) {
                    return { ...item, codes: [] };
                  }

                  // Call edge function to get code IDs securely
                  const response = await fetch(`${EDGE_FUNCTION_URL}?action=get-code-ids`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ order_item_id: item.id }),
                  });

                  if (!response.ok) {
                    console.error('Failed to get code IDs:', await response.text());
                    return { ...item, codes: [] };
                  }

                  const data = await response.json();
                  const codes = (data.code_ids || []).map((codeId: string) => ({ id: codeId }));
                  
                  return { ...item, codes };
                } catch (error) {
                  console.error('Error fetching code IDs:', error);
                  return { ...item, codes: [] };
                }
              })
            );
            return { ...order, items: itemsWithCodeIds };
          }
          return { ...order, items: order.order_items.map(item => ({ ...item, codes: [] })) };
        })
      );

      return ordersWithCodeIds as Order[];
    },
    enabled: !!user,
  });

  const handleRevealCodeRequest = (codeId: string, orderItemId: string) => {
    if (!isEmailConfirmed) {
      toast.error('Confirme seu e-mail antes de revelar códigos.');
      navigate('/verify-email');
      return;
    }
    setCodeToReveal({ codeId, orderItemId });
  };

  const handleConfirmReveal = async () => {
    if (!user || !codeToReveal) return;

    const { codeId, orderItemId } = codeToReveal;
    setIsRevealing(true);

    try {
      // Get session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login?redirect=/meus-pedidos');
        return;
      }

      // Call secure edge function to reveal the code
      const response = await fetch(`${EDGE_FUNCTION_URL}?action=reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_item_id: orderItemId,
          code_id: codeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Muitas tentativas. Aguarde 1 hora.');
        } else if (response.status === 403) {
          toast.error('Você não tem permissão para ver este código.');
        } else {
          toast.error(data.error || 'Não foi possível revelar o código agora.');
        }
        setCodeToReveal(null);
        return;
      }

      // Store revealed code in local state (never in localStorage)
      setRevealedCodeMap(prev => ({ ...prev, [codeId]: data.code }));
      setRevealedCodes(prev => new Set(prev).add(codeId));
      setCodeToReveal(null);
      toast.success('Código revelado! Guarde-o em local seguro.');
    } catch (error) {
      console.error('Error revealing code:', error);
      toast.error('Erro ao revelar código. Tente novamente.');
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyCode = async (codeId: string) => {
    const code = revealedCodeMap[codeId];
    
    if (!code) {
      toast.error('Código não disponível. Revele novamente.');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Não foi possível copiar. Copie manualmente.');
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        label: 'Aguardando Pagamento',
        className: 'bg-yellow-500/20 text-yellow-500',
        icon: Clock,
      },
      paid: {
        label: 'Pago',
        className: 'bg-primary/20 text-primary',
        icon: Check,
      },
      cancelled: {
        label: 'Cancelado',
        className: 'bg-destructive/20 text-destructive',
        icon: XCircle,
      },
      refunded: {
        label: 'Reembolsado',
        className: 'bg-muted text-muted-foreground',
        icon: RotateCcw,
      },
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (!user) {
    navigate('/login?redirect=/meus-pedidos');
    return null;
  }

  return (
    <Layout>
      <MyOrdersPageSEO />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold">Meus Pedidos e Inventário</h1>
              <p className="text-muted-foreground mt-1">
                Seus códigos ficam disponíveis aqui após a confirmação do pagamento
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Level Progress Card */}
          <div className="mb-8">
            <LevelProgressCard />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-4">Nenhum pedido encontrado</h2>
              <p className="text-muted-foreground mb-8">
                Você ainda não fez nenhum pedido
              </p>
              <Button onClick={() => navigate('/catalogo')}>
                Ver Catálogo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders?.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                      <div className="flex items-center gap-4">
                        <Package className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pedido</p>
                          <p className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-sm">
                          {format(new Date(order.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-sm font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${statusInfo.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-muted/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Qtd: {item.quantity} × {formatCurrency(Number(item.price))}
                              </p>
                            </div>
                            <p className="font-bold text-primary">
                              {formatCurrency(Number(item.price) * item.quantity)}
                            </p>
                          </div>

                          {/* Codes - Only for paid orders */}
                          {order.status === 'paid' && item.codes && item.codes.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">
                                  Códigos liberados: {item.codes.length} de {item.quantity}
                                </p>
                                {item.codes.length < item.quantity && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Alguns códigos ainda estão sendo atribuídos. Atualize mais tarde.
                                  </p>
                                )}
                              </div>
                              {item.codes.map((code) => (
                                <div
                                  key={code.id}
                                  className="flex items-center justify-between gap-4 bg-background/50 rounded-lg p-3"
                                >
                                  <div className="flex-1 font-mono text-sm">
                                    {revealedCodes.has(code.id) && revealedCodeMap[code.id] ? (
                                      <span className="text-primary font-semibold">{revealedCodeMap[code.id]}</span>
                                    ) : (
                                      <span className="text-muted-foreground">••••-••••-••••-••••</span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {revealedCodes.has(code.id) && revealedCodeMap[code.id] ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyCode(code.id)}
                                        className="gap-1"
                                      >
                                        {copiedCode === code.id ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            Copiado
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            Copiar
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleRevealCodeRequest(code.id, item.id)}
                                        className="gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Ver Código
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pending/Cancelled/Refunded status message */}
                          {order.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-yellow-500">
                              <Clock className="w-4 h-4" />
                              <p className="text-sm">
                                Aguardando confirmação do pagamento para liberar os códigos
                              </p>
                            </div>
                          )}

                          {order.status === 'cancelled' && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-destructive">
                              <XCircle className="w-4 h-4" />
                              <p className="text-sm">
                                Pedido cancelado - nenhum código foi atribuído
                              </p>
                            </div>
                          )}

                          {order.status === 'refunded' && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-muted-foreground">
                              <RotateCcw className="w-4 h-4" />
                              <p className="text-sm">
                                Pedido reembolsado
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Code Reveal Confirmation Dialog */}
      <AlertDialog 
        open={!!codeToReveal} 
        onOpenChange={(open) => { if (!open) setCodeToReveal(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirmar Visualização do Código
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  ⚠️ Código digital único
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Após a visualização do código, <strong>não será possível solicitar reembolso</strong>. 
                  Certifique-se de guardar o código em local seguro.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Deseja continuar e revelar o código?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevealing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReveal} 
              disabled={isRevealing}
              className="gap-2"
            >
              {isRevealing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Revelando...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Sim, revelar código
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default MyOrders;

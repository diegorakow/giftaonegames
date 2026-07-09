import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Edit,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  Trash2,
  Users,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatCurrency, PLATFORMS, CATEGORIES } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string;
  platform: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string | null;
  payment_intent_id: string | null;
  order_items?: {
    id: string;
    product_name: string;
    price: number;
    quantity: number;
  }[];
}

const getOrderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  };
  return labels[status] || status;
};

const AdminPanel = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    platform: '',
    price: '',
    original_price: '',
    image_url: '',
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          user_id,
          payment_intent_id,
          order_items (
            id,
            product_name,
            price,
            quantity
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AdminOrder[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats-clean'],
    queryFn: async () => {
      const [productsRes, usersRes, paidOrdersRes, pendingOrdersRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        products: productsRes.count || 0,
        users: usersRes.count || 0,
        paidOrders: paidOrdersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
      };
    },
  });

  const productMutation = useMutation({
    mutationFn: async (data: typeof productForm & { id?: string }) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: data.name,
        slug,
        description: data.description || null,
        category: data.category,
        platform: data.platform,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        image_url: data.image_url || null,
      };

      if (data.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-clean'] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      toast.success(editingProduct ? 'Produto atualizado.' : 'Produto criado.');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-clean'] });
      toast.success('Produto excluído.');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const toggleProductActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-clean'] });
      toast.success('Status atualizado.');
    },
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      slug: '',
      description: '',
      category: '',
      platform: '',
      price: '',
      original_price: '',
      image_url: '',
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug || '',
      description: product.description || '',
      category: product.category,
      platform: product.platform,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      image_url: product.image_url || '',
    });
    setIsProductDialogOpen(true);
  };

  const handleSubmitProduct = (event: React.FormEvent) => {
    event.preventDefault();
    productMutation.mutate({ ...productForm, id: editingProduct?.id });
  };

  if (!authLoading && (!user || !isAdmin)) {
    navigate('/');
    return null;
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Painel Administrativo
          </h1>

          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg"><Package className="w-6 h-6 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats?.products || 0}</p>
                  <p className="text-sm text-muted-foreground">Produtos ativos</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg"><ReceiptText className="w-6 h-6 text-secondary" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats?.paidOrders || 0}</p>
                  <p className="text-sm text-muted-foreground">Pedidos pagos</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg"><BarChart3 className="w-6 h-6 text-yellow-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-lg"><Users className="w-6 h-6 text-accent" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats?.users || 0}</p>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="w-4 h-4" />Resumo</TabsTrigger>
              <TabsTrigger value="products" className="gap-2"><Package className="w-4 h-4" />Produtos</TabsTrigger>
              <TabsTrigger value="orders" className="gap-2"><ReceiptText className="w-4 h-4" />Pedidos</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Operação GiftZone</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Acompanhe produtos próprios, pedidos pagos e pedidos pendentes em um só lugar.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Produtos prontos para venda</p>
                    <p className="text-2xl font-bold text-primary">{stats?.products || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Pedidos finalizados</p>
                    <p className="text-2xl font-bold text-primary">{stats?.paidOrders || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats?.pendingOrders || 0}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Gerenciar Produtos</h2>
                  <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
                    setIsProductDialogOpen(open);
                    if (!open) {
                      setEditingProduct(null);
                      resetProductForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2"><Plus className="w-4 h-4" />Novo Produto</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmitProduct} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug da URL</Label>
                          <Input value={productForm.slug} onChange={e => setProductForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="auto-gerado se vazio" />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Plataforma</Label>
                            <Select value={productForm.platform} onValueChange={value => setProductForm(prev => ({ ...prev, platform: value }))}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {Object.values(PLATFORMS).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={productForm.category} onValueChange={value => setProductForm(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preço (R$)</Label>
                            <Input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Preço original (R$)</Label>
                            <Input type="number" step="0.01" value={productForm.original_price} onChange={e => setProductForm(prev => ({ ...prev, original_price: e.target.value }))} placeholder="Opcional" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Imagem</Label>
                          <Input type="url" value={productForm.image_url} onChange={e => setProductForm(prev => ({ ...prev, image_url: e.target.value }))} placeholder="URL da imagem" />
                        </div>
                        <Button type="submit" className="w-full" disabled={productMutation.isPending}>
                          {productMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {productsLoading ? (
                  <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Plataforma</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Ativo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products?.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{Object.values(PLATFORMS).find(p => p.id === product.platform)?.name || product.platform}</TableCell>
                            <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                            <TableCell>
                              <Switch checked={product.is_active ?? true} onCheckedChange={(checked) => toggleProductActive.mutate({ id: product.id, is_active: checked })} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}><Edit className="w-4 h-4" /></Button>
                                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (confirm('Excluir produto?')) deleteMutation.mutate(product.id); }}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-6">Pedidos Recentes</h2>
                {ordersLoading ? (
                  <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders?.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                            <TableCell>{getOrderStatusLabel(order.status)}</TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {order.order_items?.map(item => `${item.quantity}x ${item.product_name}`).join(', ') || 'Sem itens'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatCurrency(Number(order.total))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminPanel;

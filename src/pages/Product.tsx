import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, Tag, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, PLATFORMS } from '@/lib/constants';
import { ProductPageSEO } from '@/components/SEO';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Produto não fornecido');

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      let productQuery = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      productQuery = isUuid ? productQuery.eq('id', id) : productQuery.eq('slug', id);

      const { data, error } = await productQuery.maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Produto não encontrado');

      const { data: stock } = await supabase.rpc('get_available_stock', {
        p_product_id: data.id,
      });

      return { ...data, stock: stock || 0 };
    },
  });

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate('/catalogo')}>Voltar ao Catálogo</Button>
        </div>
      </Layout>
    );
  }

  const platformConfig = product
    ? Object.values(PLATFORMS).find(p => p.id === product.platform.toLowerCase())
    : null;

  const hasDiscount = product?.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount && product.original_price
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  const hasInternalStock = !!product && product.stock > 0;

  const handleBuyClick = () => {
    if (!product) return;

    if (hasInternalStock) {
      addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        imageUrl: product.image_url || undefined,
        platform: product.platform,
      });
      toast.success('Produto adicionado ao carrinho.');
      navigate('/carrinho');
      return;
    }

    toast.info('Produto indisponível no momento.');
  };

  return (
    <Layout>
      {product && (
        <ProductPageSEO
          name={product.name}
          description={product.description || undefined}
          price={Number(product.price)}
          image={product.image_url || undefined}
          productId={product.id}
          platform={platformConfig?.name || product.platform}
          inStock={hasInternalStock}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : product && (
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden glass-card">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${platformConfig?.gradient || 'from-primary/20 to-secondary/20'} flex items-center justify-center`}>
                    <span className="font-display text-6xl font-bold text-foreground/20">
                      {product.platform.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-sm font-bold rounded-lg bg-gradient-to-r ${platformConfig?.gradient || 'from-primary to-secondary'} text-foreground`}>
                  {platformConfig?.name || product.platform}
                </span>
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {formatCurrency(Number(product.price))}
                </span>
                {hasDiscount && product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(Number(product.original_price))}
                  </span>
                )}
              </div>

              <div className={`flex items-center gap-2 mb-6 ${hasInternalStock ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${hasInternalStock ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="text-sm font-medium">
                  {hasInternalStock
                    ? 'Entrega automática após pagamento aprovado'
                    : 'Produto indisponível no momento'}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground mb-8">
                  {product.description}
                </p>
              )}

              {/* Buy Button */}
              <Button
                size="lg"
                onClick={handleBuyClick}
                disabled={!hasInternalStock}
                className="gap-2 mb-8 neon-glow"
              >
                <ShoppingCart className="w-5 h-5" />
                {hasInternalStock ? 'Comprar agora' : 'Indisponível'}
              </Button>

              <p className="text-xs text-muted-foreground mb-8">
                Produto digital. O código fica disponível na sua conta depois que o pagamento for confirmado.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 glass-card">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Entrega digital</p>
                    <p className="text-xs text-muted-foreground">Após pagamento aprovado</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 glass-card">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Produto digital</p>
                    <p className="text-xs text-muted-foreground">Código protegido na conta</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Product;

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORMS, CATEGORIES } from '@/lib/constants';
import { CatalogPageSEO } from '@/components/SEO';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('busca') || '');
  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get('plataforma') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('busca', searchQuery);
    if (selectedPlatform) params.set('plataforma', selectedPlatform);
    if (selectedCategory) params.set('categoria', selectedCategory);
    setSearchParams(params);
  }, [searchQuery, selectedPlatform, selectedCategory, setSearchParams]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchQuery, selectedPlatform, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (selectedPlatform) {
        query = query.eq('platform', selectedPlatform);
      }
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Get safe stock count per product
      const productIds = data.map(p => p.id);
      const stockEntries = await Promise.all(
        productIds.map(async (productId) => {
          const { data: stock } = await supabase.rpc('get_available_stock', {
            p_product_id: productId,
          });
          return [productId, stock || 0] as const;
        })
      );

      const stockMap = Object.fromEntries(stockEntries);

      return data.map(p => ({
        ...p,
        stock: stockMap[p.id] || 0,
      }));
    },
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('');
    setSelectedCategory('');
  };

  const hasFilters = searchQuery || selectedPlatform || selectedCategory;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium mb-2 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nome do produto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Platforms */}
      <div>
        <label className="text-sm font-medium mb-2 block">Plataforma</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(PLATFORMS).map(platform => (
            <Button
              key={platform.id}
              variant={selectedPlatform === platform.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlatform(selectedPlatform === platform.id ? '' : platform.id)}
            >
              {platform.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
          <X className="w-4 h-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <CatalogPageSEO />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Catálogo
          </h1>
          <p className="text-muted-foreground">
            Gift cards e assinaturas para suas plataformas favoritas.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="glass-card p-6 sticky top-24">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </h2>
              <FilterContent />
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                    {hasFilters && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {searchQuery && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-2">
                    Busca: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPlatform && (
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                    {Object.values(PLATFORMS).find(p => p.id === selectedPlatform)?.name}
                    <button onClick={() => setSelectedPlatform('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm flex items-center gap-2">
                    {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </motion.div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <Skeleton className="aspect-[4/3]" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground mb-4">
                  Nenhum produto encontrado
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
              >
                {products?.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={Number(product.price)}
                    originalPrice={product.original_price ? Number(product.original_price) : null}
                    imageUrl={product.image_url}
                    platform={product.platform}
                    category={product.category}
                    stock={product.stock}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Catalog;

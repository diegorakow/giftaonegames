import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Zap, Clock, Headphones, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PLATFORMS } from '@/lib/constants';

const platformIcons: Record<string, JSX.Element> = {
  psn:
  <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14" fill="currentColor">
      <path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z" />
    </svg>,

  xbox:
  <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14" fill="currentColor">
      <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z" />
    </svg>,

  steam:
  <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </svg>,

  nintendo:
  <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14" fill="currentColor">
      <path d="M14.176 24h3.674c3.376 0 6.15-2.774 6.15-6.15V6.15C24 2.775 21.226 0 17.85 0H14.1c-.074 0-.15.074-.15.15v23.7c-.001.076.075.15.226.15zm4.574-13.199c1.351 0 2.399 1.125 2.399 2.398 0 1.352-1.125 2.4-2.399 2.4-1.35 0-2.4-1.049-2.4-2.4-.075-1.349 1.05-2.398 2.4-2.398zM11.4 0H6.15C2.775 0 0 2.775 0 6.15v11.7C0 21.226 2.775 24 6.15 24h5.25c.074 0 .15-.074.15-.149V.15c.001-.076-.075-.15-.15-.15zM9.676 22.051H6.15c-2.326 0-4.201-1.875-4.201-4.201V6.15c0-2.326 1.875-4.201 4.201-4.201H9.6l.076 20.102zM3.75 7.199c0 1.275.975 2.25 2.25 2.25s2.25-.975 2.25-2.25c0-1.273-.975-2.25-2.25-2.25s-2.25.977-2.25 2.25z" />
    </svg>
};

const trustBadges = [
{ icon: Shield, label: 'Pagamento seguro', desc: 'Criptografia de ponta' },
{ icon: Zap, label: 'Entrega em minutos', desc: 'Após confirmação' },
{ icon: Clock, label: 'Acesso 24h', desc: 'Códigos na sua conta' },
{ icon: Headphones, label: 'Suporte dedicado', desc: 'Via Discord e e-mail' }];


const Start = () => {
  const { data: promoProducts, isLoading } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('products').
      select('*').
      eq('is_active', true).
      order('created_at', { ascending: false }).
      limit(12);

      if (error) throw error;

      const stockEntries = await Promise.all(
        data.map(async (product) => {
          const { data: stock } = await supabase.rpc('get_available_stock', {
            p_product_id: product.id,
          });
          return [product.id, stock || 0] as const;
        })
      );

      const stockCounts = Object.fromEntries(stockEntries);

      const enriched = data.map((p) => ({ ...p, stock: stockCounts[p.id] || 0 }));

      return enriched.sort((a, b) => {
        if ((a as any).is_promo && !(b as any).is_promo) return -1;
        if (!(a as any).is_promo && (b as any).is_promo) return 1;
        const discA = a.original_price ? (a.original_price - a.price) / a.original_price : 0;
        const discB = b.original_price ? (b.original_price - b.price) / b.original_price : 0;
        return discB - discA;
      });
    }
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      {/* Platform Selection */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 md:mb-16">

            <h1 className="font-display text-2xl md:text-6xl font-bold mb-4 leading-tight">
              Escolha sua <span className="text-gradient">plataforma</span>
            </h1>
            <p className="max-w-xl mx-auto text-sm md:text-lg font-normal text-center text-blue-200">Gift cards, assinaturas e créditos. 
Entrega automática após pagamento confirmado.

            </p>
          </motion.div>

          <motion.div variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">

            {Object.values(PLATFORMS).map((platform) =>
            <motion.div key={platform.id} variants={item}>
                <Link
                to={`/catalogo?plataforma=${platform.id}`}
                className={`group relative block p-8 md:p-10 rounded-2xl bg-gradient-to-br ${platform.gradient} hover:scale-[1.03] transition-all duration-300 overflow-hidden`}>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/10" />
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="text-foreground/80 group-hover:text-foreground transition-colors group-hover:scale-110 transition-transform duration-300">
                      {platformIcons[platform.id]}
                    </div>
                    <span className="font-display font-bold text-lg md:text-xl text-foreground">
                      {platform.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 border-y border-border/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">

            {trustBadges.map((badge) =>
            <div key={badge.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Promo Products */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Destaques
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold">
                Promoções do <span className="text-gradient">dia</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Os melhores preços em gift cards e assinaturas
              </p>
            </div>
            <Link to="/catalogo">
              <Button variant="outline" className="gap-2">
                Ver catálogo completo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ?
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) =>
            <div key={i} className="glass-card overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
            )}
            </div> :
          promoProducts && promoProducts.length > 0 ?
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {promoProducts.map((product) =>
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
              stock={product.stock} />

            )}
            </div> :

          <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma promoção disponível no momento.</p>
            </div>
          }
        </div>
      </section>
    </Layout>);

};

export default Start;

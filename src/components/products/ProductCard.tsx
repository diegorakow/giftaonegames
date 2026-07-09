import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, PLATFORMS } from '@/lib/constants';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  slug?: string | null;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  platform: string;
  category: string;
  stock?: number;
}

export const ProductCard = ({
  id,
  slug,
  name,
  price,
  originalPrice,
  imageUrl,
  platform,
  stock,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const platformConfig = Object.values(PLATFORMS).find(p => p.id === platform.toLowerCase());
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const hasInternalStock = typeof stock === 'number' && stock > 0;

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasInternalStock) {
      addItem({
        productId: id,
        name,
        price,
        quantity: 1,
        imageUrl: imageUrl || undefined,
        platform,
      });
      toast.success('Produto adicionado ao carrinho.');
      navigate('/carrinho');
      return;
    }

    navigate(`/produto/${slug || id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/produto/${slug || id}`}
        className="block glass-card overflow-hidden group"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${platformConfig?.gradient || 'from-primary/20 to-secondary/20'} flex items-center justify-center`}>
              <span className="font-display text-3xl font-bold text-foreground/30">
                {platform.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md flex items-center gap-1">
                <Tag className="w-3 h-3" />
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Platform badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-bold rounded-md bg-gradient-to-r ${platformConfig?.gradient || 'from-primary to-secondary'} text-foreground`}>
              {platformConfig?.name || platform}
            </span>
          </div>

          {/* Quick buy button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              onClick={handleBuyClick}
              size="lg"
              className="gap-2"
              disabled={!hasInternalStock}
            >
              <ShoppingCart className="w-4 h-4" />
              {hasInternalStock ? 'Comprar' : 'Indisponível'}
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          <p className={`mt-2 text-xs ${hasInternalStock ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasInternalStock ? 'Entrega digital após pagamento aprovado' : 'Produto indisponível no momento'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

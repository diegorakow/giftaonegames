import { Trophy, Gift, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useUserLevel, useLevelsConfig } from '@/hooks/useUserLevel';
import { LevelBadge } from './LevelBadge';
import { Skeleton } from '@/components/ui/skeleton';

interface LevelProgressCardProps {
  compact?: boolean;
}

export const LevelProgressCard = ({ compact = false }: LevelProgressCardProps) => {
  const { levelInfo, isLoading, progressPercent } = useUserLevel();
  const { data: levelsConfig } = useLevelsConfig();

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!levelInfo) return null;

  const currentLevelConfig = levelsConfig?.find(l => l.level === levelInfo.current_level);
  const nextLevelConfig = levelsConfig?.find(l => l.level === levelInfo.next_level);
  
  const xpToNextLevel = levelInfo.xp_for_next_level 
    ? levelInfo.xp_for_next_level - levelInfo.xp_total 
    : 0;

  const currentXpInLevel = levelInfo.xp_total - (currentLevelConfig?.xp_required_total || 0);
  const xpNeededForLevel = (nextLevelConfig?.xp_required_total || 0) - (currentLevelConfig?.xp_required_total || 0);
  const actualProgress = xpNeededForLevel > 0 ? (currentXpInLevel / xpNeededForLevel) * 100 : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <LevelBadge level={levelInfo.current_level} title={levelInfo.level_title} size="sm" />
        {levelInfo.next_level && (
          <div className="flex-1 max-w-[100px]">
            <Progress value={actualProgress} className="h-1.5" />
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Level Up</h3>
            <p className="text-sm text-muted-foreground">Sistema de Fidelidade</p>
          </div>
        </div>
        <LevelBadge 
          level={levelInfo.current_level} 
          title={levelInfo.level_title} 
          size="lg"
          showTitle 
        />
      </div>

      {/* XP Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {levelInfo.xp_total.toLocaleString('pt-BR')} XP
          </span>
        </div>
        <Progress value={actualProgress} className="h-3" />
        {levelInfo.next_level && (
          <p className="text-xs text-muted-foreground text-right">
            Faltam <span className="font-semibold text-primary">{xpToNextLevel.toLocaleString('pt-BR')} XP</span> para o nível {levelInfo.next_level}
          </p>
        )}
        {!levelInfo.next_level && (
          <p className="text-xs text-primary text-right font-medium">
            ⭐ Nível máximo alcançado!
          </p>
        )}
      </div>

      {/* Current Perks */}
      {levelInfo.level_perk.coupon_percent && levelInfo.level_perk.coupon_percent > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Seu benefício ativo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Como <span className="font-medium text-foreground">{levelInfo.level_title}</span>, você ganha{' '}
            <span className="font-bold text-primary">{levelInfo.level_perk.coupon_percent}% de desconto</span> em cupons exclusivos.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Ganhe <span className="font-medium text-foreground">1 XP por cada R$ 1</span> em compras pagas
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Suba de nível e desbloqueie <span className="font-medium text-foreground">cupons maiores</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

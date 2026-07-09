import * as React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  className?: string;
}

const getLevelColor = (level: number) => {
  if (level >= 17) return 'from-cyan-400 to-blue-500'; // Diamante
  if (level >= 14) return 'from-purple-400 to-purple-600'; // Platina
  if (level >= 11) return 'from-yellow-400 to-yellow-600'; // Ouro
  if (level >= 8) return 'from-gray-300 to-gray-400'; // Prata
  if (level >= 5) return 'from-orange-400 to-orange-600'; // Bronze
  return 'from-green-400 to-green-600'; // Iniciante
};

export const LevelBadge = React.forwardRef<HTMLSpanElement, LevelBadgeProps>(
  ({ level, title, size = 'md', showTitle = false, className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-xs px-1.5 py-0.5 gap-1',
      md: 'text-sm px-2 py-1 gap-1.5',
      lg: 'text-base px-3 py-1.5 gap-2'
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold rounded-full bg-gradient-to-r text-white shadow-sm',
          getLevelColor(level),
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <Trophy className={iconSizes[size]} />
        <span>Lv.{level}</span>
        {showTitle && <span className="opacity-90">• {title}</span>}
      </span>
    );
  }
);

LevelBadge.displayName = 'LevelBadge';

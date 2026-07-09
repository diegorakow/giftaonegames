import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserLevelInfo {
  xp_total: number;
  current_level: number;
  level_title: string;
  level_perk: {
    badge?: string;
    coupon_percent?: number;
  };
  next_level: number | null;
  xp_for_next_level: number | null;
  xp_progress: number;
}

export interface LevelConfig {
  level: number;
  xp_required_total: number;
  title: string;
  perk_json: {
    badge?: string;
    coupon_percent?: number;
  };
}

export const useUserLevel = () => {
  const { user } = useAuth();

  const { data: levelInfo, isLoading, refetch } = useQuery({
    queryKey: ['user-level', user?.id],
    queryFn: async (): Promise<UserLevelInfo | null> => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_level_info', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching user level:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          xp_total: 0,
          current_level: 1,
          level_title: 'Novato',
          level_perk: { badge: 'novice' },
          next_level: 2,
          xp_for_next_level: 50,
          xp_progress: 0
        };
      }

      const row = data[0];
      return {
        xp_total: row.xp_total || 0,
        current_level: row.current_level || 1,
        level_title: row.level_title || 'Novato',
        level_perk: (row.level_perk as UserLevelInfo['level_perk']) || { badge: 'novice' },
        next_level: row.next_level,
        xp_for_next_level: row.xp_for_next_level,
        xp_progress: row.xp_progress || 0
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Calcular progresso percentual para barra
  const progressPercent = levelInfo && levelInfo.xp_for_next_level
    ? Math.min(
        100,
        ((levelInfo.xp_progress) / 
          (levelInfo.xp_for_next_level - (levelInfo.xp_total - levelInfo.xp_progress))) * 100
      )
    : 100;

  return {
    levelInfo,
    isLoading,
    refetch,
    progressPercent: isNaN(progressPercent) ? 0 : progressPercent
  };
};

export const useLevelsConfig = () => {
  return useQuery({
    queryKey: ['levels-config'],
    queryFn: async (): Promise<LevelConfig[]> => {
      const { data, error } = await supabase
        .from('levels_config')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      return (data || []).map(l => ({
        ...l,
        perk_json: (l.perk_json || {}) as LevelConfig['perk_json']
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

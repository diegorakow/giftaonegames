import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (user: User | null): string => {
  if (!user) return '?';
  
  const name = user.user_metadata?.full_name || 
               user.user_metadata?.name ||
               user.email;
  
  if (!name) return '?';
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarUrl = (user: User | null): string | undefined => {
  if (!user) return undefined;
  
  // Google OAuth avatar
  const googleAvatar = user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture;
  
  if (googleAvatar) return googleAvatar;
  
  return undefined;
};

export const UserAvatar = ({ user, size = 'md', className }: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base'
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={getAvatarUrl(user)} 
        alt={user?.user_metadata?.full_name || 'Avatar'} 
      />
      <AvatarFallback className="bg-primary/20 text-primary font-medium">
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
};

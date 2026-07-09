import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook that provides a guard function to block unconfirmed users
 * from performing sensitive actions (checkout, reveal codes, etc.)
 */
export const useEmailGate = () => {
  const { user, isEmailConfirmed } = useAuth();
  const navigate = useNavigate();

  /**
   * Returns true if the user can proceed, false otherwise.
   * Shows a toast and redirects to /verify-email if not confirmed.
   */
  const guardAction = (): boolean => {
    if (!user) {
      navigate('/login');
      return false;
    }
    if (!isEmailConfirmed) {
      toast.error('Confirme seu e-mail antes de continuar.');
      navigate('/verify-email');
      return false;
    }
    return true;
  };

  return { guardAction, isEmailConfirmed };
};

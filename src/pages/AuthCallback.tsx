import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the token exchange from the URL hash/query params
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setErrorMessage(error.message);
          setStatus('error');
          return;
        }

        if (data.session) {
          setStatus('success');
          // Check for stored redirect
          const authRedirect = sessionStorage.getItem('auth_redirect');
          const redirectTo = authRedirect || '/';
          sessionStorage.removeItem('auth_redirect');

          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 1500);
        } else {
          // No session but no error - might be email confirmation without auto-login
          setStatus('success');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected auth callback error:', err);
        setErrorMessage('Erro inesperado ao processar confirmação.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="font-display text-xl font-bold mb-2">Processando...</h1>
            <p className="text-muted-foreground">Confirmando sua conta, aguarde.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold mb-2">E-mail Confirmado!</h1>
            <p className="text-muted-foreground">Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-xl font-bold mb-2">Erro na Confirmação</h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'O link pode ter expirado. Tente reenviar o e-mail de confirmação.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/login')}>Ir para Login</Button>
              <Button variant="outline" onClick={() => navigate('/verify-email')}>
                Reenviar Confirmação
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Gamepad2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If user is confirmed, redirect
  const isConfirmed = user?.email_confirmed_at != null;

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-4">E-mail Confirmado!</h1>
          <p className="text-muted-foreground mb-8">
            Sua conta está verificada. Você já pode usar todas as funcionalidades.
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            Ir para a Loja
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    const email = user?.email;
    if (!email) {
      toast.error('Nenhum e-mail encontrado. Faça login novamente.');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('rate')) {
          toast.error('Aguarde antes de reenviar o e-mail.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('E-mail de confirmação reenviado!');
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      toast.error('Erro ao reenviar. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <span className="font-display font-bold text-2xl text-gradient">GIFTZONE</span>
        </Link>

        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          <h1 className="font-display text-2xl font-bold mb-4">Verifique seu E-mail</h1>

          <p className="text-muted-foreground mb-2">
            Enviamos um link de confirmação para:
          </p>
          <p className="font-medium text-foreground mb-6">
            {user?.email || 'seu e-mail cadastrado'}
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            Clique no link do e-mail para ativar sua conta. Verifique também a pasta de spam.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : resending
                  ? 'Reenviando...'
                  : 'Reenviar E-mail de Confirmação'}
            </Button>

            <Button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

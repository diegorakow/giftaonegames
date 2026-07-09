import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Loader2, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LevelProgressCard } from '@/components/user/LevelProgressCard';
import { UserAvatar } from '@/components/user/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/perfil');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        ''
      );
    }
  }, [user]);

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error('Informe seu nome.');
      return;
    }
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (authError) throw authError;

      // Also update profiles table
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user!.id);

      toast.success('Nome atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar nome.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Erro ao alterar senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isOAuthUser = !!user.app_metadata?.provider && user.app_metadata.provider !== 'email';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display font-bold mb-8 text-gradient">Meu Perfil</h1>

          {/* Avatar & Level */}
          <div className="glass-card p-6 mb-6 flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
              </p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              {user.email_confirmed_at ? (
                <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                  <Shield className="w-3 h-3" /> E-mail verificado
                </span>
              ) : (
                <span className="text-xs text-destructive mt-1">E-mail não verificado</span>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-6">
            <LevelProgressCard />
          </div>

          {/* Edit Name */}
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Informações Pessoais
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="pl-10 opacity-60"
                  />
                </div>
              </div>
              <Button onClick={handleSaveName} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </Button>
            </div>
          </div>

          {/* Change Password - only for email users */}
          {!isOAuthUser && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Alterar Senha
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword}
                  variant="outline"
                  className="gap-2"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Alterar Senha
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;

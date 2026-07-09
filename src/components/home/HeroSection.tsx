import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Gamepad, Trophy, Gift, Award, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden gradient-hero">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Entrega automática após pagamento confirmado
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Comprou, <span className="text-gradient">recebeu</span>.
            <br />
            Simples assim.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Na GiftZone, seus códigos ficam disponíveis na sua conta em minutos. 
            Sem espera, sem complicação — compre e jogue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link to="/catalogo">
              <Button size="lg" className="gap-2 text-lg px-8 neon-glow">
                Ver Catálogo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/como-resgatar">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Como funciona
              </Button>
            </Link>
          </motion.div>

          {/* Gaming highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 p-4 glass-card">
              <Gamepad className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">PSN, Xbox, Steam & mais</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 glass-card">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Ganhe XP a cada compra</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 glass-card">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Gift cards na hora</span>
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h2 className="text-center text-xl font-bold text-muted-foreground mb-8 tracking-tight">
            Por que comprar na GiftZone?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Histórico completo</h3>
              <p className="text-sm text-muted-foreground">
                Todos os seus pedidos e códigos ficam salvos na sua conta para consultar quando quiser
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Programa Level Up</h3>
              <p className="text-sm text-muted-foreground">
                Ganhe XP a cada compra paga e desbloqueie cupons de desconto exclusivos
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Segurança garantida</h3>
              <p className="text-sm text-muted-foreground">
                Pagamento criptografado e códigos protegidos até você decidir revelar
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

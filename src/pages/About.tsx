import { motion } from 'framer-motion';
import { Shield, Zap, Headphones, Award, Gamepad2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';

const features = [
  {
    icon: Zap,
    title: 'Entrega Instantânea',
    description: 'Seus códigos ficam disponíveis imediatamente após a confirmação do pagamento. Sem espera.',
  },
  {
    icon: Shield,
    title: 'Compra Segura',
    description: 'Pagamentos processados com criptografia de ponta. Seus dados estão sempre protegidos.',
  },
  {
    icon: Headphones,
    title: 'Suporte Dedicado',
    description: 'Equipe pronta para ajudar via e-mail e Discord. Sua satisfação é nossa prioridade.',
  },
  {
    icon: Award,
    title: 'Programa de Fidelidade',
    description: 'Ganhe XP a cada compra e suba de nível para desbloquear benefícios exclusivos.',
  },
];

const About = () => {
  return (
    <Layout>
      <SEO
        title="Sobre Nós | GiftZone"
        description="Conheça a GiftZone: sua loja de gift cards e produtos digitais para gamers. Entrega instantânea, compra segura e suporte dedicado."
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="w-10 h-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient">
              GIFTZONE
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Somos uma loja especializada em gift cards e produtos digitais para gamers.
            Nossa missão é oferecer os melhores preços com uma experiência de compra
            rápida, segura e sem complicações.
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 text-center"
        >
          <h2 className="text-xl font-display font-bold mb-4">Nossa Missão</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acreditamos que todo gamer merece acesso fácil e acessível a produtos digitais
            de qualidade. Trabalhamos todos os dias para oferecer a melhor seleção de gift
            cards para PlayStation, Xbox, Steam, Nintendo e muito mais, com preços justos e
            atendimento de primeira.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default About;

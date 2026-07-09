import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  HelpCircle, 
  BookOpen, 
  ShoppingBag,
  Shield,
  AlertTriangle
} from 'lucide-react';

const Help = () => {
  const quickLinks = [
    {
      icon: HelpCircle,
      title: 'Perguntas Frequentes',
      description: 'Respostas para dúvidas comuns',
      link: '/faq'
    },
    {
      icon: BookOpen,
      title: 'Como Resgatar',
      description: 'Tutoriais por plataforma',
      link: '/como-resgatar'
    },
    {
      icon: ShoppingBag,
      title: 'Meus Pedidos',
      description: 'Acompanhe suas compras',
      link: '/meus-pedidos'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Central de Ajuda
            </h1>
            <p className="text-muted-foreground">
              Estamos aqui para ajudar. Escolha como prefere entrar em contato.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {quickLinks.map((item, index) => (
              <Link key={index} to={item.link}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer h-full"
                >
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 md:p-8"
          >
            <h2 className="font-display text-xl font-bold mb-6">Fale Conosco</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">E-mail</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Para dúvidas gerais, problemas com pedidos ou suporte técnico
                  </p>
                  <a 
                    href="mailto:suporte@giftzone.com.br" 
                    className="text-primary hover:underline font-medium"
                  >
                    suporte@giftzone.com.br
                  </a>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Tempo de Resposta</h3>
                  <p className="text-sm text-muted-foreground">
                    Respondemos em até 24 horas úteis. Para pedidos urgentes relacionados a pagamentos, 
                    inclua o número do pedido no assunto do e-mail.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Important Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 space-y-4"
          >
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm mb-1">
                  Sobre reembolsos
                </p>
                <p className="text-sm text-muted-foreground">
                  Códigos digitais revelados não podem ser reembolsados, pois são de uso único. 
                  Verifique a região e produto antes de finalizar a compra.
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">
                  Sua segurança é importante
                </p>
                <p className="text-sm text-muted-foreground">
                  Nunca pediremos sua senha ou dados de pagamento por e-mail. 
                  Desconfie de contatos que solicitem essas informações.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            <p>
              Consulte também nossos{' '}
              <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>
              {' '}e{' '}
              <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Help;

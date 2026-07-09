import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      question: 'Como funciona a compra de gift cards?',
      answer: 'Escolha o produto desejado, adicione ao carrinho e finalize a compra. Após a confirmação do pagamento, os códigos ficam disponíveis na seção "Meus Pedidos" da sua conta.'
    },
    {
      question: 'Quando recebo meu código?',
      answer: 'Os códigos ficam disponíveis na sua conta assim que o pagamento for confirmado pelo processador. O tempo depende do método de pagamento escolhido (cartão de crédito costuma ser mais rápido, boleto pode levar até 3 dias úteis).'
    },
    {
      question: 'Onde encontro meus códigos comprados?',
      answer: 'Acesse "Meus Pedidos" no menu da sua conta. Lá você encontra todos os seus pedidos. Para pedidos pagos, clique em "Ver Código" para revelar cada código.'
    },
    {
      question: 'Posso pedir reembolso?',
      answer: 'Pedidos podem ser cancelados antes da confirmação do pagamento. Após revelar um código, não é possível solicitar reembolso, pois os códigos são de uso único e já foram visualizados.'
    },
    {
      question: 'Os códigos funcionam em qual região?',
      answer: 'Verifique na descrição do produto a região compatível. A maioria dos nossos gift cards são para contas brasileiras. Gift cards de outras regiões são indicados no título do produto.'
    },
    {
      question: 'Como resgato meu código?',
      answer: 'Cada plataforma tem seu próprio processo. Veja nosso guia completo na página "Como Resgatar" com instruções para PlayStation, Xbox, Steam e outras plataformas.'
    },
    {
      question: 'Os códigos têm validade?',
      answer: 'Gift cards geralmente não expiram, mas algumas promoções ou assinaturas podem ter prazo. Verifique os detalhes na descrição do produto e os termos da plataforma.'
    },
    {
      question: 'O que é o sistema Level Up?',
      answer: 'É nosso programa de fidelidade! A cada R$ 1 gasto em compras pagas, você ganha 1 XP. Conforme sobe de nível, desbloqueia benefícios como cupons de desconto exclusivos.'
    },
    {
      question: 'Minha compra é segura?',
      answer: 'Sim! Utilizamos criptografia para proteger seus dados. Os pagamentos são processados por provedores certificados. Além disso, mantemos um histórico de auditoria de todas as revelações de códigos.'
    },
    {
      question: 'Posso usar minha conta Google para entrar?',
      answer: 'Sim! Oferecemos login rápido com Google. Basta clicar em "Continuar com Google" na tela de login. Sua foto de perfil do Google aparecerá no site.'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground">
              Encontre respostas para as dúvidas mais comuns
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* CTA para mais ajuda */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center glass-card p-8"
          >
            <h3 className="font-semibold text-lg mb-2">Não encontrou sua resposta?</h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/como-resgatar">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver tutoriais de resgate
                </Button>
              </Link>
              <Link to="/ajuda">
                <Button className="gap-2 w-full sm:w-auto">
                  <MessageCircle className="w-4 h-4" />
                  Falar com Suporte
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FAQ;

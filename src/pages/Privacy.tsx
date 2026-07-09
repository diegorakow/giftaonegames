import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Política de Privacidade
          </h1>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Informações Coletadas</h2>
              <p className="text-muted-foreground">
                Coletamos apenas as informações necessárias para processar suas compras e fornecer nossos serviços:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>E-mail (para autenticação e comunicação)</li>
                <li>Nome (opcional, para personalização)</li>
                <li>Histórico de pedidos (para seu acompanhamento)</li>
                <li>Informações de login via Google (se utilizar essa opção)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Uso das Informações</h2>
              <p className="text-muted-foreground">
                Suas informações são usadas exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Processar e entregar seus pedidos</li>
                <li>Manter seu histórico de compras e códigos</li>
                <li>Comunicar sobre o status dos pedidos</li>
                <li>Gerenciar o sistema de fidelidade (Level Up)</li>
                <li>Melhorar nossos serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Segurança dos Dados</h2>
              <p className="text-muted-foreground">
                Utilizamos criptografia e práticas de segurança para proteger suas informações. 
                Os códigos dos produtos só são revelados mediante ação explícita do usuário, 
                com registro de auditoria para sua proteção.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Compartilhamento</h2>
              <p className="text-muted-foreground">
                Não vendemos ou compartilhamos suas informações pessoais com terceiros, 
                exceto quando necessário para processamento de pagamentos 
                (apenas dados mínimos para a transação).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Cookies e Rastreamento</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para manter sua sessão ativa 
                e garantir o funcionamento da plataforma. 
                Não utilizamos cookies de rastreamento para publicidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Seus Direitos</h2>
              <p className="text-muted-foreground">
                Você pode a qualquer momento:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Solicitar correção de informações</li>
                <li>Solicitar exclusão da conta (sujeito a retenção legal de registros de compra)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Contato</h2>
              <p className="text-muted-foreground">
                Para questões sobre privacidade, entre em contato através da nossa página de Ajuda.
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Privacy;

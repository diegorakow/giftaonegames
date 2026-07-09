import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';

const Terms = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Termos de Uso
          </h1>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar a GiftZone, você concorda em cumprir estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Produtos Digitais</h2>
              <p className="text-muted-foreground">
                Todos os produtos vendidos na GiftZone são códigos digitais (gift cards, assinaturas, créditos). 
                Os códigos ficam disponíveis na sua conta após a confirmação do pagamento.
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Os códigos são de uso único e intransferíveis após a revelação</li>
                <li>Após revelar um código, não é possível solicitar reembolso</li>
                <li>O usuário é responsável por guardar o código em local seguro</li>
                <li>Códigos não resgatados podem ter prazo de validade conforme a plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Conta de Usuário</h2>
              <p className="text-muted-foreground">
                Você é responsável por manter a confidencialidade da sua conta e senha. 
                Todas as atividades realizadas na sua conta são de sua responsabilidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Pagamentos</h2>
              <p className="text-muted-foreground">
                Os pagamentos são processados por provedores terceirizados de forma segura. 
                O código só é liberado após a confirmação do pagamento pelo processador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Cancelamentos e Reembolsos</h2>
              <p className="text-muted-foreground">
                Pedidos podem ser cancelados antes da confirmação do pagamento. 
                Após a revelação do código digital, não há possibilidade de reembolso, 
                pois o produto já foi efetivamente entregue.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Uso Adequado</h2>
              <p className="text-muted-foreground">
                É proibido utilizar a plataforma para fins fraudulentos, 
                tentar burlar sistemas de segurança ou realizar atividades ilegais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Alterações nos Termos</h2>
              <p className="text-muted-foreground">
                A GiftZone pode modificar estes termos a qualquer momento. 
                Alterações significativas serão comunicadas aos usuários.
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

export default Terms;

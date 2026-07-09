import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const HowToRedeem = () => {
  const [copiedStore, setCopiedStore] = useState<string | null>(null);

  const handleCopyLink = (link: string, storeName: string) => {
    navigator.clipboard.writeText(link);
    setCopiedStore(storeName);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedStore(null), 2000);
  };

  const platforms = [
    {
      id: 'psn',
      name: 'PlayStation',
      color: 'from-blue-500 to-blue-700',
      steps: [
        'Acesse a PlayStation Store no seu console ou em store.playstation.com',
        'Faça login na sua conta PSN',
        'Vá em "Resgatar Códigos" (no console: Configurações > Conta > Resgatar Códigos)',
        'Digite o código de 12 dígitos exatamente como aparece',
        'Confirme o resgate — os créditos serão adicionados à sua carteira'
      ],
      redeemLink: 'https://store.playstation.com/pt-br/latest',
      note: 'Códigos PSN Brasil funcionam apenas em contas brasileiras.'
    },
    {
      id: 'xbox',
      name: 'Xbox',
      color: 'from-green-500 to-green-700',
      steps: [
        'Acesse xbox.com/redeemcode ou abra a Microsoft Store no console',
        'Faça login com sua conta Microsoft/Xbox',
        'Insira o código de 25 caracteres (letras e números)',
        'Clique em "Próximo" e confirme o resgate',
        'O saldo será creditado na sua conta Microsoft'
      ],
      redeemLink: 'https://redeem.microsoft.com/',
      note: 'Códigos Xbox Brasil funcionam em contas com região definida como Brasil.'
    },
    {
      id: 'steam',
      name: 'Steam',
      color: 'from-gray-600 to-gray-800',
      steps: [
        'Abra o cliente Steam no seu PC ou acesse store.steampowered.com',
        'Faça login na sua conta Steam',
        'Clique no seu nome de usuário (canto superior direito) > "Detalhes da conta"',
        'Clique em "Adicionar fundos à Carteira Steam" > "Resgatar um código de carteira Steam"',
        'Digite o código e confirme'
      ],
      redeemLink: 'https://store.steampowered.com/account/redeemwalletcode',
      note: 'Códigos Steam podem ser resgatados de qualquer região, mas o valor é convertido para sua moeda local.'
    },
    {
      id: 'gamepass',
      name: 'Game Pass',
      color: 'from-green-400 to-teal-600',
      steps: [
        'Acesse xbox.com/redeemcode ou a Microsoft Store',
        'Faça login com sua conta Microsoft',
        'Digite o código do Game Pass',
        'Confirme a ativação da assinatura',
        'A assinatura será adicionada à sua conta imediatamente'
      ],
      redeemLink: 'https://redeem.microsoft.com/',
      note: 'Se já tiver uma assinatura ativa, o tempo será somado ao existente.'
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
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Como Resgatar seu Código
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Siga o passo a passo para cada plataforma. Seus códigos estão disponíveis em{' '}
              <Link to="/meus-pedidos" className="text-primary hover:underline">
                Meus Pedidos
              </Link>{' '}
              após a confirmação do pagamento.
            </p>
          </div>

          <Tabs defaultValue="psn" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              {platforms.map(platform => (
                <TabsTrigger key={platform.id} value={platform.id}>
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {platforms.map(platform => (
              <TabsContent key={platform.id} value={platform.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 md:p-8"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">
                        {platform.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">{platform.name}</h2>
                      <p className="text-sm text-muted-foreground">Instruções de resgate</p>
                    </div>
                  </div>

                  <ol className="space-y-4 mb-6">
                    {platform.steps.map((step, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {platform.note && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ {platform.note}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="default" 
                      className="gap-2"
                      onClick={() => window.open(platform.redeemLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar página de resgate
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleCopyLink(platform.redeemLink, platform.id)}
                    >
                      {copiedStore === platform.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar link
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Dicas gerais */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 glass-card p-6 md:p-8"
          >
            <h3 className="font-semibold text-lg mb-4">💡 Dicas importantes</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Copie o código diretamente da página "Meus Pedidos" para evitar erros de digitação</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Verifique se sua conta está na região correta antes de resgatar</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Guarde o código em local seguro após revelar — ele não pode ser recuperado depois</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Em caso de erro no resgate, entre em contato com o suporte da plataforma correspondente</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default HowToRedeem;

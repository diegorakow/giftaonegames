import { Link } from 'react-router-dom';
import { Gamepad2, Mail, Shield, CreditCard, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg text-gradient">GIFTZONE</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Produtos digitais para gamers. Códigos disponíveis na sua conta após confirmação do pagamento.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Catálogo
              </Link>
              <Link to="/catalogo?plataforma=psn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                PlayStation
              </Link>
              <Link to="/catalogo?plataforma=xbox" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Xbox
              </Link>
              <Link to="/catalogo?plataforma=steam" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Steam
              </Link>
              <Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nós
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Perguntas Frequentes
              </Link>
              <Link to="/como-resgatar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Como Resgatar
              </Link>
              <Link to="/ajuda" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Central de Ajuda
              </Link>
              <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </Link>
            </nav>
          </div>

          {/* Trust badges */}
          <div>
            <h4 className="font-semibold mb-4">Por que comprar aqui</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Compra segura e protegida</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Pagamento criptografado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>Código após confirmação</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>Suporte por e-mail</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GiftZone. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

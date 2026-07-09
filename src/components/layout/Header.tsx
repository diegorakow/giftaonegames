import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  Gamepad2,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  UserCircle } from
"lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/components/user/UserAvatar";
import { LevelBadge } from "@/components/user/LevelBadge";
import { useUserLevel } from "@/hooks/useUserLevel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DISCORD_INVITE_URL = "https://discord.gg/3YrUVZH9";

const DiscordIcon = ({ className }: {className?: string;}) =>
<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>;


export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { levelInfo } = useUserLevel();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?busca=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 px-[15px] bg-[#00071f] py-[24px]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/start" className="flex items-center gap-2 group">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-lg group-hover:bg-primary/40 transition-colors" />
            </div>
            <span className="font-display font-bold text-xl text-gradient hidden sm:block">GIFTZONE</span>
          </Link>

          {/* Search + Discord - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8 gap-2">
            <form onSubmit={handleSearch} className="flex-1 shadow-sm mx-0 py-0 px-0 bg-[#04123a] border-cyan-200 border-solid rounded-lg">
              <div className="relative w-full bg-transparent border-transparent border-0 rounded-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar gift cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pt-[10px] pb-[10px] pl-[39px] pr-[25px] mt-0 mx-0" />

              </div>
            </form>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord da comunidade" className="rounded-xl shadow-none border-0 border-none border-transparent">

                  <Button variant="ghost" size="icon" className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-transparent text-white/85 transition-all duration-[180ms] hover:bg-white/[0.06] hover:border-white/[0.18] hover:text-white">
                    <DiscordIcon className="w-5 h-5" />
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Entrar na comunidade no Discord</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/catalogo"
              className="text-sm transition-colors text-destructive-foreground font-normal">

              Catálogo
            </Link>

            {user ?
            <>
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <UserAvatar user={user} size="sm" />
                      <span className="hidden lg:inline text-sm max-w-[100px] truncate">{getUserDisplayName()}</span>
                      {levelInfo &&
                    <LevelBadge level={levelInfo.current_level} title={levelInfo.level_title} size="sm" />
                    }
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{getUserDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {levelInfo &&
                      <div className="mt-1">
                            <LevelBadge
                          level={levelInfo.current_level}
                          title={levelInfo.level_title}
                          size="sm"
                          showTitle />

                          </div>
                      }
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="cursor-pointer">
                        <UserCircle className="w-4 h-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/meus-pedidos" className="cursor-pointer">
                        <Package className="w-4 h-4 mr-2" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin &&
                  <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                  }
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </> :

            <Link to="/login">
                <Button variant="default" size="sm">
                  Entrar
                </Button>
              </Link>
            }

            <Link to="/carrinho" className="relative opacity-100 border-0 border-none rounded-none border-transparent">
              <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-xl border border-white/10 bg-transparent text-white/85 transition-all duration-[180ms] hover:bg-white/[0.06] hover:border-white/[0.18] hover:text-white">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 &&
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">

                    {itemCount}
                  </motion.span>
                }
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/carrinho" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 &&
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              }
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50">

              <div className="py-4 space-y-4">
                {/* User Info - Mobile */}
                {user &&
              <div className="flex items-center gap-3 px-4 pb-4 border-b border-border/50">
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {levelInfo &&
                  <div className="mt-1">
                          <LevelBadge level={levelInfo.current_level} title={levelInfo.level_title} size="sm" />
                        </div>
                  }
                    </div>
                  </div>
              }

                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                    type="text"
                    placeholder="Buscar gift cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

                  </div>
                </form>
                <nav className="flex flex-col gap-2">
                  <Link
                  to="/catalogo"
                  className="px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}>

                    Catálogo
                  </Link>
                  {user ?
                <>
                      <Link
                    to="/perfil"
                    className="px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}>

                        Meu Perfil
                      </Link>
                      <Link
                    to="/meus-pedidos"
                    className="px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}>

                        Meus Pedidos
                      </Link>
                      {isAdmin &&
                  <Link
                    to="/admin"
                    className="px-4 py-2 text-sm text-primary hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}>

                          Painel Admin
                        </Link>
                  }
                      <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-left text-destructive hover:bg-muted/50 rounded-lg transition-colors">

                        Sair
                      </button>
                    </> :

                <Link
                  to="/login"
                  className="px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}>

                      Entrar / Cadastrar
                    </Link>
                }
                  {/* Discord - Mobile */}
                  <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord da comunidade"
                  className="px-4 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}>

                    <DiscordIcon className="w-4 h-4" />
                    Discord
                  </a>
                </nav>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </header>);

};
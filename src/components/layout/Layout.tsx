import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#b210b2]">
      <Header />
      <main className="flex-1 bg-[#031226] pt-[96px] pr-0 pb-0 shadow-none rounded-none">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>);

};
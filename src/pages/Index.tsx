import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { PlatformsSection } from '@/components/home/PlatformsSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { HomePageSEO } from '@/components/SEO';

const Index = () => {
  return (
    <Layout>
      <HomePageSEO />
      <HeroSection />
      <PlatformsSection />
      <FeaturedProducts />
    </Layout>
  );
};

export default Index;

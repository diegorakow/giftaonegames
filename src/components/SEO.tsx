import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'GiftZone - Gift Cards PSN, Xbox, Steam e Game Pass';
const DEFAULT_DESCRIPTION = 'Compre gift cards de PSN, Xbox, Steam e Game Pass com entrega instantânea. Códigos 100% originais disponíveis imediatamente após confirmação do pagamento.';
const DEFAULT_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/XeY1Pp3qHNg3xN7zkhNVaSLntcb2/social-images/social-1770068921257-ChatGPT Image 30 de jan. de 2026, 16_22_58.png';
const SITE_URL = 'https://game-loot-locker.lovable.app';

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title ? `${title} | GiftZone` : DEFAULT_TITLE;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="GiftZone" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Pre-built SEO configurations for common pages
export const HomePageSEO = () => (
  <SEO
    url="/"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GiftZone',
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/catalogo?busca={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }}
  />
);

export const CatalogPageSEO = () => (
  <SEO
    title="Catálogo"
    description="Navegue por nossa seleção completa de gift cards: PSN, Xbox Live, Steam, Game Pass e mais. Entrega instantânea e códigos 100% originais."
    url="/catalogo"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Catálogo de Gift Cards',
      description: 'Gift cards para PlayStation, Xbox, Steam e mais plataformas.',
      url: `${SITE_URL}/catalogo`,
    }}
  />
);

export const CartPageSEO = () => (
  <SEO
    title="Carrinho"
    description="Revise os itens no seu carrinho de compras antes de finalizar o pedido."
    url="/carrinho"
    noIndex
  />
);

export const CheckoutPageSEO = () => (
  <SEO
    title="Checkout"
    description="Finalize sua compra de gift cards com pagamento seguro."
    url="/checkout"
    noIndex
  />
);

export const MyOrdersPageSEO = () => (
  <SEO
    title="Meus Pedidos"
    description="Visualize seu histórico de pedidos e acesse seus códigos de gift cards."
    url="/meus-pedidos"
    noIndex
  />
);

export const ProductPageSEO = ({
  name,
  description,
  price,
  image,
  productId,
  platform,
  inStock,
}: {
  name: string;
  description?: string;
  price: number;
  image?: string;
  productId: string;
  platform: string;
  inStock: boolean;
}) => (
  <SEO
    title={name}
    description={description || `Compre ${name} para ${platform}. Entrega instantânea após confirmação do pagamento.`}
    image={image}
    url={`/produto/${productId}`}
    type="product"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: description || `Gift card ${name} para ${platform}`,
      image: image || DEFAULT_IMAGE,
      url: `${SITE_URL}/produto/${productId}`,
      brand: {
        '@type': 'Brand',
        name: platform,
      },
      offers: {
        '@type': 'Offer',
        price: price.toFixed(2),
        priceCurrency: 'BRL',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'GiftZone',
        },
      },
    }}
  />
);

export const FAQPageSEO = () => (
  <SEO
    title="Perguntas Frequentes"
    description="Tire suas dúvidas sobre compra de gift cards, formas de pagamento, entrega de códigos e mais."
    url="/faq"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Como recebo meus códigos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Após a confirmação do pagamento, seus códigos ficam disponíveis na seção "Meus Pedidos" da sua conta.',
          },
        },
        {
          '@type': 'Question',
          name: 'Os códigos são originais?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim, todos os nossos códigos são 100% originais e válidos.',
          },
        },
      ],
    }}
  />
);

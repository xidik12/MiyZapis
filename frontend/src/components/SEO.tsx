import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  locale?: string;
}

const BASE_URL = 'https://miyzapis.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'МійЗапис';

const SEO: React.FC<SEOProps> = ({
  title,
  description = 'МійЗапис - Професійна платформа бронювання послуг. Знайдіть спеціаліста, забронюйте послугу та керуйте записами онлайн.',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  locale = 'uk_UA',
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Професійна платформа бронювання послуг`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="uk" href={fullUrl} />
      <link rel="alternate" hrefLang="en" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
    </Helmet>
  );
};

export default SEO;

// Blog index page — answer-style guides for SEO + AEO/GEO.
// Route: /blog

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import PublicSeo from '@/components/common/PublicSeo';
import { pick } from '@/data/seo.types';
import ARTICLES from '@/data/blogArticles';

const BASE_URL = 'https://miyzapis.com';

function buildBlogJsonLd(lang: string) {
  const blogPage = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${BASE_URL}/blog`,
        name: lang === 'ru' ? 'Блог и советы — МійЗапис' : lang === 'en' ? 'Blog & Guides — МійЗапис' : 'Блог і поради — МійЗапис',
        url: `${BASE_URL}/blog`,
        inLanguage: lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : 'uk',
        description:
          lang === 'ru'
            ? 'Полезные статьи и советы по красоте, здоровью и уходу за собой от специалистов МійЗапис.'
            : lang === 'en'
            ? 'Helpful articles and guides on beauty, health and self-care from МійЗапис specialists.'
            : "Корисні статті та поради з краси, здоров’я та догляду за собою від спеціалістів МійЗапис.",
        publisher: {
          '@type': 'Organization',
          name: 'МійЗапис',
          url: BASE_URL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'МійЗапис', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: lang === 'en' ? 'Blog' : 'Блог', item: `${BASE_URL}/blog` },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: ARTICLES.map((a, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/blog/${a.slug}`,
          name: pick(a.title, lang as 'uk' | 'ru' | 'en'),
        })),
      },
    ],
  };
  return blogPage;
}

const BlogIndexPage: React.FC = () => {
  const { language, t } = useLanguage();
  const lang = language as 'uk' | 'ru' | 'en';

  const pageTitle =
    t('blog.indexTitle') ||
    (lang === 'ru' ? 'Блог и советы — МійЗапис' : lang === 'en' ? 'Blog & Guides — МійЗапис' : 'Блог і поради — МійЗапис');

  const pageDesc =
    t('blog.indexDesc') ||
    (lang === 'ru'
      ? 'Полезные статьи о красоте, здоровье и записи к специалистам. Советы от экспертов МійЗапис.'
      : lang === 'en'
      ? 'Helpful articles on beauty, health and booking specialists. Expert guides from МійЗапис.'
      : "Корисні статті про красу, здоров'я та онлайн-запис до спеціалістів. Поради від МійЗапис.");

  const intro =
    t('blog.intro') ||
    (lang === 'ru'
      ? 'Практичные советы, ценовые гиды и ответы на вопросы о красоте и здоровье — для тех, кто хочет выбирать специалистов осознанно.'
      : lang === 'en'
      ? 'Practical tips, price guides and answers to beauty and health questions — for clients who want to make informed choices.'
      : "Практичні поради, цінові гіди та відповіді на питання про красу і здоров’я — для тих, хто хоче обирати спеціалістів свідомо.");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicSeo
        title={pageTitle}
        description={pageDesc}
        url={`${BASE_URL}/blog`}
        type="website"
        jsonLd={buildBlogJsonLd(lang)}
      />

      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              МійЗапис
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {lang === 'en' ? 'Blog' : 'Блог'}
            </span>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {lang === 'ru' ? 'Блог и советы' : lang === 'en' ? 'Blog & Guides' : 'Блог і поради'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            {intro}
          </p>
        </div>
      </div>

      {/* ── Articles grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ARTICLES.map((article) => {
            const title = pick(article.title, lang);
            const excerpt = pick(article.excerpt, lang);
            const category = pick(article.category, lang);

            const readLabel =
              lang === 'ru'
                ? `${article.readingMinutes} мин`
                : lang === 'en'
                ? `${article.readingMinutes} min`
                : `${article.readingMinutes} хв`;

            const pubDate = new Date(article.publishedAt).toLocaleDateString(
              lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' },
            );

            return (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md"
              >
                {/* Emoji + category chip */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {article.emoji}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                    {category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1 mb-4">
                  {excerpt}
                </p>

                {/* Meta: date + reading time */}
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                  <span>{pubDate}</span>
                  <span>
                    {readLabel} {lang === 'en' ? 'read' : lang === 'ru' ? 'чтения' : 'читання'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlogIndexPage;

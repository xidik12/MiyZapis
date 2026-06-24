// Individual blog/guide article page.
// Route: /blog/:slug
// No external Markdown dep — renders paragraphs, ## headings and - bullet lists inline.

import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import PublicSeo from '@/components/common/PublicSeo';
import { pick } from '@/data/seo.types';
import ARTICLES from '@/data/blogArticles';

const BASE_URL = 'https://miyzapis.com';

// ── Simple local Markdown renderer ──────────────────────────────────────────
// Supports: ## headings, - bullet lists, blank-line paragraph breaks.
// Keeps the bundle free of any external dep.
function renderMarkdown(md: string): React.ReactNode[] {
  const blocks = md.trim().split(/\n{2,}/);
  return blocks.map((block, blockIdx) => {
    const lines = block.split('\n');

    // ### heading (h3)
    if (lines[0].startsWith('### ')) {
      return (
        <h3
          key={blockIdx}
          className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-2"
        >
          {lines[0].replace(/^### /, '')}
        </h3>
      );
    }

    // ## heading (h2)
    if (lines[0].startsWith('## ')) {
      return (
        <h2
          key={blockIdx}
          className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700"
        >
          {lines[0].replace(/^## /, '')}
        </h2>
      );
    }

    // Bullet list block — all lines start with "- "
    if (lines.every((l) => l.startsWith('- '))) {
      return (
        <ul key={blockIdx} className="list-disc list-inside space-y-1.5 my-3 pl-1">
          {lines.map((l, li) => (
            <li key={li} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {renderInline(l.replace(/^- /, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Mixed block: some lines may be bullets, others text
    const hasBullets = lines.some((l) => l.startsWith('- '));
    if (hasBullets) {
      return (
        <div key={blockIdx} className="my-3">
          {lines.map((l, li) => {
            if (l.startsWith('- ')) {
              return (
                <div key={li} className="flex gap-2 items-start my-1">
                  <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {renderInline(l.replace(/^- /, ''))}
                  </span>
                </div>
              );
            }
            if (l.trim() === '') return null;
            return (
              <p key={li} className="text-gray-700 dark:text-gray-300 leading-relaxed my-1">
                {renderInline(l)}
              </p>
            );
          })}
        </div>
      );
    }

    // Plain paragraph
    return (
      <p key={blockIdx} className="text-gray-700 dark:text-gray-300 leading-relaxed my-3">
        {renderInline(lines.join(' '))}
      </p>
    );
  });
}

// Render inline: **bold** and [text](url) links
function renderInline(text: string): React.ReactNode {
  // Split on **bold** and [text](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = href.startsWith('http');
      if (isExternal) {
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700"
          >
            {label}
          </a>
        );
      }
      return (
        <Link
          key={i}
          to={href}
          className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700"
        >
          {label}
        </Link>
      );
    }
    return part;
  });
}

// ── JSON-LD builder ────────────────────────────────────────────────────────
function buildArticleJsonLd(
  slug: string,
  title: string,
  excerpt: string,
  publishedAt: string,
  faqs: Array<{ q: string; a: string }>,
  lang: string,
) {
  const url = `${BASE_URL}/blog/${slug}`;
  const graph: object[] = [
    {
      '@type': 'BlogPosting',
      '@id': url,
      headline: title,
      description: excerpt,
      datePublished: publishedAt,
      dateModified: publishedAt,
      url,
      inLanguage: lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : 'uk',
      author: {
        '@type': 'Organization',
        name: 'МійЗапис',
        url: BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'МійЗапис',
        url: BASE_URL,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'МійЗапис', item: BASE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: lang === 'en' ? 'Blog' : 'Блог',
          item: `${BASE_URL}/blog`,
        },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ── Component ─────────────────────────────────────────────────────────────
const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const lang = language as 'uk' | 'ru' | 'en';

  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const title = pick(article.title, lang);
  const excerpt = pick(article.excerpt, lang);
  const body = pick(article.body, lang);
  const category = pick(article.category, lang);

  const faqs = (article.faqs ?? []).map((faq) => ({
    q: pick(faq.q, lang),
    a: pick(faq.a, lang),
  }));

  const pubDate = new Date(article.publishedAt).toLocaleDateString(
    lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  const readLabel =
    lang === 'ru'
      ? `${article.readingMinutes} мин чтения`
      : lang === 'en'
      ? `${article.readingMinutes} min read`
      : `${article.readingMinutes} хв читання`;

  const backLabel =
    t('blog.backToBlog') || (lang === 'ru' ? '← Назад к блогу' : lang === 'en' ? '← Back to Blog' : '← Назад до блогу');

  const ctaLabel =
    t('blog.findSpecialist') ||
    (lang === 'ru' ? 'Знайти спеціаліста' : lang === 'en' ? 'Find a Specialist' : 'Знайти спеціаліста');

  const ctaDesc =
    t('blog.ctaDesc') ||
    (lang === 'ru'
      ? 'Запишитесь онлайн прямо сейчас — без звонков и очередей.'
      : lang === 'en'
      ? 'Book online right now — no calls, no waiting.'
      : 'Записуйтесь онлайн прямо зараз — без дзвінків і черг.');

  const faqHeading =
    t('blog.faqHeading') ||
    (lang === 'ru' ? 'Часто задаваемые вопросы' : lang === 'en' ? 'Frequently Asked Questions' : 'Часті запитання');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicSeo
        title={`${title} | МійЗапис`}
        description={excerpt}
        url={`${BASE_URL}/blog/${article.slug}`}
        type="article"
        jsonLd={buildArticleJsonLd(article.slug, title, excerpt, article.publishedAt, faqs, lang)}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            МійЗапис
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {lang === 'en' ? 'Blog' : 'Блог'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-xs">{title}</span>
        </nav>

        {/* ── Article header ── */}
        <header className="mb-8">
          {/* Category chip */}
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800 mb-4">
            {article.emoji} {category}
          </span>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4 text-balance">
            {title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap tabular-nums">
            <time dateTime={article.publishedAt}>{pubDate}</time>
            <span aria-hidden="true">·</span>
            <span>{readLabel}</span>
          </div>
        </header>

        {/* ── Article body ── */}
        <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-8 mb-8">
          {renderMarkdown(body)}
        </article>

        {/* ── FAQ section ── */}
        {faqs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {faqHeading}
            </h2>
            <div className="space-y-3">
              {faqs.map(({ q, a }, idx) => (
                <details
                  key={idx}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <summary className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-snug">
                      {q}
                    </span>
                    <span className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200 mt-0.5">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <div className="bg-primary-600 rounded-xl p-5 sm:p-7 text-white mb-8">
          <p className="text-base sm:text-lg font-semibold mb-1">{ctaLabel}</p>
          <p className="text-primary-100 text-sm mb-4">{ctaDesc}</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors"
          >
            {lang === 'ru' ? 'Перейти к поиску' : lang === 'en' ? 'Browse specialists' : 'Перейти до пошуку'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* ── Back link ── */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
};

export default BlogArticlePage;

// Public business landing page at /biz/:slug.
// Renders the business profile + its specialists, no auth required.

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { businessService, type Business } from '../services/business.service';
import { PageLoader } from '@/components/ui';
import PublicSeo from '../components/common/PublicSeo';
import { buildBusinessJsonLd } from '../utils/structuredData';

const BusinessPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    businessService.getBySlug(slug)
      .then(setBusiness)
      .catch((err) => setError(err?.message || 'Business not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageLoader /></div>;
  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business not found</h1>
          <p className="text-gray-500 mb-4">We couldn't find a business with that URL.</p>
          <Link to="/" className="text-primary-600 hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const members = (business.members ?? []).filter((m: any) => m.role === 'OWNER' || m.role === 'SPECIALIST');

  const seoUrl = `${window.location.origin}/biz/${business.slug}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicSeo
        title={`${business.name} | МійЗапис`}
        description={
          business.description ||
          [business.name, business.address].filter(Boolean).join(' · ') ||
          `Book with ${business.name} on МійЗапис.`
        }
        image={business.logoUrl || undefined}
        url={seoUrl}
        type="business.business"
        jsonLd={buildBusinessJsonLd({ business })}
      />
      {/* Header */}
      <header className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {business.logoUrl && (
              <img src={business.logoUrl} alt={business.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white p-2 object-contain flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-balance break-words">{business.name}</h1>
              {business.description && <p className="text-primary-100 mt-2 max-w-2xl">{business.description}</p>}
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                {business.address && <Pill icon="📍">{business.address}</Pill>}
                {business.phone && <Pill icon="📞"><a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a></Pill>}
                {business.email && <Pill icon="✉️"><a href={`mailto:${business.email}`} className="hover:underline">{business.email}</a></Pill>}
                {business.websiteUrl && <Pill icon="🌐"><a href={business.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</a></Pill>}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Specialists */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Our specialists</h2>
        {members.length === 0 ? (
          <p className="text-gray-500">No specialists yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m: any) => {
              const u = m.user;
              const spec = u?.specialist;
              const profileLink = spec?.slug ? `/specialist/${spec.slug}` : `/specialists/${u?.id}`;
              return (
                <Link
                  key={m.id}
                  to={profileLink}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition active:scale-[0.96]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {u?.avatar ? (
                      <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-1 ring-inset ring-black/10 dark:ring-white/10 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {(u?.firstName?.[0] ?? '?') + (u?.lastName?.[0] ?? '')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{u?.firstName} {u?.lastName}</div>
                      {spec?.isVerified && <div className="text-xs text-green-600">✓ Verified</div>}
                    </div>
                  </div>
                  {spec?.bio && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{spec.bio}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const Pill: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full max-w-full">
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{children}</span>
  </span>
);

export default BusinessPublicPage;

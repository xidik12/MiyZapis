import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheckIcon, FlagIcon, CheckCircleIcon } from '@/components/icons';
import { apiClient } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================

interface VerificationRequest {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  verificationStatus: string;
  verificationRequestedAt: string;
  verificationNote?: string;
  documentsSubmitted?: boolean;
}

interface ReviewReport {
  id: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  review: {
    id: string;
    comment: string;
    rating: number;
    specialistId: string;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface PostReport {
  id: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    content: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div className="flex items-center justify-center py-10 text-green-600 dark:text-green-400 text-sm font-medium gap-2">
    <CheckCircleIcon className="w-5 h-5" />
    <span>{message}</span>
  </div>
);

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center py-10">
    <svg
      className="animate-spin h-6 w-6 text-primary-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  </div>
);

// ============================================================================
// VERIFICATION REQUESTS
// ============================================================================

const VerificationRequests: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: VerificationRequest[] }>(
        '/admin/moderation/verification-requests'
      );
      if (res.success && res.data) {
        setItems(res.data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch verification requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing((prev) => ({ ...prev, [id]: true }));
    try {
      await apiClient.post(`/admin/moderation/verification/${id}`, {
        action,
        note: notes[id] || undefined
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Verification action failed:', err);
    } finally {
      setActing((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState message={t('admin.moderation.noPending')} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.requestedAt')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.note')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                {item.user.firstName} {item.user.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {item.user.email}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDate(item.verificationRequestedAt)}
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  placeholder={t('admin.moderation.note')}
                  value={notes[item.id] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex gap-2">
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'approve')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.approve')}
                  </button>
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'reject')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.reject')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// REVIEW REPORTS
// ============================================================================

const ReviewReports: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: ReviewReport[] }>(
        '/admin/moderation/review-reports'
      );
      if (res.success && res.data) {
        setItems(res.data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch review reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: 'resolve' | 'dismiss') => {
    setActing((prev) => ({ ...prev, [id]: true }));
    try {
      await apiClient.post(`/admin/moderation/review-reports/${id}`, { action });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Review report action failed:', err);
    } finally {
      setActing((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState message={t('admin.moderation.noPending')} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reporter')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reason')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Review excerpt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rating
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reportedAt')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap font-medium">
                {item.reporter.firstName} {item.reporter.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {item.reason}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                {(item.review?.comment || '').slice(0, 100)}
                {(item.review?.comment || '').length > 100 && '…'}
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                    {item.review?.rating ?? '—'}
                  </span>
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex gap-2">
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'resolve')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.resolve')}
                  </button>
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'dismiss')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.dismiss')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// POST REPORTS
// ============================================================================

const PostReports: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<PostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: PostReport[] }>(
        '/admin/moderation/post-reports'
      );
      if (res.success && res.data) {
        setItems(res.data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch post reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: 'resolve' | 'dismiss') => {
    setActing((prev) => ({ ...prev, [id]: true }));
    try {
      await apiClient.post(`/admin/moderation/post-reports/${id}`, { action });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Post report action failed:', err);
    } finally {
      setActing((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState message={t('admin.moderation.noPending')} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reporter')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reason')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Post title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('admin.moderation.reportedAt')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap font-medium">
                {item.user.firstName} {item.user.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {item.reason}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-[160px] truncate">
                {item.post?.title || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                {item.details || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex gap-2">
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'resolve')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.resolve')}
                  </button>
                  <button
                    disabled={acting[item.id]}
                    onClick={() => handleAction(item.id, 'dismiss')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.96]"
                  >
                    {t('admin.moderation.dismiss')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// MAIN MODERATION SECTION
// ============================================================================

type SubTab = 'verifications' | 'reviewReports' | 'postReports';

export const ModerationSection: React.FC = () => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('verifications');

  const subTabs: Array<{ id: SubTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'verifications',
      label: t('admin.moderation.verifications'),
      icon: <ShieldCheckIcon className="w-4 h-4" />
    },
    {
      id: 'reviewReports',
      label: t('admin.moderation.reviewReports'),
      icon: <FlagIcon className="w-4 h-4" />
    },
    {
      id: 'postReports',
      label: t('admin.moderation.postReports'),
      icon: <FlagIcon className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin.moderation.title')}
          </h2>
        </div>

        {/* Sub-tab nav */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="-mb-px flex gap-6" aria-label="Moderation tabs">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`
                    inline-flex items-center gap-1.5 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition duration-200 active:scale-[0.96]
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-tab content */}
        <div className="p-4">
          {activeSubTab === 'verifications' && <VerificationRequests />}
          {activeSubTab === 'reviewReports' && <ReviewReports />}
          {activeSubTab === 'postReports' && <PostReports />}
        </div>
      </div>
    </div>
  );
};

export default ModerationSection;

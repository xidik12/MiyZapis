// Businesses index + detail + create. One page that swaps between
// list / create / detail+manage views to keep routing minimal.

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  businessService,
  type Business,
  type BusinessMember,
  type BusinessInvite,
  type BusinessRole,
  type BusinessDashboard,
  type Staff,
  type StaffServiceInput,
  type CreateStaffInput,
} from '../../services/business.service';
import { PageLoader } from '@/components/ui';
import { HelpTip } from '@/components/common/HelpTip';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookingShareCard } from '../../components/sharing/BookingShareCard';

const Businesses: React.FC = () => {
  const { businessId } = useParams<{ businessId?: string }>();
  const navigate = useNavigate();
  if (businessId === 'new') return <CreateBusiness onCreated={(b) => navigate(`/specialist/businesses/${b.id}`)} />;
  if (businessId) return <BusinessDetail id={businessId} onBack={() => navigate('/specialist/businesses')} />;
  return <BusinessList />;
};

// ────────────────────────────────────────────────────────────────────────
const BusinessList: React.FC = () => {
  const { t } = useLanguage();
  const [memberships, setMemberships] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    businessService.listMine()
      .then(setMemberships)
      .catch((err) => toast.error(err?.message || t('businesses.error.loadList')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('businesses.title')}</h1>
              <HelpTip title={t('help.businesses.title') || 'Businesses'} content={t('help.businesses.body') || 'Manage your salon/business locations and staff.'} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('businesses.subtitle')}</p>
          </div>
          <button onClick={() => navigate('/specialist/businesses/new')} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">{t('businesses.new')}</button>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('businesses.empty.title')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('businesses.empty.body')}</p>
            <button onClick={() => navigate('/specialist/businesses/new')} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">{t('businesses.empty.cta')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memberships.map((m: any) => (
              <button
                key={m.id}
                onClick={() => navigate(`/specialist/businesses/${m.business.id}`)}
                className="text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{m.business.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{m.business.slug}</p>
                  </div>
                  <RoleBadge role={m.role} />
                </div>
                {m.business.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{m.business.description}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const CreateBusiness: React.FC<{ onCreated: (b: Business) => void }> = ({ onCreated }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '', slug: '', description: '', email: '', phone: '', address: '', websiteUrl: '', currency: 'UAH', timezone: 'UTC',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t('businesses.create.nameRequired')); return; }
    setSaving(true);
    try {
      const b = await businessService.create({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        websiteUrl: form.websiteUrl || undefined,
        currency: form.currency,
        timezone: form.timezone,
      });
      toast.success(t('businesses.create.success'));
      onCreated(b);
    } catch (err: any) {
      toast.error(err?.message || t('businesses.create.errorCreate'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate('/specialist/businesses')} className="text-sm text-gray-500 hover:text-gray-700 mb-3">{t('businesses.create.back')}</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('businesses.create.title')}</h1>

        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <FormField label={t('businesses.create.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <FormField label={t('businesses.create.slug')} value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="my-salon" />
          <FormField label={t('businesses.create.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('businesses.create.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <FormField label={t('businesses.create.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
          </div>
          <FormField label={t('businesses.create.address')} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <FormField label={t('businesses.create.website')} value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} type="url" placeholder="https://" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('businesses.create.currency')} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
            <FormField label={t('businesses.create.timezone')} value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/specialist/businesses')} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">
              {saving ? t('businesses.create.submitting') : t('businesses.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const BusinessDetail: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const { t } = useLanguage();
  const [business, setBusiness] = useState<Business | null>(null);
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'members' | 'staff' | 'settings'>('overview');

  const reload = async () => {
    setLoading(true);
    try {
      const [b, d] = await Promise.all([
        businessService.getById(id),
        businessService.dashboard(id).catch(() => null), // dashboard requires OWNER/MANAGER; OK to fail
      ]);
      setBusiness(b);
      setDashboard(d);
    } catch (err: any) {
      toast.error(err?.message || t('businesses.error.loadDetail'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [id]);

  if (loading) return <PageLoader />;
  if (!business) return <p className="p-8 text-gray-500">{t('businesses.notFound')}</p>;

  // myMember unused but kept for future use
  void (business.members ?? []).find((m: any) => m.user?.id === undefined);
  const canManage = !!dashboard; // proxy: dashboard requires OWNER/MANAGER

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-3">{t('businesses.back')}</button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
            <p className="text-sm text-gray-500">/biz/{business.slug}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'members', 'staff', 'settings'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                tab === tabKey ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(`businesses.tab.${tabKey}`)}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {tab === 'overview' && <OverviewTab dashboard={dashboard} business={business} />}
          {tab === 'members' && <MembersTab business={business} canManage={canManage} onReload={reload} />}
          {tab === 'staff' && <StaffTab business={business} canManage={canManage} />}
          {tab === 'settings' && <SettingsTab business={business} canManage={canManage} onReload={reload} />}
        </div>

        {/* Share & Embed the business's public booking page */}
        {tab === 'overview' && (
          <div className="mt-4">
            <BookingShareCard
              slug={business.slug}
              id={business.id}
              target="business"
              name={business.name}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ dashboard: BusinessDashboard | null; business: Business }> = ({ dashboard, business }) => {
  const { t } = useLanguage();
  if (!dashboard) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">{t('businesses.overview.onlyManagers')}</p>
      </div>
    );
  }
  const c = business.currency;
  // currency may be a user-entered/invalid ISO code — Intl throws RangeError on bad codes.
  const fmtMoney = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n || 0);
    } catch {
      return `${(n || 0).toFixed(2)} ${c || ''}`.trim();
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={t('businesses.overview.members')} value={String(dashboard.members)} />
        <Stat label={t('businesses.overview.activeServices')} value={String(dashboard.services)} />
        <Stat label={t('businesses.overview.bookings30d')} value={String(dashboard.bookings.total)} hint={`${dashboard.bookings.completed} ${t('businesses.overview.completed')}`} />
        <Stat label={t('businesses.overview.revenue30d')} value={fmtMoney(dashboard.bookings.completedRevenue)} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">{t('businesses.overview.recent')}</h3>
        {dashboard.recentBookings.length === 0 ? <p className="text-sm text-gray-500">{t('businesses.overview.recentEmpty')}</p> : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr><th className="py-2">{t('businesses.overview.colWhen')}</th><th>{t('businesses.overview.colService')}</th><th>{t('businesses.overview.colCustomer')}</th><th>{t('businesses.overview.colSpecialist')}</th><th className="text-right">{t('businesses.overview.colAmount')}</th><th>{t('businesses.overview.colStatus')}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {dashboard.recentBookings.map((b) => (
                <tr key={b.id}>
                  <td className="py-2 text-gray-500">{new Date(b.scheduledAt).toLocaleString()}</td>
                  <td>{b.service?.name ?? '—'}</td>
                  <td>{b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : '—'}</td>
                  <td>{b.specialist ? `${b.specialist.firstName} ${b.specialist.lastName}` : '—'}</td>
                  <td className="text-right font-mono">{fmtMoney(b.totalAmount)}</td>
                  <td className="text-xs">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MembersTab: React.FC<{ business: Business; canManage: boolean; onReload: () => void }> = ({ business, canManage, onReload }) => {
  const { t } = useLanguage();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invites, setInvites] = useState<BusinessInvite[]>([]);
  const members = business.members ?? [];

  const loadInvites = () => {
    businessService.listInvites(business.id)
      .then(setInvites)
      .catch(() => setInvites([])); // requires membership; OK to silently skip
  };
  useEffect(() => { loadInvites(); }, [business.id]);

  const revoke = async (inviteId: string) => {
    if (!confirm(t('businesses.invitePending.revokeConfirm'))) return;
    try { await businessService.revokeInvite(business.id, inviteId); toast.success(t('businesses.invitePending.revoked')); loadInvites(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{members.length} {t('businesses.members.memberCount')}</h2>
        {canManage && <button onClick={() => setInviteOpen(true)} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700">{t('businesses.members.invite')}</button>}
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {members.map((m: any) => (
          <li key={m.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                {(m.user?.firstName?.[0] ?? '?') + (m.user?.lastName?.[0] ?? '')}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{m.user?.firstName} {m.user?.lastName}</div>
                <div className="text-xs text-gray-500">{m.user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RoleBadge role={m.role} />
              {canManage && (
                <MemberActions businessId={business.id} member={m} onReload={onReload} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-1">{t('businesses.invitePending.title')}</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">✉</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{inv.email}</div>
                    <div className="text-xs text-gray-500">{t('businesses.invitePending.invited')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={inv.role} />
                  {canManage && (
                    <button onClick={() => revoke(inv.id)} className="text-sm text-red-600 hover:text-red-800">{t('businesses.invitePending.revoke')}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inviteOpen && <InviteModal businessId={business.id} onClose={() => setInviteOpen(false)} onInvited={() => { setInviteOpen(false); onReload(); loadInvites(); }} />}
    </div>
  );
};

const MemberActions: React.FC<{ businessId: string; member: any; onReload: () => void }> = ({ businessId, member, onReload }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const change = async (role: BusinessRole) => {
    try { await businessService.setRole(businessId, member.user.id, role); toast.success(t('businesses.members.roleUpdated')); onReload(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    setOpen(false);
  };
  const remove = async () => {
    if (!confirm(t('businesses.members.removeConfirm'))) return;
    try { await businessService.removeMember(businessId, member.user.id); toast.success(t('businesses.members.removedSuccess')); onReload(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    setOpen(false);
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 px-2">⋯</button>
      {open && (
        <div className="absolute right-0 top-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px] max-w-[calc(100vw-1rem)]">
          <button onClick={() => change('OWNER')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">{t('businesses.members.makeOwner')}</button>
          <button onClick={() => change('MANAGER')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">{t('businesses.members.makeManager')}</button>
          <button onClick={() => change('SPECIALIST')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">{t('businesses.members.makeSpecialist')}</button>
          <button onClick={remove} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">{t('businesses.members.remove')}</button>
        </div>
      )}
    </div>
  );
};

const InviteModal: React.FC<{ businessId: string; onClose: () => void; onInvited: () => void }> = ({ businessId, onClose, onInvited }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BusinessRole>('SPECIALIST');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const res = await businessService.invite(businessId, email, role);
      // Unknown email → email invite sent; existing user → joined immediately.
      toast.success(res?.pending ? t('businesses.invite.sent') : t('businesses.invite.success'));
      onInvited();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('ALREADY_MEMBER')) toast.error(t('businesses.invite.error.alreadyMember'));
      else toast.error(msg || t('businesses.invite.error.generic'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('businesses.invite.modal.title')}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{t('businesses.invite.modal.intro')}</p>
        <FormField label={t('businesses.invite.modal.email')} value={email} onChange={setEmail} type="email" />
        <label className="block mt-3">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('businesses.members.role')}</span>
          <select value={role} onChange={(e) => setRole(e.target.value as BusinessRole)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm">
            <option value="SPECIALIST">{t('businesses.invite.modal.specialist')}</option>
            <option value="MANAGER">{t('businesses.invite.modal.manager')}</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
          <button onClick={submit} disabled={saving || !email} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">{saving ? t('businesses.invite.modal.submitting') : t('businesses.invite.modal.submit')}</button>
        </div>
      </div>
    </div>
  );
};

const SettingsTab: React.FC<{ business: Business; canManage: boolean; onReload: () => void }> = ({ business, canManage, onReload }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? '',
    email: business.email ?? '',
    phone: business.phone ?? '',
    address: business.address ?? '',
    websiteUrl: business.websiteUrl ?? '',
    currency: business.currency,
    timezone: business.timezone,
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await businessService.update(business.id, form); toast.success(t('businesses.settings.savedSuccess')); onReload(); }
    catch (err: any) { toast.error(err?.message || t('businesses.settings.saveError')); }
    finally { setSaving(false); }
  };
  const deactivate = async () => {
    if (!confirm(t('businesses.settings.deactivateConfirm'))) return;
    try { await businessService.deactivate(business.id); toast.success(t('businesses.settings.deactivatedSuccess')); onReload(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
  };

  if (!canManage) return <p className="text-sm text-gray-500">{t('businesses.settings.onlyManagers')}</p>;
  return (
    <div className="space-y-4">
      <FormField label={t('businesses.create.name').replace(' *', '')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <FormField label={t('businesses.create.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label={t('businesses.create.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <FormField label={t('businesses.create.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
      </div>
      <FormField label={t('businesses.create.address')} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <FormField label={t('businesses.create.website')} value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} type="url" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label={t('businesses.create.currency')} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
        <FormField label={t('businesses.create.timezone')} value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} />
      </div>

      <div className="flex justify-between pt-3">
        <button onClick={deactivate} className="text-sm text-red-600 hover:text-red-800">{t('businesses.settings.deactivate')}</button>
        <button onClick={save} disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">{saving ? t('businesses.settings.saving') : t('businesses.settings.save')}</button>
      </div>
    </div>
  );
};

// ── Staff / Employees ─────────────────────────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type DayKey = (typeof DAYS)[number];
type WorkingHours = Record<string, { isWorking: boolean; start: string; end: string }>;

const emptyHours = (): WorkingHours =>
  DAYS.reduce((acc, d) => { acc[d] = { isWorking: false, start: '09:00', end: '17:00' }; return acc; }, {} as WorkingHours);

const StaffTab: React.FC<{ business: Business; canManage: boolean }> = ({ business, canManage }) => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [scheduling, setScheduling] = useState<Staff | null>(null);
  const [servicing, setServicing] = useState<Staff | null>(null);

  const reload = () => {
    setLoading(true);
    businessService.listStaff(business.id)
      .then(setStaff)
      .catch((err) => toast.error(err?.message || t('businesses.error.generic')))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, [business.id]);

  const clone = async (s: Staff) => {
    const name = prompt(t('businesses.staff.cloneNamePrompt'), `${s.user.firstName} ${s.user.lastName}`);
    if (!name?.trim()) return;
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '-';
    try {
      await businessService.cloneStaff(business.id, s.user.id, firstName, lastName);
      toast.success(t('businesses.staff.cloned'));
      reload();
    } catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
  };

  const remove = async (s: Staff) => {
    if (!confirm(t('businesses.staff.removeConfirm'))) return;
    try {
      await businessService.deleteStaff(business.id, s.user.id);
      toast.success(t('businesses.staff.removed'));
      reload();
    } catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
  };

  if (!canManage) return <p className="text-sm text-gray-500">{t('businesses.staff.onlyManagers')}</p>;
  if (loading) return <div className="py-10 text-center text-sm text-gray-500">{t('businesses.staff.loading')}</div>;

  const scheduledDays = (s: Staff) => Object.values(s.specialist?.workingHours ?? {}).filter((d) => d?.isWorking).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('businesses.staff.title')}</h2>
        <button onClick={() => setAddOpen(true)} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700">{t('businesses.staff.addEmployee')}</button>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-gray-500">{t('businesses.staff.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staff.map((s) => (
            <div key={s.memberId} className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                    {(s.user.firstName?.[0] ?? '?') + (s.user.lastName?.[0] ?? '')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{s.user.firstName} {s.user.lastName}</div>
                    <ManagedBadge managed={s.user.isManaged} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{s.services.length} {t('businesses.staff.servicesCount')}</span>
                <span>{scheduledDays(s)}/7 {t('businesses.staff.daysScheduled')}</span>
                {s.specialist?.city ? <span>{s.specialist.city}</span> : null}
              </div>
              {s.user.isManaged && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionBtn onClick={() => setEditing(s)}>{t('businesses.staff.edit')}</ActionBtn>
                  <ActionBtn onClick={() => setScheduling(s)}>{t('businesses.staff.schedule')}</ActionBtn>
                  <ActionBtn onClick={() => setServicing(s)}>{t('businesses.staff.servicesPrices')}</ActionBtn>
                  <ActionBtn onClick={() => clone(s)}>{t('businesses.staff.clone')}</ActionBtn>
                  <button onClick={() => remove(s)} className="text-xs px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">{t('businesses.staff.remove')}</button>
                </div>
              )}
              {!s.user.isManaged && (
                <div className="mt-3">
                  <button onClick={() => remove(s)} className="text-xs px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">{t('businesses.staff.removeMembership')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addOpen && <StaffFormModal businessId={business.id} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); reload(); }} />}
      {editing && <EditStaffModal businessId={business.id} staff={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {scheduling && <ScheduleModal businessId={business.id} staff={scheduling} onClose={() => setScheduling(null)} onSaved={() => { setScheduling(null); reload(); }} />}
      {servicing && <ServicesModal businessId={business.id} staff={servicing} onClose={() => setServicing(null)} onSaved={() => { setServicing(null); reload(); }} />}
    </div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary-500">{children}</button>
);

const ManagedBadge: React.FC<{ managed: boolean }> = ({ managed }) => {
  const { t } = useLanguage();
  const cls = managed ? 'bg-amber-100 text-amber-700' : 'bg-success-100 text-success-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{managed ? t('businesses.staff.managed') : t('businesses.staff.invited')}</span>;
};

// Modal shell -------------------------------------------------------------
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className={`bg-white dark:bg-gray-800 rounded-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
      </div>
      {children}
    </div>
  </div>
);

// Weekly schedule editor --------------------------------------------------
const ScheduleEditor: React.FC<{ hours: WorkingHours; onChange: (h: WorkingHours) => void }> = ({ hours, onChange }) => {
  const { t } = useLanguage();
  const setDay = (day: DayKey, patch: Partial<WorkingHours[string]>) =>
    onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const d = hours[day] ?? { isWorking: false, start: '09:00', end: '17:00' };
        return (
          <div key={day} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={d.isWorking} onChange={(e) => setDay(day, { isWorking: e.target.checked })} className="rounded" />
              <span className="capitalize">{t(`businesses.staff.day.${day}`)}</span>
            </label>
            <input type="time" value={d.start} disabled={!d.isWorking} onChange={(e) => setDay(day, { start: e.target.value })} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm disabled:opacity-40" />
            <input type="time" value={d.end} disabled={!d.isWorking} onChange={(e) => setDay(day, { end: e.target.value })} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm disabled:opacity-40" />
          </div>
        );
      })}
    </div>
  );
};

// Repeatable services editor ----------------------------------------------
const ServicesEditor: React.FC<{ rows: StaffServiceInput[]; onChange: (r: StaffServiceInput[]) => void; currency: string }> = ({ rows, onChange, currency }) => {
  const { t } = useLanguage();
  const set = (i: number, patch: Partial<StaffServiceInput>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { name: '', basePrice: 0, currency, duration: 30 }]);
  const del = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
          <input value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder={t('businesses.staff.serviceName')} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-sm" />
          <input type="number" min={0} value={r.basePrice} onChange={(e) => set(i, { basePrice: Number(e.target.value) })} placeholder={t('businesses.staff.price')} className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-sm" />
          <input type="number" min={0} value={r.duration} onChange={(e) => set(i, { duration: Number(e.target.value) })} placeholder={t('businesses.staff.duration')} className="w-20 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-sm" />
          <button onClick={() => del(i)} className="text-red-600 hover:text-red-800 px-2 text-lg leading-none">×</button>
        </div>
      ))}
      <button onClick={add} className="text-sm text-primary-600 hover:text-primary-700">+ {t('businesses.staff.addService')}</button>
    </div>
  );
};

const StaffFormModal: React.FC<{ businessId: string; onClose: () => void; onSaved: () => void }> = ({ businessId, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '', city: '' });
  const [hours, setHours] = useState<WorkingHours>(emptyHours());
  const [services, setServices] = useState<StaffServiceInput[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error(t('businesses.staff.nameRequired')); return; }
    setSaving(true);
    try {
      const payload: CreateStaffInput = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || undefined,
        city: form.city || undefined,
        workingHours: hours,
        services: services.filter((s) => s.name.trim()),
      };
      await businessService.createStaff(businessId, payload);
      toast.success(t('businesses.staff.created'));
      onSaved();
    } catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={t('businesses.staff.addEmployee')} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('businesses.staff.firstName')} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <FormField label={t('businesses.staff.lastName')} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('businesses.staff.city')} value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        </div>
        <FormField label={t('businesses.staff.bio')} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} multiline />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('businesses.staff.services')}</h4>
          <ServicesEditor rows={services} onChange={setServices} currency="UAH" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('businesses.staff.schedule')}</h4>
          <ScheduleEditor hours={hours} onChange={setHours} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">{saving ? t('businesses.staff.saving') : t('businesses.staff.save')}</button>
        </div>
      </div>
    </Modal>
  );
};

const EditStaffModal: React.FC<{ businessId: string; staff: Staff; onClose: () => void; onSaved: () => void }> = ({ businessId, staff, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    firstName: staff.user.firstName,
    lastName: staff.user.lastName,
    bio: staff.specialist?.bio ?? '',
    city: staff.specialist?.city ?? '',
    experience: String(staff.specialist?.experience ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error(t('businesses.staff.nameRequired')); return; }
    setSaving(true);
    try {
      await businessService.updateStaff(businessId, staff.user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        city: form.city,
        experience: Number(form.experience) || 0,
      });
      toast.success(t('businesses.staff.updated'));
      onSaved();
    } catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={t('businesses.staff.edit')} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('businesses.staff.firstName')} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <FormField label={t('businesses.staff.lastName')} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('businesses.staff.city')} value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <FormField label={t('businesses.staff.experience')} value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} type="number" />
        </div>
        <FormField label={t('businesses.staff.bio')} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} multiline />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">{saving ? t('businesses.staff.saving') : t('businesses.staff.save')}</button>
        </div>
      </div>
    </Modal>
  );
};

const ScheduleModal: React.FC<{ businessId: string; staff: Staff; onClose: () => void; onSaved: () => void }> = ({ businessId, staff, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [hours, setHours] = useState<WorkingHours>(() => ({ ...emptyHours(), ...(staff.specialist?.workingHours ?? {}) }));
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try { await businessService.setSchedule(businessId, staff.user.id, hours); toast.success(t('businesses.staff.scheduleSaved')); onSaved(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`${t('businesses.staff.schedule')} — ${staff.user.firstName} ${staff.user.lastName}`} onClose={onClose}>
      <ScheduleEditor hours={hours} onChange={setHours} />
      <div className="flex justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">{saving ? t('businesses.staff.saving') : t('businesses.staff.save')}</button>
      </div>
    </Modal>
  );
};

const ServicesModal: React.FC<{ businessId: string; staff: Staff; onClose: () => void; onSaved: () => void }> = ({ businessId, staff, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<StaffServiceInput[]>(
    staff.services.map((s) => ({ name: s.name, basePrice: s.basePrice, currency: s.currency, duration: s.duration })),
  );
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try { await businessService.setServices(businessId, staff.user.id, rows.filter((r) => r.name.trim())); toast.success(t('businesses.staff.servicesSaved')); onSaved(); }
    catch (err: any) { toast.error(err?.message || t('businesses.error.generic')); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`${t('businesses.staff.servicesPrices')} — ${staff.user.firstName} ${staff.user.lastName}`} onClose={onClose} wide>
      <ServicesEditor rows={rows} onChange={setRows} currency={staff.services[0]?.currency ?? 'UAH'} />
      <div className="flex justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t('actions.cancel')}</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50">{saving ? t('businesses.staff.saving') : t('businesses.staff.save')}</button>
      </div>
    </Modal>
  );
};

// ────────────────────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
    <div className="text-xs uppercase text-gray-500 tracking-wider">{label}</div>
    <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    {hint && <div className="text-xs text-gray-500">{hint}</div>}
  </div>
);

const RoleBadge: React.FC<{ role: BusinessRole }> = ({ role }) => {
  const color = role === 'OWNER' ? 'bg-primary-100 text-primary-700' : role === 'MANAGER' ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{role}</span>;
};

const FormField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean; placeholder?: string }> = ({ label, value, onChange, type = 'text', multiline, placeholder }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</span>
    {multiline
      ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm" />
      : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm" />
    }
  </label>
);

export default Businesses;

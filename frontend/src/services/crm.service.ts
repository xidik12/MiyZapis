import { apiClient } from './api';

// ---------------------------------------------------------------------------
// CRM client — tags, saved segments, segment campaigns, tasks, consent, leads,
// and the UNIFIED client record (aggregated across bookings + gift cards +
// memberships + store orders). Backend mounted at /api/v1/crm.
// ---------------------------------------------------------------------------

export const TAG_COLORS = ['primary', 'success', 'warning', 'danger', 'gray', 'info'] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const CAMPAIGN_CHANNELS = ['email', 'telegram', 'both'] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = ['walk-in', 'referral', 'instagram', 'web', 'phone', 'other'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface CustomerTag {
  id: string;
  name: string;
  color: TagColor;
  count?: number; // assignment count
  createdAt: string;
}

// Unified client: aggregates ALL revenue streams, not just bookings.
export interface CrmClient {
  customerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  bookingsCount: number;
  totalSpent: number; // sum across bookings + gift cards + memberships + store orders
  currency: string;
  lastVisitDate: string | null;
  isActive: boolean; // visited within the active window
  tags: CustomerTag[];
  consent?: MarketingConsent | null;
  // optional breakdown of where spend came from
  spendBreakdown?: { bookings: number; giftCards: number; memberships: number; store: number };
}

export interface SegmentFilter {
  minSpent?: number;
  maxSpent?: number;
  lapsedDays?: number;        // last visit older than N days
  activeWithinDays?: number;  // last visit within N days
  minBookings?: number;
  tagIds?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  search?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string | null;
  filter: SegmentFilter;
  count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentCampaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  subject?: string | null;
  body: string;
  filter?: SegmentFilter | null;
  segmentId?: string | null;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipientCount: number;
  sentCount: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface ClientTask {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  status: 'open' | 'done';
  createdAt: string;
  completedAt?: string | null;
}

export interface MarketingConsent {
  email: boolean;
  sms: boolean;
  push: boolean;
  optOutAll: boolean;
  source?: string | null;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: LeadSource | null;
  stage: LeadStage;
  value?: number | null;
  notes?: string | null;
  customerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// apiClient returns ApiResponse<T> where `data` is optional; normalise to T.
const unwrap = <T>(p: Promise<unknown>): Promise<T> =>
  p.then((r) => (r as { data?: T }).data as T);

export const crmService = {
  // ---- Unified clients ----
  getClients: (params?: { tagId?: string; search?: string }) =>
    unwrap<CrmClient[]>(apiClient.get('/crm/clients', { params })),
  getClient: (customerId: string) =>
    unwrap<CrmClient>(apiClient.get(`/crm/clients/${customerId}`)),

  // ---- Tags ----
  listTags: () => unwrap<CustomerTag[]>(apiClient.get('/crm/tags')),
  createTag: (body: { name: string; color: TagColor }) =>
    unwrap<CustomerTag>(apiClient.post('/crm/tags', body)),
  updateTag: (id: string, body: { name?: string; color?: TagColor }) =>
    unwrap<CustomerTag>(apiClient.put(`/crm/tags/${id}`, body)),
  deleteTag: (id: string) => unwrap<{ success: boolean }>(apiClient.delete(`/crm/tags/${id}`)),
  assignTag: (customerId: string, tagId: string) =>
    unwrap<{ success: boolean }>(apiClient.post(`/crm/clients/${customerId}/tags`, { tagId })),
  unassignTag: (customerId: string, tagId: string) =>
    unwrap<{ success: boolean }>(apiClient.delete(`/crm/clients/${customerId}/tags/${tagId}`)),

  // ---- Segments ----
  listSegments: () => unwrap<CustomerSegment[]>(apiClient.get('/crm/segments')),
  createSegment: (body: { name: string; description?: string; filter: SegmentFilter }) =>
    unwrap<CustomerSegment>(apiClient.post('/crm/segments', body)),
  updateSegment: (id: string, body: { name?: string; description?: string; filter?: SegmentFilter }) =>
    unwrap<CustomerSegment>(apiClient.put(`/crm/segments/${id}`, body)),
  deleteSegment: (id: string) => unwrap<{ success: boolean }>(apiClient.delete(`/crm/segments/${id}`)),
  // preview a filter without saving → matched count + sample clients
  previewSegment: (filter: SegmentFilter) =>
    unwrap<{ count: number; sample: CrmClient[] }>(apiClient.post('/crm/segments/preview', { filter })),

  // ---- Campaigns ----
  listCampaigns: () => unwrap<SegmentCampaign[]>(apiClient.get('/crm/campaigns')),
  createCampaign: (body: {
    name: string;
    channel?: CampaignChannel;
    subject?: string;
    body: string;
    filter?: SegmentFilter;
    segmentId?: string;
  }) => unwrap<SegmentCampaign>(apiClient.post('/crm/campaigns', body)),
  // resolves audience, skips opted-out clients, sends via the email engine
  sendCampaign: (id: string) =>
    unwrap<SegmentCampaign>(apiClient.post(`/crm/campaigns/${id}/send`)),
  deleteCampaign: (id: string) =>
    unwrap<{ success: boolean }>(apiClient.delete(`/crm/campaigns/${id}`)),

  // ---- Tasks ----
  listTasks: (params?: { status?: 'open' | 'done'; customerId?: string }) =>
    unwrap<ClientTask[]>(apiClient.get('/crm/tasks', { params })),
  createTask: (body: { title: string; notes?: string; dueDate?: string; customerId?: string }) =>
    unwrap<ClientTask>(apiClient.post('/crm/tasks', body)),
  updateTask: (id: string, body: Partial<{ title: string; notes: string; dueDate: string; status: 'open' | 'done' }>) =>
    unwrap<ClientTask>(apiClient.put(`/crm/tasks/${id}`, body)),
  toggleTask: (id: string) => unwrap<ClientTask>(apiClient.post(`/crm/tasks/${id}/toggle`)),
  deleteTask: (id: string) => unwrap<{ success: boolean }>(apiClient.delete(`/crm/tasks/${id}`)),

  // ---- Consent ----
  getConsent: (customerId: string) =>
    unwrap<MarketingConsent>(apiClient.get(`/crm/clients/${customerId}/consent`)),
  setConsent: (customerId: string, body: Partial<MarketingConsent>) =>
    unwrap<MarketingConsent>(apiClient.put(`/crm/clients/${customerId}/consent`, body)),

  // ---- Leads ----
  listLeads: (params?: { stage?: LeadStage }) =>
    unwrap<Lead[]>(apiClient.get('/crm/leads', { params })),
  createLead: (body: Partial<Lead> & { name: string }) =>
    unwrap<Lead>(apiClient.post('/crm/leads', body)),
  updateLead: (id: string, body: Partial<Lead>) =>
    unwrap<Lead>(apiClient.put(`/crm/leads/${id}`, body)),
  setLeadStage: (id: string, stage: LeadStage) =>
    unwrap<Lead>(apiClient.put(`/crm/leads/${id}/stage`, { stage })),
  convertLead: (id: string) => unwrap<Lead>(apiClient.post(`/crm/leads/${id}/convert`)),
  deleteLead: (id: string) => unwrap<{ success: boolean }>(apiClient.delete(`/crm/leads/${id}`)),
};

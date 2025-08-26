import { apiClient } from './api';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  sortOrder: number;
}

export interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'chat';
  title: string;
  description: string;
  value: string;
  availability: string;
}

export interface FeedbackData {
  email: string;
  subject: string;
  message: string;
  category: string;
}

export interface SupportStats {
  averageResponseTime: string;
  resolutionRate: string;
  customerSatisfaction: string;
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
}

export class HelpService {
  // Get FAQs
  async getFAQs(category?: string, language?: string): Promise<{ faqs: FAQ[]; total: number }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (language) params.append('language', language);

    const response = await apiClient.get<{ faqs: FAQ[]; total: number }>(
      `/help/faqs?${params.toString()}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get FAQs');
    }
    
    return response.data;
  }

  // Get contact methods
  async getContactMethods(language?: string): Promise<{ contactMethods: ContactMethod[]; total: number }> {
    const params = new URLSearchParams();
    if (language) params.append('language', language);

    const response = await apiClient.get<{ contactMethods: ContactMethod[]; total: number }>(
      `/help/contact-methods?${params.toString()}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get contact methods');
    }
    
    return response.data;
  }

  // Submit feedback
  async submitFeedback(data: FeedbackData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/help/feedback', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit feedback');
    }
    
    return response.data;
  }

  // Get FAQ categories
  async getFAQCategories(): Promise<{ categories: { category: string; count: number }[]; total: number }> {
    const response = await apiClient.get<{ categories: { category: string; count: number }[]; total: number }>(
      '/help/faq-categories'
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get FAQ categories');
    }
    
    return response.data;
  }

  // Search FAQs
  async searchFAQs(query: string, language?: string): Promise<{ faqs: FAQ[]; total: number; query: string }> {
    const params = new URLSearchParams({ q: query });
    if (language) params.append('language', language);

    const response = await apiClient.get<{ faqs: FAQ[]; total: number; query: string }>(
      `/help/search?${params.toString()}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search FAQs');
    }
    
    return response.data;
  }

  // Get support statistics
  async getSupportStats(): Promise<SupportStats> {
    const response = await apiClient.get<SupportStats>('/help/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get support statistics');
    }
    
    return response.data;
  }
}

export const helpService = new HelpService();
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface CreateFeedbackData {
  email: string;
  subject: string;
  message: string;
  category: string;
  userId?: string;
}

export interface FAQ {
  id: string;
  question: string;
  questionUk: string;
  questionRu: string;
  answer: string;
  answerUk: string;
  answerRu: string;
  category: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'chat';
  title: string;
  titleUk: string;
  titleRu: string;
  description: string;
  descriptionUk: string;
  descriptionRu: string;
  value: string;
  availability: string;
  availabilityUk: string;
  availabilityRu: string;
  isActive: boolean;
  sortOrder: number;
}

export class HelpService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get FAQs with optional category filter
  async getFAQs(category?: string, language: string = 'en'): Promise<FAQ[]> {
    try {
      const faqs = await this.prisma.fAQ.findMany({
        where: {
          isActive: true,
          ...(category && category !== 'all' && { category })
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return faqs.map(faq => ({
        ...faq,
        tags: faq.tags ? JSON.parse(faq.tags) : [],
        question: language === 'uk' ? faq.questionUk || faq.question : 
                 language === 'ru' ? faq.questionRu || faq.question : 
                 faq.question,
        answer: language === 'uk' ? faq.answerUk || faq.answer : 
               language === 'ru' ? faq.answerRu || faq.answer : 
               faq.answer
      }));
    } catch (error) {
      logger.error('Error getting FAQs:', error);
      throw error;
    }
  }

  // Get contact methods
  async getContactMethods(language: string = 'en'): Promise<ContactMethod[]> {
    // Since we don't have a ContactMethod model, return static data
    const contactMethods: ContactMethod[] = [
      {
        id: '1',
        type: 'email',
        title: 'Email Support',
        titleUk: 'Підтримка електронною поштою',
        titleRu: 'Поддержка по электронной почте',
        description: 'Get help via email',
        descriptionUk: 'Отримайте допомогу електронною поштою',
        descriptionRu: 'Получите помощь по электронной почте',
        value: 'support@miyzapis.com',
        availability: '24/7',
        availabilityUk: '24/7',
        availabilityRu: '24/7',
        isActive: true,
        sortOrder: 1
      },
      {
        id: '2',
        type: 'phone',
        title: 'Phone Support',
        titleUk: 'Телефонна підтримка',
        titleRu: 'Телефонная поддержка',
        description: 'Call us for immediate assistance',
        descriptionUk: 'Зателефонуйте нам для негайної допомоги',
        descriptionRu: 'Позвоните нам для немедленной помощи',
        value: '+380 44 123 4567',
        availability: 'Mon-Fri 9:00-18:00',
        availabilityUk: 'Пн-Пт 9:00-18:00',
        availabilityRu: 'Пн-Пт 9:00-18:00',
        isActive: true,
        sortOrder: 2
      },
      {
        id: '3',
        type: 'chat',
        title: 'Live Chat',
        titleUk: 'Онлайн чат',
        titleRu: 'Онлайн чат',
        description: 'Chat with our support team',
        descriptionUk: 'Спілкуйтеся з нашою командою підтримки',
        descriptionRu: 'Общайтесь с нашей командой поддержки',
        value: 'https://miyzapis.com/chat',
        availability: 'Mon-Fri 9:00-18:00',
        availabilityUk: 'Пн-Пт 9:00-18:00',
        availabilityRu: 'Пн-Пт 9:00-18:00',
        isActive: true,
        sortOrder: 3
      }
    ];

    return contactMethods.map(method => ({
      ...method,
      title: language === 'uk' ? method.titleUk : 
             language === 'ru' ? method.titleRu : 
             method.title,
      description: language === 'uk' ? method.descriptionUk : 
                  language === 'ru' ? method.descriptionRu : 
                  method.description,
      availability: language === 'uk' ? method.availabilityUk : 
                   language === 'ru' ? method.availabilityRu : 
                   method.availability
    }));
  }

  // Submit feedback/support request
  async submitFeedback(data: CreateFeedbackData): Promise<{ message: string }> {
    try {
      // Since we don't have a support ticket model, we'll just log the feedback
      // In a real implementation, this would save to a SupportTicket table
      logger.info('Feedback submitted', {
        email: data.email,
        subject: data.subject,
        category: data.category,
        userId: data.userId,
        messageLength: data.message.length,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you might also:
      // 1. Send email notification to support team
      // 2. Create a ticket in your support system
      // 3. Send auto-reply email to the user

      return {
        message: 'Your feedback has been submitted successfully. We will get back to you soon.'
      };
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Get FAQ categories
  async getFAQCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const categories = await this.prisma.fAQ.groupBy({
        by: ['category'],
        where: {
          isActive: true
        },
        _count: {
          category: true
        },
        orderBy: {
          category: 'asc'
        }
      });

      return categories.map(cat => ({
        category: cat.category,
        count: cat._count.category
      }));
    } catch (error) {
      logger.error('Error getting FAQ categories:', error);
      throw error;
    }
  }

  // Search FAQs
  async searchFAQs(query: string, language: string = 'en'): Promise<FAQ[]> {
    try {
      const faqs = await this.prisma.fAQ.findMany({
        where: {
          isActive: true,
          OR: [
            { question: { contains: query, mode: 'insensitive' } },
            { questionUk: { contains: query, mode: 'insensitive' } },
            { questionRu: { contains: query, mode: 'insensitive' } },
            { answer: { contains: query, mode: 'insensitive' } },
            { answerUk: { contains: query, mode: 'insensitive' } },
            { answerRu: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return faqs.map(faq => ({
        ...faq,
        tags: faq.tags ? JSON.parse(faq.tags) : [],
        question: language === 'uk' ? faq.questionUk || faq.question : 
                 language === 'ru' ? faq.questionRu || faq.question : 
                 faq.question,
        answer: language === 'uk' ? faq.answerUk || faq.answer : 
               language === 'ru' ? faq.answerRu || faq.answer : 
               faq.answer
      }));
    } catch (error) {
      logger.error('Error searching FAQs:', error);
      throw error;
    }
  }
}
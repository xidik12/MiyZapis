import axios from 'axios';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface LiqPayPaymentData {
  amount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface MonobankPaymentData {
  amount: number; // in kopiykas for UAH
  merchantPaymInfo: {
    reference: string;
    destination: string;
    basketOrder?: Array<{
      name: string;
      qty: number;
      sum: number;
      icon?: string;
      unit?: string;
    }>;
  };
  redirectUrl?: string;
  webHookUrl?: string;
  validity?: number; // seconds
  paymentType?: 'debit' | 'hold';
}

interface PrivatBankPaymentData {
  amt: number;
  ccy: 'UAH' | 'USD' | 'EUR';
  merchant: string;
  order: string;
  details: string;
  return_url?: string;
  server_url?: string;
}

export class UkrainianPaymentService {
  // LiqPay (popular Ukrainian payment system)
  static async createLiqPayPayment(data: LiqPayPaymentData): Promise<{
    payment_url: string;
    payment_id: string;
    data_base64: string;
    signature: string;
  }> {
    try {
      if (!config.liqpay?.publicKey || !config.liqpay?.privateKey) {
        logger.warn('LiqPay not configured, creating mock payment');
        return this.createMockLiqPayPayment(data);
      }

      const liqpayData = {
        version: '3',
        public_key: config.liqpay.publicKey,
        action: 'pay',
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        order_id: data.order_id,
        result_url: data.result_url || `${config.frontend.url}/booking/payment-result`,
        server_url: data.server_url || `${config.api.url}/api/v1/payments/webhook/liqpay`,
        language: 'uk',
        customer: data.customer_email,
        customer_name: data.customer_name,
        phone: data.customer_phone,
      };

      const dataBase64 = Buffer.from(JSON.stringify(liqpayData)).toString('base64');
      const signature = this.generateLiqPaySignature(dataBase64);

      logger.info('LiqPay payment created', { order_id: data.order_id });

      return {
        payment_url: 'https://www.liqpay.ua/api/3/checkout',
        payment_id: data.order_id,
        data_base64: dataBase64,
        signature,
      };
    } catch (error) {
      logger.error('Error creating LiqPay payment:', error);
      throw error;
    }
  }

  // Monobank Acquiring (Ukrainian bank)
  static async createMonobankPayment(data: MonobankPaymentData): Promise<{
    invoiceId: string;
    pageUrl: string;
  }> {
    try {
      if (!config.monobank?.token) {
        logger.warn('Monobank not configured, creating mock payment');
        return {
          invoiceId: `mono_mock_${Date.now()}`,
          pageUrl: `${config.frontend.url}/booking/payment-result?mock=monobank`,
        };
      }

      const response = await axios.post(
        'https://api.monobank.ua/api/merchant/invoice/create',
        data,
        {
          headers: {
            'X-Token': config.monobank.token,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Monobank payment created', { 
        invoiceId: response.data.invoiceId,
        reference: data.merchantPaymInfo.reference 
      });

      return {
        invoiceId: response.data.invoiceId,
        pageUrl: response.data.pageUrl,
      };
    } catch (error) {
      logger.error('Error creating Monobank payment:', error);
      throw error;
    }
  }

  // PrivatBank (major Ukrainian bank)
  static async createPrivatBankPayment(data: PrivatBankPaymentData): Promise<{
    payment_id: string;
    payment_url: string;
  }> {
    try {
      if (!config.privatbank?.merchantId || !config.privatbank?.merchantPassword) {
        logger.warn('PrivatBank not configured, creating mock payment');
        return {
          payment_id: `pb_mock_${Date.now()}`,
          payment_url: `${config.frontend.url}/booking/payment-result?mock=privatbank`,
        };
      }

      // PrivatBank requires specific XML format
      const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
        <request version="1.0">
          <merchant>
            <id>${config.privatbank.merchantId}</id>
            <signature>${this.generatePrivatBankSignature(data)}</signature>
          </merchant>
          <data>
            <oper>cmt</oper>
            <wait>0</wait>
            <test>0</test>
            <payment id="">
              <prop name="amt" value="${data.amt}"/>
              <prop name="ccy" value="${data.ccy}"/>
              <prop name="merchant" value="${data.merchant}"/>
              <prop name="order" value="${data.order}"/>
              <prop name="details" value="${data.details}"/>
              <prop name="return_url" value="${data.return_url}"/>
              <prop name="server_url" value="${data.server_url}"/>
            </payment>
          </data>
        </request>`;

      const response = await axios.post(
        'https://api.privatbank.ua/p24api/ishop',
        xmlData,
        {
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

      // Parse XML response (simplified - in production use proper XML parser)
      const paymentId = this.extractXmlValue(response.data, 'id');
      const paymentUrl = this.extractXmlValue(response.data, 'url');

      logger.info('PrivatBank payment created', { 
        payment_id: paymentId,
        order: data.order 
      });

      return {
        payment_id: paymentId,
        payment_url: paymentUrl,
      };
    } catch (error) {
      logger.error('Error creating PrivatBank payment:', error);
      throw error;
    }
  }

  // WayForPay (Ukrainian payment gateway)
  static async createWayForPayPayment(data: {
    merchantAccount: string;
    merchantDomainName: string;
    orderReference: string;
    orderDate: number;
    amount: number;
    currency: 'UAH';
    productName: string[];
    productCount: number[];
    productPrice: number[];
    clientFirstName?: string;
    clientLastName?: string;
    clientEmail?: string;
    clientPhone?: string;
  }): Promise<{
    invoiceUrl: string;
    orderId: string;
  }> {
    try {
      if (!config.wayforpay?.merchantAccount || !config.wayforpay?.secretKey) {
        logger.warn('WayForPay not configured, creating mock payment');
        return {
          invoiceUrl: `${config.frontend.url}/booking/payment-result?mock=wayforpay`,
          orderId: `wfp_mock_${Date.now()}`,
        };
      }

      const requestData = {
        ...data,
        merchantAccount: config.wayforpay.merchantAccount,
        merchantSignature: this.generateWayForPaySignature(data),
        returnUrl: `${config.frontend.url}/booking/payment-result`,
        serviceUrl: `${config.api.url}/api/v1/payments/webhook/wayforpay`,
      };

      const response = await axios.post(
        'https://api.wayforpay.com/api',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('WayForPay payment created', { 
        orderReference: data.orderReference 
      });

      return {
        invoiceUrl: response.data.invoiceUrl,
        orderId: response.data.orderReference,
      };
    } catch (error) {
      logger.error('Error creating WayForPay payment:', error);
      throw error;
    }
  }

  // Helper methods for signature generation
  private static generateLiqPaySignature(dataBase64: string): string {
    const signatureString = config.liqpay?.privateKey + dataBase64 + config.liqpay?.privateKey;
    return crypto.createHash('sha1').update(signatureString).digest('base64');
  }

  private static generatePrivatBankSignature(data: PrivatBankPaymentData): string {
    const signatureString = `${data.amt}${data.ccy}${data.merchant}${data.order}${config.privatbank?.merchantPassword}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  private static generateWayForPaySignature(data: unknown): string {
    const signatureString = [
      data.merchantAccount,
      data.merchantDomainName,
      data.orderReference,
      data.orderDate,
      data.amount,
      data.currency,
      ...(data.productName || []),
      ...(data.productCount || []),
      ...(data.productPrice || [])
    ].join(';');
    
    const hash = crypto.createHmac('md5', config.wayforpay?.secretKey || '').update(signatureString).digest('hex');
    return hash;
  }

  // Mock payment for development
  private static createMockLiqPayPayment(data: LiqPayPaymentData): {
    payment_url: string;
    payment_id: string;
    data_base64: string;
    signature: string;
  } {
    const mockData = {
      version: '3',
      action: 'pay',
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      order_id: data.order_id,
      mock: true,
    };

    const dataBase64 = Buffer.from(JSON.stringify(mockData)).toString('base64');

    return {
      payment_url: `${config.frontend.url}/booking/payment-result?mock=liqpay`,
      payment_id: data.order_id,
      data_base64: dataBase64,
      signature: 'mock_signature',
    };
  }

  // Helper to extract value from XML (simplified)
  private static extractXmlValue(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`);
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  // Verify webhook signatures
  static verifyLiqPaySignature(data: string, receivedSignature: string): boolean {
    const expectedSignature = this.generateLiqPaySignature(data);
    return expectedSignature === receivedSignature;
  }

  static verifyWayForPaySignature(data: Record<string, unknown>, receivedSignature: string): boolean {
    const expectedSignature = this.generateWayForPaySignature(data);
    return expectedSignature === receivedSignature;
  }

  // Currency conversion (simplified - in production use real exchange rates)
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const rates = {
      'USD_UAH': 37,
      'EUR_UAH': 40,
      'UAH_USD': 0.027,
      'UAH_EUR': 0.025,
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = rates[rateKey as keyof typeof rates];

    if (!rate) {
      logger.warn(`Currency conversion rate not found for ${rateKey}`);
      return amount; // Return original amount if no conversion rate
    }

    return Math.round(amount * rate * 100) / 100;
  }

  // Get supported payment methods for Ukraine
  static getSupportedPaymentMethods(): Array<{
    id: string;
    name: string;
    nameUk: string;
    nameRu: string;
    icon: string;
    currencies: string[];
    description: string;
    descriptionUk: string;
    descriptionRu: string;
  }> {
    return [
      {
        id: 'liqpay',
        name: 'LiqPay',
        nameUk: 'LiqPay',
        nameRu: 'LiqPay',
        icon: '💳',
        currencies: ['UAH', 'USD', 'EUR'],
        description: 'Pay with Visa, Mastercard, or Privat24',
        descriptionUk: 'Оплата картами Visa, Mastercard або Приват24',
        descriptionRu: 'Оплата картами Visa, Mastercard или Privat24',
      },
      {
        id: 'monobank',
        name: 'Monobank',
        nameUk: 'Монобанк',
        nameRu: 'Монобанк',
        icon: '🏦',
        currencies: ['UAH'],
        description: 'Pay with Monobank cards',
        descriptionUk: 'Оплата картами Монобанку',
        descriptionRu: 'Оплата картами Монобанка',
      },
      {
        id: 'privatbank',
        name: 'PrivatBank',
        nameUk: 'ПриватБанк',
        nameRu: 'ПриватБанк',
        icon: '🏪',
        currencies: ['UAH', 'USD'],
        description: 'Pay with PrivatBank cards',
        descriptionUk: 'Оплата картами ПриватБанку',
        descriptionRu: 'Оплата картами ПриватБанка',
      },
      {
        id: 'wayforpay',
        name: 'WayForPay',
        nameUk: 'WayForPay',
        nameRu: 'WayForPay',
        icon: '💰',
        currencies: ['UAH'],
        description: 'Secure online payments',
        descriptionUk: 'Безпечні онлайн платежі',
        descriptionRu: 'Безопасные онлайн платежи',
      },
    ];
  }
}
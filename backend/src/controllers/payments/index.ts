// Import split controller modules
import { CorePaymentController } from './core.controller';
import { HistoryPaymentController } from './history.controller';
import { EarningsPaymentController } from './earnings.controller';
import { MethodsPaymentController } from './methods.controller';
import { WalletPaymentController } from './wallet.controller';
import { PayPalPaymentController } from './paypal.controller';
import { WayForPayPaymentController } from './wayforpay.controller';
import { CoinbasePaymentController } from './coinbase.controller';
import { WebhooksPaymentController } from './webhooks.controller';

// Re-export individual controller classes for direct use
export { CorePaymentController } from './core.controller';
export { HistoryPaymentController } from './history.controller';
export { EarningsPaymentController } from './earnings.controller';
export { MethodsPaymentController } from './methods.controller';
export { WalletPaymentController } from './wallet.controller';
export { PayPalPaymentController } from './paypal.controller';
export { WayForPayPaymentController } from './wayforpay.controller';
export { CoinbasePaymentController } from './coinbase.controller';
export { WebhooksPaymentController } from './webhooks.controller';

/**
 * Unified PaymentController that delegates to focused sub-controllers.
 * This class maintains backward compatibility with route files that import
 * `PaymentController` from `@/controllers/payments`.
 */
export class PaymentController {
  // Core payment operations
  static createPaymentIntent = CorePaymentController.createPaymentIntent;
  static confirmPayment = CorePaymentController.confirmPayment;
  static getPaymentStatus = CorePaymentController.getPaymentStatus;
  static getPaymentDetails = CorePaymentController.getPaymentDetails;
  static processRefund = CorePaymentController.processRefund;
  static mockPaymentSuccess = CorePaymentController.mockPaymentSuccess;

  // Payment history / filtering
  static getPaymentHistory = HistoryPaymentController.getPaymentHistory;
  static getUserPayments = HistoryPaymentController.getUserPayments;

  // Earnings operations
  static getEarningsOverview = EarningsPaymentController.getEarningsOverview;
  static getEarningsTrends = EarningsPaymentController.getEarningsTrends;
  static getEarningsAnalytics = EarningsPaymentController.getEarningsAnalytics;
  static getSpecialistEarnings = EarningsPaymentController.getSpecialistEarnings;
  static getRevenueData = EarningsPaymentController.getRevenueData;

  // Payment methods CRUD
  static getUserPaymentMethods = MethodsPaymentController.getUserPaymentMethods;
  static addPaymentMethod = MethodsPaymentController.addPaymentMethod;
  static updatePaymentMethod = MethodsPaymentController.updatePaymentMethod;
  static deletePaymentMethod = MethodsPaymentController.deletePaymentMethod;
  static setDefaultPaymentMethod = MethodsPaymentController.setDefaultPaymentMethod;

  // Wallet operations
  static getWalletBalance = WalletPaymentController.getWalletBalance;
  static getWalletTransactions = WalletPaymentController.getWalletTransactions;

  // PayPal operations
  static createPayPalOrder = PayPalPaymentController.createPayPalOrder;
  static capturePayPalOrder = PayPalPaymentController.capturePayPalOrder;
  static getPayPalOrderDetails = PayPalPaymentController.getPayPalOrderDetails;
  static refundPayPalPayment = PayPalPaymentController.refundPayPalPayment;

  // WayForPay operations
  static createWayForPayInvoice = WayForPayPaymentController.createWayForPayInvoice;
  static getWayForPayPaymentStatus = WayForPayPaymentController.getWayForPayPaymentStatus;

  // Coinbase operations
  static createCoinbaseCharge = CoinbasePaymentController.createCoinbaseCharge;
  static getCoinbaseChargeDetails = CoinbasePaymentController.getCoinbaseChargeDetails;

  // Webhook handlers
  static handlePayPalWebhook = WebhooksPaymentController.handlePayPalWebhook;
  static handleWayForPayWebhook = WebhooksPaymentController.handleWayForPayWebhook;
  static handleCoinbaseWebhook = WebhooksPaymentController.handleCoinbaseWebhook;
}

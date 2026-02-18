/**
 * Payment Controllers - Split by Provider
 *
 * This module re-exports all payment controller methods from provider-specific files
 * and assembles them into a unified PaymentController class for backward compatibility
 * with existing route imports.
 *
 * Provider modules:
 *   - stripe.controller.ts   -- Core/general payment methods (intent, confirm, history, methods CRUD, earnings, refunds)
 *   - paypal.controller.ts   -- PayPal order creation, capture, details, refund, webhook
 *   - wayforpay.controller.ts -- WayForPay invoice creation, status, webhook
 *   - coinbase.controller.ts -- Coinbase Commerce charge creation, details, webhook
 *   - wallet.controller.ts   -- Wallet balance and transaction history
 */

import { StripeController } from './stripe.controller';
import { PayPalController } from './paypal.controller';
import { WayForPayController } from './wayforpay.controller';
import { CoinbaseController } from './coinbase.controller';
import { WalletController } from './wallet.controller';

// Re-export individual provider controllers for direct access
export { StripeController } from './stripe.controller';
export { PayPalController } from './paypal.controller';
export { WayForPayController } from './wayforpay.controller';
export { CoinbaseController } from './coinbase.controller';
export { WalletController } from './wallet.controller';

/**
 * Unified PaymentController that delegates to provider-specific controllers.
 * This class preserves backward compatibility with routes/payments.ts which imports
 * `PaymentController` and calls static methods like `PaymentController.createPayPalOrder`.
 */
export class PaymentController {
  // --- Core/Stripe methods (from stripe.controller.ts) ---
  static createPaymentIntent = StripeController.createPaymentIntent;
  static confirmPayment = StripeController.confirmPayment;
  static getPaymentStatus = StripeController.getPaymentStatus;
  static getPaymentDetails = StripeController.getPaymentDetails;
  static getPaymentHistory = StripeController.getPaymentHistory;
  static getUserPayments = StripeController.getUserPayments;
  static getEarningsOverview = StripeController.getEarningsOverview;
  static getEarningsTrends = StripeController.getEarningsTrends;
  static getEarningsAnalytics = StripeController.getEarningsAnalytics;
  static getSpecialistEarnings = StripeController.getSpecialistEarnings;
  static processRefund = StripeController.processRefund;
  static mockPaymentSuccess = StripeController.mockPaymentSuccess;
  static getRevenueData = StripeController.getRevenueData;
  static getUserPaymentMethods = StripeController.getUserPaymentMethods;
  static addPaymentMethod = StripeController.addPaymentMethod;
  static updatePaymentMethod = StripeController.updatePaymentMethod;
  static deletePaymentMethod = StripeController.deletePaymentMethod;
  static setDefaultPaymentMethod = StripeController.setDefaultPaymentMethod;

  // --- PayPal methods (from paypal.controller.ts) ---
  static createPayPalOrder = PayPalController.createPayPalOrder;
  static capturePayPalOrder = PayPalController.capturePayPalOrder;
  static getPayPalOrderDetails = PayPalController.getPayPalOrderDetails;
  static refundPayPalPayment = PayPalController.refundPayPalPayment;
  static handlePayPalWebhook = PayPalController.handlePayPalWebhook;

  // --- WayForPay methods (from wayforpay.controller.ts) ---
  static createWayForPayInvoice = WayForPayController.createWayForPayInvoice;
  static getWayForPayPaymentStatus = WayForPayController.getWayForPayPaymentStatus;
  static handleWayForPayWebhook = WayForPayController.handleWayForPayWebhook;

  // --- Coinbase methods (from coinbase.controller.ts) ---
  static createCoinbaseCharge = CoinbaseController.createCoinbaseCharge;
  static getCoinbaseChargeDetails = CoinbaseController.getCoinbaseChargeDetails;
  static handleCoinbaseWebhook = CoinbaseController.handleCoinbaseWebhook;

  // --- Wallet methods (from wallet.controller.ts) ---
  static getWalletBalance = WalletController.getWalletBalance;
  static getWalletTransactions = WalletController.getWalletTransactions;
}

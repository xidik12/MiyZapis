# Apple Pay Integration Plan

## 📋 Overview

This plan outlines the complete implementation of Apple Pay through PayPal's SDK for the MiyZapis booking platform.

## ✅ Prerequisites Check

### 1. **PayPal Account Requirements**
- ✅ PayPal Business/Developer Account
- ✅ PayPal Client ID & Secret (already configured)
- ⏳ PayPal Live Account (required for Apple Pay domain registration)
- ⏳ Apple Pay enabled in PayPal dashboard

### 2. **Apple Developer Requirements**
- ❓ Apple Developer Account ($99/year)
- ❓ Apple Pay Merchant ID
- ❓ Payment Processing Certificate

### 3. **Domain Requirements**
- ✅ Production domain: `miyzapis.com`
- ⏳ Domain verification with Apple
- ⏳ HTTPS certificate (already have)

### 4. **Technical Requirements**
- ✅ PayPal JavaScript SDK integration
- ✅ Backend API (already have)
- ⏳ Apple Pay button implementation
- ⏳ Domain association file hosting

---

## 🏗️ Architecture

### Frontend Flow
```
User clicks Apple Pay button
    ↓
Apple Pay sheet appears
    ↓
User authenticates (Face ID/Touch ID/Password)
    ↓
Payment data sent to backend
    ↓
Backend creates PayPal order with Apple Pay
    ↓
PayPal processes payment
    ↓
Booking confirmed
```

### Backend Flow
```
Frontend → Create Apple Pay Order
    ↓
PayPal SDK → Create order with payment_source: applepay
    ↓
PayPal API → Process payment
    ↓
Webhook → Payment confirmation
    ↓
Update booking status
```

---

## 📝 Implementation Steps

### Phase 1: Apple Developer Setup (1-2 days)

**1.1 Create Apple Developer Account**
- Sign up at https://developer.apple.com
- Pay $99 annual fee
- Wait for approval (usually 24-48 hours)

**1.2 Create Merchant ID**
```
1. Login to Apple Developer Portal
2. Go to Certificates, IDs & Profiles
3. Select Identifiers → Register New Identifier
4. Choose Merchant IDs
5. Create ID: merchant.com.miyzapis
6. Save and activate
```

**1.3 Create Payment Processing Certificate**
```
1. In Merchant ID settings
2. Create Payment Processing Certificate
3. Generate CSR from PayPal dashboard
4. Upload CSR to Apple
5. Download certificate
6. Upload to PayPal dashboard
```

### Phase 2: PayPal Configuration (1 day)

**2.1 Enable Apple Pay in PayPal**
```
1. Login to PayPal Developer Dashboard (LIVE account)
2. Go to Apps & Credentials
3. Select your app
4. Scroll to Features → Accept payments
5. Find "Advanced Credit and Debit Card Payments"
6. Enable Apple Pay
```

**2.2 Register Domain**
```
1. In PayPal dashboard (LIVE mode)
2. Apple Pay settings → Add Domain
3. Enter: miyzapis.com
4. Download domain association file
5. Host at: /.well-known/apple-developer-merchantid-domain-association
```

**2.3 Verify Domain Requirements**
- File must be served via HTTPS 1.1
- Content-Type: application/octet-stream
- No 3XX redirects
- No firewall blocking
- Accessible publicly

### Phase 3: Frontend Implementation (2-3 days)

**3.1 Add PayPal SDK with Apple Pay Support**

In `frontend/public/index.html`:
```html
<script src="https://www.paypal.com/sdk/js?
  client-id=YOUR_CLIENT_ID&
  components=buttons,applepay&
  merchant-id=YOUR_MERCHANT_ID&
  currency=USD">
</script>
```

**3.2 Create Apple Pay Button Component**

New file: `frontend/src/components/payment/ApplePayButton.tsx`
```typescript
import { useEffect, useState } from 'react';

interface ApplePayButtonProps {
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: Error) => void;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  amount,
  onSuccess,
  onError
}) => {
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);

  useEffect(() => {
    if (window.paypal?.Applepay) {
      window.paypal.Applepay().config().then((config: any) => {
        if (config.isEligible) {
          setIsApplePayAvailable(true);
        }
      });
    }
  }, []);

  const handleApplePay = async () => {
    try {
      const applepay = window.paypal.Applepay();

      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        total: {
          label: 'MiyZapis Booking Deposit',
          amount: (amount / 100).toString(),
          type: 'final'
        }
      };

      applepay.confirmOrder({
        orderId: await createBackendOrder(), // Your backend call
        paymentRequest
      }).then((result: any) => {
        onSuccess(result.id);
      });
    } catch (error) {
      onError(error as Error);
    }
  };

  if (!isApplePayAvailable) return null;

  return (
    <button
      onClick={handleApplePay}
      className="apple-pay-button"
      style={{
        width: '100%',
        height: '48px',
        borderRadius: '8px',
        background: 'black',
        color: 'white'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        🍎 Pay
      </span>
    </button>
  );
};
```

**3.3 Add to Payment Options**

Update `BookingFlow.tsx`:
```typescript
// Add Apple Pay to payment methods
const paymentMethods = [
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
  { id: 'paypal', name: 'PayPal', icon: '💳' },
  { id: 'applepay', name: 'Apple Pay', icon: '🍎' }, // NEW
  { id: 'wayforpay', name: 'WayForPay', icon: '💰' }
];

// Add Apple Pay handler
if (paymentMethod === 'applepay') {
  // Show Apple Pay button component
  <ApplePayButton
    amount={depositAmount}
    onSuccess={handleApplePaySuccess}
    onError={handleApplePayError}
  />
}
```

### Phase 4: Backend Implementation (2 days)

**4.1 Add Apple Pay Order Creation**

Update `backend/src/services/payment/paypal.service.ts`:
```typescript
async createApplePayOrder(data: {
  bookingId: string;
  amount: number;
  currency: string;
  description?: string;
}): Promise<any> {
  if (!PayPalService.isConfigured()) {
    throw new Error('PayPal is not configured');
  }

  this.initializeClient();

  const paypalAmount = (data.amount / 100).toFixed(2);

  const orderRequest = {
    intent: 'CAPTURE',
    payment_source: {
      apple_pay: {
        id: data.applePayToken, // From frontend
        name: data.customerName,
        email_address: data.customerEmail,
        phone_number: {
          national_number: data.customerPhone
        }
      }
    },
    purchase_units: [{
      reference_id: data.bookingId,
      description: data.description || 'Booking payment',
      amount: {
        currency_code: data.currency.toUpperCase(),
        value: paypalAmount
      }
    }],
    application_context: {
      brand_name: 'MiyZapis',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: `${config.frontend.url}/booking/${data.bookingId}?payment=success`,
      cancel_url: `${config.frontend.url}/booking/${data.bookingId}?payment=cancel`
    }
  };

  const response = await this.ordersController!.createOrder({
    body: orderRequest
  });

  return {
    id: response.result.id,
    status: response.result.status
  };
}
```

**4.2 Add Controller Endpoint**

Update `backend/src/controllers/payment.controller.ts`:
```typescript
async createApplePayOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { bookingId, amount, currency, applePayToken, customerName, customerEmail } = req.body;

    const order = await paypalService.createApplePayOrder({
      bookingId,
      amount,
      currency,
      applePayToken,
      customerName,
      customerEmail
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Failed to create Apple Pay order', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create Apple Pay order'
    });
  }
}
```

**4.3 Add Route**

Update `backend/src/routes/payments.ts`:
```typescript
router.post('/applepay/create-order', authenticateToken, PaymentController.createApplePayOrder);
```

### Phase 5: Domain Association File (1 day)

**5.1 Host Domain Association File**

Create: `frontend/public/.well-known/apple-developer-merchantid-domain-association`

```
1. Download file from PayPal dashboard
2. Place in: frontend/public/.well-known/
3. Ensure no file extension
4. Configure server to serve with:
   - Content-Type: application/octet-stream
   - HTTPS 1.1
   - No redirects
```

**5.2 Configure Vite/Server**

Update `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  publicDir: 'public',
  server: {
    // Ensure .well-known is served correctly
    fs: {
      allow: ['.well-known']
    }
  }
});
```

**5.3 Verify Domain**

Test access:
```bash
curl -I https://miyzapis.com/.well-known/apple-developer-merchantid-domain-association

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/octet-stream
```

### Phase 6: Testing (2-3 days)

**6.1 Sandbox Testing**
- Use Apple Pay sandbox on iOS device/simulator
- Test with sandbox credit cards
- Verify payment flow end-to-end

**6.2 Production Testing**
- Test on real iOS device
- Use real Apple Pay cards
- Verify small amount transactions

**6.3 Error Scenarios**
- Test payment cancellation
- Test network errors
- Test invalid cards
- Test expired cards

---

## 🚨 Important Considerations

### Device Requirements
- **Works On:** iPhone, iPad, Mac with Safari, Apple Watch
- **Doesn't Work On:** Android, Windows, Linux
- **Detection:** Check `window.ApplePaySession` availability

### Browser Requirements
- **Required:** Safari on iOS 10+ or macOS 10.12+
- **Not Supported:** Chrome, Firefox, Edge (even on Apple devices)

### Payment Flow Differences
- Apple Pay uses biometric authentication
- No redirect - in-page payment sheet
- Instant payment confirmation
- Better conversion rates (fewer steps)

### Security Requirements
- HTTPS is mandatory (already have)
- Domain must be verified
- Certificate must be valid
- No proxy/CDN issues

---

## 📊 Estimated Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Apple Developer Setup | 1-2 days | ⏳ Pending |
| 2 | PayPal Configuration | 1 day | ⏳ Pending |
| 3 | Frontend Implementation | 2-3 days | ⏳ Pending |
| 4 | Backend Implementation | 2 days | ⏳ Pending |
| 5 | Domain Association | 1 day | ⏳ Pending |
| 6 | Testing & QA | 2-3 days | ⏳ Pending |
| **Total** | | **9-12 days** | |

---

## 💰 Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Account | $99 | Annual |
| PayPal Transaction Fees | 2.9% + $0.30 | Per transaction |
| Additional Development | Included | One-time |
| **Total Initial** | **$99** | |

---

## ✅ Pre-Implementation Checklist

Before starting, ensure:

- [ ] PayPal is working correctly (test with v1.0.3)
- [ ] Have budget for Apple Developer account ($99)
- [ ] Have access to live PayPal account (not just sandbox)
- [ ] Have iOS device for testing
- [ ] Domain is fully set up with SSL
- [ ] Decide if Apple Pay is priority vs WayForPay

---

## 🎯 Next Immediate Steps

1. **Wait for v1.0.3 deployment** - Verify PayPal works
2. **Purchase Apple Developer account** - If not already have one
3. **Access live PayPal account** - Required for domain registration
4. **Download domain association file** - From PayPal dashboard
5. **Begin Phase 1** - Apple Developer setup

---

## 📚 Resources

- [PayPal Apple Pay Docs](https://developer.paypal.com/docs/checkout/apm/apple-pay/)
- [Apple Pay Web Docs](https://developer.apple.com/documentation/apple_pay_on_the_web)
- [PayPal Apple Pay Example](https://github.com/paypal-examples/applepay)
- [Domain Verification Guide](https://developer.apple.com/documentation/applepaywebmerchantregistrationapi/preparing-merchant-domains-for-verification)

---

## ❓ Questions to Answer

1. Do you have an Apple Developer account already?
2. Do you have access to your LIVE PayPal account (not sandbox)?
3. Is Apple Pay a priority, or should we focus on getting WayForPay working first?
4. Do you have an iOS device for testing?
5. What's your timeline for launching Apple Pay?

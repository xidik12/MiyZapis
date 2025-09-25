# Payment Completion Detection Setup Guide

This guide helps you set up and test the payment completion detection system that allows users to see booking confirmation immediately after completing payment through Coinbase Commerce.

## 🔧 Configuration Required

### 1. Environment Variables

Make sure these are set in your `.env` file:

```bash
# Coinbase Commerce Configuration
COINBASE_COMMERCE_API_KEY="your_actual_coinbase_commerce_api_key"
COINBASE_COMMERCE_WEBHOOK_SECRET="your_actual_webhook_secret"

# WebSocket Configuration
WEBSOCKET_CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:3004,http://localhost:3005"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:3004,http://localhost:3005"
```

### 2. Coinbase Commerce Setup

1. **Create Coinbase Commerce Account**
   - Go to https://commerce.coinbase.com/
   - Sign up and verify your account

2. **Get API Keys**
   - Navigate to Settings > API Keys
   - Create a new API key (use test mode for development)
   - Copy the API key to `COINBASE_COMMERCE_API_KEY`

3. **Setup Webhook**
   - Go to Settings > Webhook subscriptions
   - Create a new webhook endpoint
   - URL: `https://your-domain.com/api/v1/crypto-payments/webhooks/coinbase`
   - For local development with ngrok: `https://abc123.ngrok.io/api/v1/crypto-payments/webhooks/coinbase`
   - Copy the webhook secret to `COINBASE_COMMERCE_WEBHOOK_SECRET`

### 3. Local Development with ngrok

For local testing, you'll need ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
npm run dev

# In another terminal, expose port 3002 (or your backend port)
ngrok http 3002

# Use the https URL from ngrok for your webhook endpoint
```

## 🚀 How It Works

### Payment Flow

1. **User initiates payment** → Frontend calls `/api/v1/crypto-payments/intent`
2. **Payment intent created** → Coinbase Commerce charge is generated
3. **User completes payment** → Coinbase Commerce processes the payment
4. **Webhook received** → Your server receives payment confirmation
5. **Socket.io events emitted** → Real-time events sent to frontend
6. **User sees confirmation** → Booking confirmation appears instantly

### Socket.io Events

The system emits these events:

#### Payment Completion Event
```javascript
socket.on('notification', (data) => {
  if (data.type === 'PAYMENT_COMPLETED') {
    // Handle payment completion
    console.log('Payment completed:', data.data);
  }
});
```

#### Booking Confirmation Event
```javascript
socket.on('booking_updated', (data) => {
  if (data.type === 'BOOKING_CONFIRMED') {
    // Handle booking confirmation
    console.log('Booking confirmed:', data.data);
  }
});
```

## 🧪 Testing the Flow

### Automated Testing

Use the provided test script:

```bash
# Update test configuration in test-payment-completion.js
# Set your actual tokens and IDs

node test-payment-completion.js
```

### Manual Testing Steps

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **Connect to WebSocket** (from frontend or test client)
   ```javascript
   const socket = io('http://localhost:3002', {
     auth: { token: 'your_jwt_token' }
   });

   socket.on('notification', console.log);
   socket.on('booking_updated', console.log);
   ```

3. **Create a payment intent**
   ```bash
   curl -X POST http://localhost:3002/api/v1/crypto-payments/intent \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{
       "serviceId": "your_service_id",
       "scheduledAt": "2024-12-26T10:00:00Z",
       "duration": 60,
       "useWalletFirst": false,
       "paymentMethod": "CRYPTO_ONLY"
     }'
   ```

4. **Simulate webhook** (or use Coinbase Commerce test environment)
   ```bash
   # Create webhook signature
   WEBHOOK_SECRET="your_webhook_secret"
   PAYLOAD='{"event":{"type":"charge:confirmed","data":{"id":"charge_123"}}}'
   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | xxd -p)

   curl -X POST http://localhost:3002/api/v1/crypto-payments/webhooks/coinbase \
     -H "Content-Type: application/json" \
     -H "X-CC-Webhook-Signature: $SIGNATURE" \
     -d "$PAYLOAD"
   ```

## 🛠 Frontend Integration

### React Example

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function PaymentCompletion({ paymentId, userToken }) {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token: userToken }
    });

    // Listen for payment completion
    socket.on('notification', (data) => {
      if (data.type === 'PAYMENT_COMPLETED' && data.data.paymentId === paymentId) {
        setPaymentStatus('completed');
      }
    });

    // Listen for booking confirmation
    socket.on('booking_updated', (data) => {
      if (data.type === 'BOOKING_CONFIRMED') {
        setBookingConfirmed(true);
      }
    });

    return () => socket.disconnect();
  }, [paymentId, userToken]);

  if (bookingConfirmed) {
    return <div>🎉 Booking confirmed! Payment received.</div>;
  }

  if (paymentStatus === 'completed') {
    return <div>✅ Payment completed! Confirming booking...</div>;
  }

  return <div>⏳ Waiting for payment completion...</div>;
}
```

### Vue.js Example

```javascript
import { onMounted, onUnmounted, ref } from 'vue';
import { io } from 'socket.io-client';

export default {
  props: ['paymentId', 'userToken'],
  setup(props) {
    const paymentStatus = ref('pending');
    const bookingConfirmed = ref(false);
    let socket = null;

    onMounted(() => {
      socket = io(process.env.VUE_APP_API_URL, {
        auth: { token: props.userToken }
      });

      socket.on('notification', (data) => {
        if (data.type === 'PAYMENT_COMPLETED' && data.data.paymentId === props.paymentId) {
          paymentStatus.value = 'completed';
        }
      });

      socket.on('booking_updated', (data) => {
        if (data.type === 'BOOKING_CONFIRMED') {
          bookingConfirmed.value = true;
        }
      });
    });

    onUnmounted(() => {
      if (socket) socket.disconnect();
    });

    return { paymentStatus, bookingConfirmed };
  }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket connection fails**
   - Check CORS configuration in `WEBSOCKET_CORS_ORIGIN`
   - Ensure JWT token is valid and passed correctly
   - Verify the WebSocket server is running

2. **Webhook signature verification fails**
   - Check `COINBASE_COMMERCE_WEBHOOK_SECRET` matches Coinbase settings
   - Ensure payload is exactly as sent by Coinbase (no modifications)

3. **Events not received**
   - Check server logs for WebSocket initialization errors
   - Verify user is authenticated and in the correct room
   - Test WebSocket connection independently

4. **Payment not found in webhook**
   - Ensure the charge ID in the webhook matches the database record
   - Check that the crypto payment was created before the webhook

### Debug Mode

Enable debug logging:

```bash
export DEBUG="booking:*,payment:*,websocket:*"
npm run dev
```

### Log Analysis

Check these log entries:
- `WebSocketManager initialized successfully`
- `Payment completion event emitted successfully`
- `Coinbase webhook processed successfully`

## 📊 Monitoring

### Key Metrics to Track

1. **Webhook Processing Time** - Should be < 500ms
2. **WebSocket Event Delivery** - Should be near-instant
3. **Payment Confirmation Rate** - Track successful vs failed payments
4. **WebSocket Connection Stability** - Monitor disconnection rates

### Health Check Endpoint

```bash
curl http://localhost:3002/api/v1/health
```

Should return WebSocket service status and connection counts.

## 🔒 Security Considerations

1. **Webhook Signature Verification** - Always verify Coinbase signatures
2. **JWT Token Validation** - Ensure WebSocket connections are authenticated
3. **Rate Limiting** - Implement rate limits on webhook endpoints
4. **Input Validation** - Validate all webhook payloads
5. **Error Handling** - Don't expose sensitive information in error messages

## 📚 Additional Resources

- [Coinbase Commerce API Docs](https://commerce.coinbase.com/docs/api/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Webhook Handling](https://expressjs.com/en/guide/routing.html)
- [JWT Authentication](https://jwt.io/introduction/)

---

**Need Help?** Check the server logs and ensure all configuration values are properly set. The test script will help identify specific issues in the flow.
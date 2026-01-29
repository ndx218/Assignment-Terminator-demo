# Payment Methods Setup Guide

This project now supports three payment methods:
1. **Stripe** (Credit Card) - Automatic, instant activation
2. **Alipay HK** (Alipay Hong Kong) - Manual processing
3. **WeChat Pay** (微信支付) - Manual processing

## Stripe Setup

### 1. Install Dependencies
```bash
npm install stripe @stripe/stripe-js
```

### 2. Get Stripe API Keys
1. Sign up at [https://stripe.com](https://stripe.com)
2. Go to Dashboard → Developers → API keys
3. Copy your **Publishable key** and **Secret key**

### 3. Configure Environment Variables
Add to your `.env.local` file:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook secret (get from Stripe Dashboard → Webhooks)
```

### 4. Set Up Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/payments/stripe-webhook`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Test Mode
- Use test cards: `4242 4242 4242 4242`
- Any future expiry date and CVC
- See [Stripe Testing](https://stripe.com/docs/testing) for more test cards

## Alipay HK Setup

1. Upload your Alipay QR code image to `/public/alipay-qr.png`
2. The QR code will be displayed in the payment page
3. Users upload payment screenshots for manual processing

## WeChat Pay Setup

1. Add your WeChat QR code image to `/public/wechat-qr.png` (optional)
2. Update the WeChat contact info in `components/RechargeContent.tsx` if needed
3. Users upload payment screenshots for manual processing

## Package Pricing

The following packages are available:

| Package | Price (HKD) | Points | Package ID |
|---------|-------------|--------|------------|
| 首充套餐 | $10 | 25+ | `first` |
| 入門套餐 | $20 | 20 | `starter` |
| 小資套餐 | $30 | 35 | `budget` |
| 標準套餐 | $50 | 60 | `standard` |
| 高級套餐 | $100 | 125 | `premium` |

## Payment Flow

### Stripe (Automatic)
1. User selects package and payment method (Stripe)
2. User clicks "前往 Stripe 付款"
3. Redirects to Stripe Checkout
4. User completes payment
5. Webhook automatically adds points to user account
6. User redirected back to recharge page with success message

### Alipay/WeChat Pay (Manual)
1. User selects package and payment method (Alipay/WeChat)
2. User scans QR code and completes payment
3. User uploads payment screenshot
4. Admin reviews and manually processes payment
5. Points added within 24 hours

## API Endpoints

- `POST /api/payments/create-stripe-session` - Create Stripe checkout session
- `POST /api/payments/stripe-webhook` - Handle Stripe webhook events
- `POST /api/upload-payment` - Upload manual payment screenshot

## Troubleshooting

### Stripe Not Working
- Check that `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set
- Verify webhook endpoint is accessible
- Check Stripe Dashboard for webhook delivery logs
- Ensure webhook secret matches `STRIPE_WEBHOOK_SECRET`

### Points Not Added After Stripe Payment
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is receiving events
- Check server logs for errors
- Ensure `STRIPE_WEBHOOK_SECRET` is correct

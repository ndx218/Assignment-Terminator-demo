// /pages/api/payments/test-stripe-config.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7) || 'missing',
    secretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    publishableKeyLength: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
  };

  // Check if Stripe package is installed
  let stripeInstalled = false;
  try {
    require('stripe');
    stripeInstalled = true;
  } catch (e) {
    stripeInstalled = false;
  }

  return res.status(200).json({
    ...config,
    stripeInstalled,
    status: config.hasSecretKey && config.hasPublishableKey && stripeInstalled ? 'OK' : 'CONFIGURATION_ERROR',
    issues: [
      !stripeInstalled && 'Stripe package not installed',
      !config.hasSecretKey && 'STRIPE_SECRET_KEY not set',
      !config.hasPublishableKey && 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set',
      config.secretKeyPrefix !== 'sk_live' && config.secretKeyPrefix !== 'sk_test' && config.hasSecretKey && 'Invalid secret key format',
      config.publishableKeyPrefix !== 'pk_live' && config.publishableKeyPrefix !== 'pk_test' && config.hasPublishableKey && 'Invalid publishable key format',
    ].filter(Boolean),
  });
}

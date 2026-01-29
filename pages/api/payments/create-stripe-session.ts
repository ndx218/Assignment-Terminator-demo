// /pages/api/payments/create-stripe-session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Dynamically import Stripe to handle cases where it's not installed
let Stripe: any;
try {
  Stripe = require('stripe').default;
} catch (e) {
  console.warn('Stripe package not installed. Please run: npm install stripe');
}

const getStripeInstance = () => {
  if (!Stripe) {
    throw new Error('Stripe is not configured. Please install stripe package and set STRIPE_SECRET_KEY.');
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
};

// Package pricing mapping (in HKD cents)
const PACKAGE_PRICES: Record<string, number> = {
  'first': 1000,    // $10 HKD = 1000 cents
  'starter': 2000,  // $20 HKD = 2000 cents
  'budget': 3000,   // $30 HKD = 3000 cents
  'standard': 5000, // $50 HKD = 5000 cents
  'premium': 10000, // $100 HKD = 10000 cents
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('[Stripe Session Check]', {
      hasSession: !!session,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      nodeEnv: process.env.NODE_ENV,
    });
    
    if (!session?.user?.id) {
      console.error('[Stripe Auth Failed]', {
        session: session ? 'exists but no user.id' : 'null',
        cookies: req.headers.cookie ? 'present' : 'missing',
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Please log in to continue',
      });
    }

    const { packageType, referralCode } = req.body;

    if (!packageType || !PACKAGE_PRICES[packageType]) {
      return res.status(400).json({ error: 'Invalid package type' });
    }

    const amount = PACKAGE_PRICES[packageType];

    // Create Stripe Checkout Session
    const stripe = getStripeInstance();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: `點數充值 - ${packageType}`,
              description: `Package: ${packageType}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/recharge?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/recharge?canceled=true`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        packageType,
        referralCode: referralCode || '',
      },
    });

    return res.status(200).json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('[Stripe Error]', error);
    const errorMessage = error.message || 'Failed to create payment session';
    console.error('[Stripe Error Details]', {
      message: errorMessage,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      } : undefined,
    });
  }
}

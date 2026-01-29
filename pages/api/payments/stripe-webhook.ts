// /pages/api/payments/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

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

// Points mapping based on package type
const PACKAGE_POINTS: Record<string, number> = {
  'first': 25,
  'starter': 20,
  'budget': 35,
  'standard': 60,
  'premium': 125,
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'No signature' });
  }

  let event: any;

  try {
    const stripe = getStripeInstance();
    const body = await getRawBody(req);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Webhook Error]', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const userId = session.metadata?.userId;
      const packageType = session.metadata?.packageType || '';
      const referralCode = session.metadata?.referralCode || '';

      if (!userId) {
        console.error('[Webhook] No userId in metadata');
        return res.status(400).json({ error: 'No userId' });
      }

      const points = PACKAGE_POINTS[packageType] || 0;
      if (points === 0) {
        console.error('[Webhook] Invalid package type:', packageType);
        return res.status(400).json({ error: 'Invalid package type' });
      }

      // Add points to user account using transaction
      await prisma.$transaction(async (tx) => {
        // Check idempotency
        const idempotencyKey = `stripe_${session.id}`;
        const existedTx = await tx.transaction.findUnique({ 
          where: { idempotencyKey } 
        }).catch(() => null);
        
        if (existedTx) {
          console.log('[Webhook] Duplicate payment, skipping');
          return;
        }

        // Get user
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, credits: true },
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Update user credits
        const updated = await tx.user.update({
          where: { id: userId },
          data: { credits: { increment: points } },
          select: { id: true, credits: true },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId,
            amount: points,
            type: 'TOPUP',
            description: `Stripe payment - ${packageType} package (新餘額 ${updated.credits})`,
            idempotencyKey,
          },
        });

        // Handle referral code if provided
        if (referralCode) {
          // Apply referral logic here if needed
          console.log('[Webhook] Referral code:', referralCode);
        }

        console.log('[Webhook] Payment processed successfully:', { userId, points, packageType, newBalance: updated.credits });
      });
    } catch (error: any) {
      console.error('[Webhook Processing Error]', error);
      return res.status(500).json({ error: 'Failed to process payment' });
    }
  }

  return res.status(200).json({ received: true });
}

// Helper function to get raw body for webhook verification
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

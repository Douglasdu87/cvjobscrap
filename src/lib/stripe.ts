import Stripe from 'stripe';

// Check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!(key && !key.includes('placeholder') && !key.includes('your_secret_key'));
}

// Initialize Stripe with the secret key
export const stripe = isStripeConfigured() 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })
  : null as any; // Null when not configured

// Plan prices in cents
export const PLAN_PRICES = {
  starter: {
    monthly: 0,
    yearly: 0,
  },
  pro: {
    monthly: 999, // €9.99
    yearly: 9590, // €95.90 (20% discount)
  },
  elite: {
    monthly: 2000, // €20.00
    yearly: 19200, // €192.00 (20% discount)
  },
};

// Create a Stripe customer
export async function createStripeCustomer(email: string, name?: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'cvjobscrap',
    },
  });
  return customer.id;
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      source: 'cvjobscrap',
    },
  });
  return session.url || '';
}

// Create a billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Reactivate a subscription
export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

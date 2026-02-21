import { NextRequest, NextResponse } from 'next/server';
import { 
  stripe, 
  createStripeCustomer, 
  createCheckoutSession,
  isStripeConfigured,
  PLAN_PRICES 
} from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, billingCycle, userId, email, name } = body;

    if (!plan || !billingCycle || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Free plan doesn't need Stripe
    if (plan === 'starter') {
      return NextResponse.json({ 
        success: true,
        plan: 'starter',
        message: 'Free plan activated'
      });
    }

    // Check if Stripe is properly configured
    if (!isStripeConfigured()) {
      console.log('Stripe not configured, using demo mode');
      // Demo mode - simulate successful subscription
      return NextResponse.json({ 
        success: true,
        plan,
        demo: true,
        message: 'Demo mode: Stripe not configured. Add your Stripe keys to .env for real payments.'
      });
    }

    try {
      // Get or create Stripe customer
      const customerId = await createStripeCustomer(email, name);

      // Create a price on-the-fly (works in test mode)
      const price = await stripe.prices.create({
        unit_amount: PLAN_PRICES[plan as keyof typeof PLAN_PRICES]?.[billingCycle as 'monthly' | 'yearly'] || 0,
        currency: 'eur',
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : 'month',
        },
        product_data: {
          name: `CVJobScrap ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}`,
        },
        metadata: {
          plan,
          billingCycle,
        }
      });
      
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const checkoutUrl = await createCheckoutSession(
        customerId,
        price.id,
        `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
        `${baseUrl}/?canceled=true`
      );

      return NextResponse.json({ 
        url: checkoutUrl,
        customerId,
      });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      
      // If Stripe fails, return demo mode
      return NextResponse.json({ 
        success: true,
        plan,
        demo: true,
        error: stripeError.message,
        message: 'Stripe error. Demo mode activated.'
      });
    }

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}

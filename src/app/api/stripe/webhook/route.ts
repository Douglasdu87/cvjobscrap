import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { db } from '@/lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const email = session.customer_email || session.customer_details?.email;
        
        // Extract plan info from metadata
        const plan = session.metadata?.plan || 'pro';
        
        if (email) {
          // Update or create user with subscription
          await db.user.upsert({
            where: { email },
            create: {
              email,
              subscription: {
                create: {
                  plan,
                  status: 'active',
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                }
              },
              settings: {
                create: {
                  autoApply: false,
                  frequency: 'daily',
                  maxApplicationsPerDay: plan === 'elite' ? -1 : plan === 'pro' ? 10 : 3,
                }
              }
            },
            update: {
              subscription: {
                upsert: {
                  create: {
                    plan,
                    status: 'active',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                  },
                  update: {
                    plan,
                    status: 'active',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                  }
                }
              }
            }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        // Find user by Stripe customer ID and update
        // Note: In a real app, you'd have a stripeCustomerId field on User
        console.log('Subscription updated:', { customerId, status, cancelAtPeriodEnd });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        console.log('Subscription deleted:', customerId);
        // Downgrade to starter plan
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        console.log('Invoice paid:', customerId);
        // Update subscription period end date
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        console.log('Payment failed:', customerId);
        // Mark subscription as past_due
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: error.message 
    }, { status: 500 });
  }
}

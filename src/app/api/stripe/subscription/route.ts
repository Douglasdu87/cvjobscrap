import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription, reactivateSubscription, getSubscription } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'cancel':
        await cancelSubscription(subscriptionId);
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription will be cancelled at the end of the billing period' 
        });

      case 'reactivate':
        await reactivateSubscription(subscriptionId);
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription reactivated' 
        });

      case 'get':
        const subscription = await getSubscription(subscriptionId);
        return NextResponse.json({ subscription });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Subscription management error:', error);
    return NextResponse.json({ 
      error: 'Failed to manage subscription',
      details: error.message 
    }, { status: 500 });
  }
}

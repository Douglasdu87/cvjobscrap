import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const portalUrl = await createBillingPortalSession(customerId, `${baseUrl}/dashboard`);

    return NextResponse.json({ url: portalUrl });

  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ 
      error: 'Failed to create billing portal session',
      details: error.message 
    }, { status: 500 });
  }
}

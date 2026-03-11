import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendSummaryEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { applications } = await request.json();

    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json({ error: 'Aucune candidature à notifier' }, { status: 400 });
    }

    await sendSummaryEmail(session.user.email, session.user.name || 'Candidat', applications);

    return NextResponse.json({ success: true, message: 'Résumé envoyé par e-mail' });
  } catch (error: any) {
    console.error('Summary Notification Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

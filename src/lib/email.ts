const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
// Verified sender in Brevo: Settings → Senders & IPs → Add a sender
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@cvjobscrap.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'CVJobScrap';

export async function sendSummaryEmail(toEmail: string, userName: string, applications: any[]) {
  if (!BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY is missing. Skipping email.');
    return;
  }

  console.log(`[Email] Sending summary to ${toEmail} from ${BREVO_SENDER_EMAIL}...`);

  const appRows = applications.map(app => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0;"><strong>${app.jobTitle}</strong></td>
      <td style="padding: 10px 0;">${app.company}</td>
      <td style="padding: 10px 0; text-align: right;"><a href="${app.sourceUrl}" style="color: #2557a7; text-decoration: none;">Voir l'annonce</a></td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #2557a7, #1a3d7a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🚀 CVJobScrap</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Votre assistant IA pour votre carrière</p>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="color: #2557a7; margin-top: 0;">Bonjour ${userName} 👋</h2>
        <p>Bonne nouvelle ! Votre agent IA a préparé <strong>${applications.length} candidature(s)</strong> en votre nom.</p>

        <h3 style="border-bottom: 2px solid #2557a7; padding-bottom: 10px;">Récapitulatif des envois</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="color: #666; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 10px 0; text-align: left;">Poste</th>
              <th style="padding: 10px 0; text-align: left;">Entreprise</th>
              <th style="padding: 10px 0; text-align: right;">Lien</th>
            </tr>
          </thead>
          <tbody>
            ${appRows}
          </tbody>
        </table>

        <div style="background: #f0f7ff; border-left: 4px solid #2557a7; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #2557a7;">
            💡 <strong>Conseil :</strong> Rendez-vous sur votre tableau de bord pour suivre l'avancement de vos candidatures en temps réel.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}" 
             style="background: #2557a7; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Voir mon tableau de bord
          </a>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        CVJobScrap — Postulez intelligemment, décrochez plus vite.
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: toEmail, name: userName }],
        replyTo: { email: toEmail },
        subject: `✅ ${applications.length} candidature(s) préparée(s) — CVJobScrap`,
        htmlContent,
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[Email] Brevo API error ${response.status}:`, responseText);
      throw new Error(`Brevo Error ${response.status}: ${responseText}`);
    }

    console.log(`[Email] ✅ Résumé envoyé à ${toEmail}. Brevo response: ${responseText}`);
  } catch (error) {
    console.error('[Email] Erreur d\'envoi Brevo:', error);
    throw error;
  }
}

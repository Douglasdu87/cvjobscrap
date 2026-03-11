const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

export async function sendSummaryEmail(toEmail: string, userName: string, applications: any[]) {
  if (!BREVO_API_KEY || !RAPIDAPI_KEY) {
    console.warn("BREVO_API_KEY or RAPIDAPI_KEY is missing. Skipping email.");
    return;
  }

  const appRows = applications.map(app => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0;"><strong>${app.jobTitle}</strong></td>
      <td style="padding: 10px 0;">${app.company}</td>
      <td style="padding: 10px 0; text-align: right;"><a href="${app.sourceUrl}" style="color: #2557a7; text-decoration: none;">Voir l'annonce</a></td>
    </tr>
  `).join('');

  const body = {
    sender: { email: "no-reply@cvjobscrap.com" },
    to: [{ email: toEmail }],
    subject: "Récapitulatif de vos auto-candidatures - CVJobScrap",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2557a7;">Bonjour ${userName},</h1>
        <p>Bonne nouvelle ! Vos auto-candidatures ont été préparées avec succès par notre IA.</p>
        
        <h2 style="border-bottom: 2px solid #2557a7; padding-bottom: 10px;">Résumé des envois (${applications.length})</h2>
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
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Retrouvez tous les détails et gérez vos candidatures directement sur votre <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="color: #2557a7;">tableau de bord</a>.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          CVJobScrap - Votre assistant IA pour votre carrière
        </p>
      </div>
    `,
    api_key: BREVO_API_KEY
  };

  try {
    const response = await fetch('https://sendinblue-transactional-email.p.rapidapi.com/send-sendinblue-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'sendinblue-transactional-email.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`RapidAPI/Brevo Error: ${JSON.stringify(error)}`);
    }

    console.log(`Email de résumé envoyé via RapidAPI à ${toEmail}`);
  } catch (error) {
    console.error("Erreur d'envoi RapidAPI/Brevo:", error);
    throw error;
  }
}

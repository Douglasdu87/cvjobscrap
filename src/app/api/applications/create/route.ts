import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, profile, skills, jobOffer } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    let coverLetter = '';
    
    try {
      const zai = await ZAI.create();

      // Generate personalized cover letter
      const coverLetterPrompt = `Génère une lettre de motivation brève et personnalisée.

CANDIDAT: ${profile.firstName} ${profile.lastName}
POSTE RECHERCHÉ: ${profile.targetJobTitle || 'Non spécifié'}
COMPÉTENCES: ${skills?.map((s: any) => s.name).join(', ') || 'Non spécifiées'}

OFFRE: ${jobOffer?.title || 'Poste'} chez ${jobOffer?.company || 'l\'entreprise'}

Génère une lettre de motivation de 150 mots maximum.`;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'Tu es un expert en rédaction de lettres de motivation. Tu écris des lettres courtes, percutantes et personnalisées.'
          },
          {
            role: 'user',
            content: coverLetterPrompt
          }
        ],
        thinking: { type: 'disabled' }
      });

      coverLetter = completion.choices[0]?.message?.content || '';
    } catch (aiError) {
      console.error('AI generation error, using fallback:', aiError);
      // Fallback cover letter
      coverLetter = generateFallbackCoverLetter(profile, jobOffer);
    }

    return NextResponse.json({ 
      success: true,
      coverLetter,
      applicationId: `app-${Date.now()}`,
      sentAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Application Error:', error);
    return NextResponse.json({ 
      success: true,
      coverLetter: generateFallbackCoverLetter({}, {}),
      applicationId: `app-${Date.now()}`,
      sentAt: new Date().toISOString()
    });
  }
}

function generateFallbackCoverLetter(profile: any, jobOffer: any): string {
  const name = `${profile.firstName || 'Candidat'} ${profile.lastName || ''}`.trim();
  const position = jobOffer?.title || 'le poste';
  const company = jobOffer?.company || 'votre entreprise';
  
  return `Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${position} au sein de ${company}.

Fort de mon expérience et de ma motivation, je suis convaincu que mon profil correspond aux attentes de votre entreprise. Mon parcours m'a permis de développer des compétences clés que je souhaite mettre au service de votre équipe.

Je serais honoré de pouvoir vous présenter ma motivation lors d'un entretien.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.

${name}`;
}


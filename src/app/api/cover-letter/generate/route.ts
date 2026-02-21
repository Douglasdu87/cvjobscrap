import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, skills, jobOffer } = body;

    if (!profile || !jobOffer) {
      return NextResponse.json({ error: 'Profile and job offer data are required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const prompt = `Génère une lettre de motivation personnalisée et professionnelle en français.

**CANDIDAT:**
- Nom: ${profile.firstName} ${profile.lastName}
- Poste actuel/recherché: ${profile.targetJobTitle || 'Non spécifié'}
- Expériences clés: ${profile.summary || 'Non spécifié'}
- Compétences: ${skills?.map((s: any) => s.name).join(', ') || 'Non spécifiées'}

**OFFRE D'EMPLOI:**
- Poste: ${jobOffer.title}
- Entreprise: ${jobOffer.company}
- Localisation: ${jobOffer.location || 'Non spécifiée'}
- Description: ${jobOffer.description}
- Type: ${jobOffer.jobType || 'Non spécifié'}
- Remote: ${jobOffer.remote ? 'Oui' : 'Non'}

**CONSIGNES:**
1. La lettre doit être adaptée spécifiquement à cette entreprise et ce poste
2. Mettre en valeur les compétences pertinentes pour le poste
3. Montrer de l'intérêt pour l'entreprise
4. Être convaincante mais honnête
5. Maximum 300 mots
6. Format standard: introduction, développement, conclusion

Génère uniquement la lettre de motivation, sans commentaires.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'Tu es un expert en rédaction de lettres de motivation personnalisées. Tu écris des lettres convaincantes, professionnelles et adaptées à chaque offre d\'emploi.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const coverLetter = completion.choices[0]?.message?.content;

    if (!coverLetter) {
      return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
    }

    return NextResponse.json({ 
      coverLetter,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Cover Letter Generation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate cover letter',
      details: error.message 
    }, { status: 500 });
  }
}

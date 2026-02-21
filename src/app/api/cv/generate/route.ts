import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Retry helper function
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, experiences, educations, certifications, languages, skills } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    // Build the CV content prompt
    const prompt = `Génère un CV professionnel optimisé ATS (Applicant Tracking System) pour le candidat suivant. 
    
Le CV doit être:
- Bien structuré avec des sections claires
- Optimisé pour les systèmes ATS (mots-clés pertinents, format simple)
- Adapté au poste visé: ${profile.targetJobTitle || 'Non spécifié'}
- En français

INFORMATIONS DU CANDIDAT:

**Identité:**
- Nom: ${profile.firstName || ''} ${profile.lastName || ''}
- Email: ${profile.email || 'Non renseigné'}
- Téléphone: ${profile.phone || 'Non renseigné'}
- Localisation: ${profile.city || ''}, ${profile.country || 'France'}
- LinkedIn: ${profile.linkedin || 'Non renseigné'}
- Site web: ${profile.website || 'Non renseigné'}

**Résumé professionnel:**
${profile.summary || 'À développer selon le profil'}

**Objectif:**
- Poste recherché: ${profile.targetJobTitle || 'Non spécifié'}
- Localisation souhaitée: ${profile.targetLocation || 'Non spécifiée'}
- Type de contrat: ${profile.jobType || 'Non spécifié'}
- Télétravail: ${profile.remoteWork ? 'Ouvert au télétravail' : 'Non spécifié'}

**Expériences professionnelles:**
${experiences?.map((exp: any, i: number) => `
${i + 1}. ${exp.position || 'Poste'} chez ${exp.company || 'Entreprise'}
   - Période: ${exp.startDate || ''} - ${exp.current ? 'Présent' : exp.endDate || ''}
   - Localisation: ${exp.location || 'Non spécifiée'}
   - Description: ${exp.description || 'Pas de description'}
`).join('\n') || 'Aucune expérience renseignée'}

**Formation:**
${educations?.map((edu: any, i: number) => `
${i + 1}. ${edu.degree || 'Diplôme'} - ${edu.school || 'École'}
   - Période: ${edu.startDate || ''} - ${edu.current ? 'Présent' : edu.endDate || ''}
`).join('\n') || 'Aucune formation renseignée'}

**Compétences:**
${skills?.map((s: any) => s.name).join(', ') || 'Aucune compétence renseignée'}

**Langues:**
${languages?.map((l: any) => `${l.name || 'Langue'} (${l.level || 'Niveau non spécifié'})`).join(', ') || 'Aucune langue renseignée'}

**Certifications:**
${certifications?.map((c: any) => `${c.name || 'Certification'} - ${c.issuer || 'Organisme'} (${c.date || 'Date non spécifiée'})`).join('\n') || 'Aucune certification'}

Génère le CV complet au format texte structuré avec les sections suivantes:
1. EN-TÊTE (nom, coordonnées)
2. PROFIL / RÉSUMÉ
3. EXPÉRIENCES PROFESSIONNELLES
4. FORMATION
5. COMPÉTENCES
6. LANGUES
7. CERTIFICATIONS (si applicable)

N'ajoute pas de commentaires, génère uniquement le CV.`;

    // Initialize SDK
    const zai = await ZAI.create();

    // Use retry logic for API call
    const completion = await withRetry(async () => {
      return await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'Tu es un expert en rédaction de CV professionnels optimisés pour les systèmes ATS. Tu génères des CV clairs, concis et impactants en français.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        thinking: { type: 'disabled' }
      });
    }, 3, 2000);

    const cv = completion.choices[0]?.message?.content;

    if (!cv) {
      return NextResponse.json({ error: 'Failed to generate CV' }, { status: 500 });
    }

    // Calculate ATS score based on profile completeness
    let score = 50;
    if (profile.firstName && profile.lastName) score += 5;
    if (profile.email) score += 5;
    if (profile.phone) score += 5;
    if (profile.summary) score += 10;
    if (profile.targetJobTitle) score += 5;
    if (experiences?.length > 0) score += 10;
    if (educations?.length > 0) score += 5;
    if (skills?.length > 0) score += 5;
    if (languages?.length > 0) score += 3;
    if (certifications?.length > 0) score += 2;
    score = Math.min(100, score);

    return NextResponse.json({ 
      cv,
      score,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('CV Generation Error:', error);
    
    // Generate a fallback CV if AI fails
    const { profile, experiences, educations, certifications, languages, skills } = await request.json().catch(() => ({}));
    
    if (profile) {
      const fallbackCV = generateFallbackCV(profile, experiences, educations, certifications, languages, skills);
      return NextResponse.json({ 
        cv: fallbackCV,
        score: 60,
        generatedAt: new Date().toISOString(),
        warning: 'CV généré en mode dégradé (IA non disponible)'
      });
    }
    
    return NextResponse.json({ 
      error: 'Impossible de générer le CV. Veuillez réessayer.',
      details: error.message 
    }, { status: 500 });
  }
}

// Fallback CV generator when AI is unavailable
function generateFallbackCV(profile: any, experiences: any[], educations: any[], certifications: any[], languages: any[], skills: any[]): string {
  let cv = '';
  
  // Header
  cv += `${profile.firstName || ''} ${profile.lastName || ''}\n`.toUpperCase();
  cv += `${profile.email || ''} | ${profile.phone || ''}\n`;
  cv += `${profile.city || ''}, ${profile.country || 'France'}\n`;
  if (profile.linkedin) cv += `LinkedIn: ${profile.linkedin}\n`;
  if (profile.website) cv += `Site web: ${profile.website}\n`;
  cv += '\n---\n\n';
  
  // Profile
  if (profile.summary) {
    cv += `PROFIL\n${profile.summary}\n\n`;
  }
  
  // Objective
  if (profile.targetJobTitle) {
    cv += `OBJECTIF PROFESSIONNEL\n`;
    cv += `Recherche un poste de ${profile.targetJobTitle}`;
    if (profile.targetLocation) cv += ` à ${profile.targetLocation}`;
    cv += '\n\n';
  }
  
  // Experience
  if (experiences?.length > 0) {
    cv += `EXPÉRIENCES PROFESSIONNELLES\n`;
    experiences.forEach(exp => {
      cv += `• ${exp.position || 'Poste'} - ${exp.company || 'Entreprise'}\n`;
      cv += `  ${exp.startDate || ''} - ${exp.current ? 'Présent' : exp.endDate || ''}\n`;
      if (exp.description) cv += `  ${exp.description}\n`;
      cv += '\n';
    });
  }
  
  // Education
  if (educations?.length > 0) {
    cv += `FORMATION\n`;
    educations.forEach(edu => {
      cv += `• ${edu.degree || 'Diplôme'} - ${edu.school || 'École'}\n`;
      cv += `  ${edu.startDate || ''} - ${edu.current ? 'Présent' : edu.endDate || ''}\n\n`;
    });
  }
  
  // Skills
  if (skills?.length > 0) {
    cv += `COMPÉTENCES\n`;
    cv += skills.map(s => s.name).join(' • ') + '\n\n';
  }
  
  // Languages
  if (languages?.length > 0) {
    cv += `LANGUES\n`;
    languages.forEach(lang => {
      cv += `• ${lang.name || 'Langue'}: ${lang.level || 'Niveau non spécifié'}\n`;
    });
    cv += '\n';
  }
  
  // Certifications
  if (certifications?.length > 0) {
    cv += `CERTIFICATIONS\n`;
    certifications.forEach(cert => {
      cv += `• ${cert.name || 'Certification'} - ${cert.issuer || 'Organisme'}`;
      if (cert.date) cv += ` (${cert.date})`;
      cv += '\n';
    });
  }
  
  return cv;
}

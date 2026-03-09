import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
  const body = await request.json();
  const { profile, experiences, educations, certifications, languages, skills } = body;

  try {

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    // Build the CV content prompt — optimized for professional output and structured JSON
    const prompt = `Tu es un expert en rédaction de CV professionnels. Génère un CV COMPLET et PROFESSIONNEL pour le candidat ci-dessous, optimisé pour les systèmes ATS.

## RÈGLES DE RÉDACTION :
- Utilise des **verbes d'action** au passé (Développé, Géré, Optimisé, Conçu...)
- Ajoute des **résultats quantifiés** quand c'est pertinent (%, chiffres, volumes)
- Rédige un résumé percutant de 3-4 lignes maximum.
- Enrichis et améliore les descriptions des expériences fournies pour qu'elles soient hyper professionnelles (sous forme de tableau de strings/puces).
- En français.

## INFORMATIONS DU CANDIDAT :

**Identité :**
- Nom complet : ${profile.firstName || ''} ${profile.lastName || ''}
- Email : ${profile.email || 'Non renseigné'}
- Téléphone : ${profile.phone || 'Non renseigné'}
- Localisation : ${profile.city || ''}${profile.country ? ', ' + profile.country : ''}
- LinkedIn : ${profile.linkedin || 'Non renseigné'}
- Site web/Portfolio : ${profile.website || 'Non renseigné'}

**Objectif professionnel :**
- Poste recherché : ${profile.targetJobTitle || 'Non spécifié'}

**Résumé professionnel actuel :**
${profile.summary || 'Aucun résumé fourni — crée un résumé professionnel percutant basé sur les données ci-dessous.'}

**Expériences professionnelles (enrichis les descriptions sous forme de liste à puces) :**
${experiences?.length > 0 ? experiences.map((exp: any, i: number) => `
${i + 1}. ${exp.position || 'Poste'} — ${exp.company || 'Entreprise'}
   - Période : ${exp.startDate || ''} → ${exp.current ? 'Présent' : exp.endDate || ''}
   - Description actuelle : ${exp.description || 'Pas de description'}
`).join('\n') : 'Aucune expérience renseignée'}

**Formation :**
${educations?.length > 0 ? educations.map((edu: any, i: number) => `
${i + 1}. ${edu.degree || 'Diplôme'} — ${edu.school || 'Établissement'}
   - Période : ${edu.startDate || ''} → ${edu.current ? 'Présent' : edu.endDate || ''}
`).join('\n') : 'Aucune formation renseignée'}

**Compétences techniques :**
${skills?.map((s: any) => `${s.name} (${s.level || 'intermédiaire'})`).join(', ') || 'Aucune compétence renseignée'}

**Langues :**
${languages?.map((l: any) => `${l.name || 'Langue'} — ${l.level || 'Niveau non spécifié'}`).join(', ') || 'Aucune langue renseignée'}

## FORMAT DE SORTIE OBLIGATOIRE (JSON STRICT) :
Tu DOIS retourner UNIQUEMENT un objet JSON valide avec la structure exacte suivante. Ne mets aucun texte avant ou après le JSON.
{
  "header": {
    "fullName": "Nom complet au format propre",
    "targetJobTitle": "Titre du poste (optimisé ATS)",
    "email": "email",
    "phone": "téléphone",
    "location": "Ville, Pays",
    "linkedin": "url ou null",
    "website": "url ou null"
  },
  "summary": "Le résumé percutant (1 paragraphe)",
  "experiences": [
    {
      "position": "Titre du poste",
      "company": "Nom de l'entreprise",
      "period": "Mois Année - Mois Année (ou Présent)",
      "achievements": [
        "Réalisation clé avec verbe d'action et résultat chiffré",
        "Autre point fort..."
      ]
    }
  ],
  "educations": [
    {
      "degree": "Diplôme exact",
      "school": "École / Établissement",
      "period": "Année - Année"
    }
  ],
  "skills": ["Compétence 1", "Compétence 2", "Compétence 3"],
  "languages": [
    {
      "name": "Langue",
      "level": "Niveau"
    }
  ],
  "interests": ["Intérêt 1", "Intérêt 2"]
}`;

    // Call Groq API (free, fast, using llama model)
    const completion = await withRetry(async () => {
      return await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en rédaction de CV. Tu renvoies TOUJOURS tes réponses au format JSON strict, sans bloc markdown ```json ni aucun texte explicatif.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Low temperature for consistent JSON
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });
    }, 3, 2000);

    const cvContentRaw = completion.choices[0]?.message?.content;

    if (!cvContentRaw) {
      return NextResponse.json({ error: 'Failed to generate CV' }, { status: 500 });
    }

    let cvJsonData;
    try {
      cvJsonData = JSON.parse(cvContentRaw);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", cvContentRaw);
      cvJsonData = { _rawText: cvContentRaw }; // Fallback
    }


    // Generate improvement suggestions via a second quick call
    let suggestions: string[] = [];
    try {
      const suggestionsCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Tu es un consultant RH expert. Donne des conseils concrets et actionnables pour améliorer un CV. Réponds uniquement avec une liste JSON de suggestions (tableau de strings en français). Maximum 5 suggestions.'
          },
          {
            role: 'user',
            content: `Analyse ce profil et donne des suggestions d'amélioration pour le CV :
- Poste visé : ${profile.targetJobTitle || 'Non spécifié'}
- Résumé : ${profile.summary || 'Aucun'}
- Nombre d'expériences : ${experiences?.length || 0}
- Compétences : ${skills?.map((s: any) => s.name).join(', ') || 'Aucune'}
- Langues : ${languages?.length || 0}
- Certifications : ${certifications?.length || 0}
- LinkedIn renseigné : ${profile.linkedin ? 'Oui' : 'Non'}
- Photo/Portfolio : ${profile.website ? 'Oui' : 'Non'}

Réponds UNIQUEMENT avec un tableau JSON, exemple : ["suggestion 1", "suggestion 2"]`
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      const suggestionsText = suggestionsCompletion.choices[0]?.message?.content || '[]';
      // Extract JSON array from the response
      const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (sugError) {
      console.log('Suggestions generation skipped:', sugError);
      // Non-blocking: suggestions are optional
    }

    // Calculate ATS score based on profile completeness
    let score = 40;
    if (profile.firstName && profile.lastName) score += 5;
    if (profile.email) score += 5;
    if (profile.phone) score += 5;
    if (profile.summary && profile.summary.length > 50) score += 10;
    if (profile.targetJobTitle) score += 5;
    if (profile.linkedin) score += 3;
    if (profile.website) score += 2;
    if (experiences?.length > 0) score += Math.min(15, experiences.length * 5);
    if (educations?.length > 0) score += 5;
    if (skills?.length > 0) score += Math.min(5, skills.length);
    if (languages?.length > 0) score += 3;
    if (certifications?.length > 0) score += 2;
    score = Math.min(100, score);

    return NextResponse.json({
      cv: JSON.stringify(cvJsonData),
      score,
      suggestions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('CV Generation Error:', error);

    // Generate a fallback CV if AI fails
    if (profile) {
      const fallbackCV = generateFallbackCV(profile, experiences, educations, certifications, languages, skills);
      return NextResponse.json({
        cv: fallbackCV,
        score: 55,
        suggestions: [
          "Ajoutez un résumé professionnel percutant de 3-4 lignes",
          "Quantifiez vos résultats dans chaque expérience (%, chiffres, volumes)",
          "Ajoutez votre profil LinkedIn pour augmenter votre crédibilité",
          "Utilisez des mots-clés du secteur visé dans vos descriptions",
        ],
        generatedAt: new Date().toISOString(),
        warning: 'CV généré en mode dégradé (IA non disponible)',
      });
    }

    return NextResponse.json({
      error: 'Impossible de générer le CV. Veuillez réessayer.',
      details: error.message,
    }, { status: 500 });
  }
}

// Fallback CV generator when AI is unavailable
function generateFallbackCV(
  profile: any,
  experiences: any[],
  educations: any[],
  certifications: any[],
  languages: any[],
  skills: any[]
): string {
  let cv = '';

  // Header
  cv += '═══════════════════════════════════════\n';
  cv += `${(profile.firstName || '').toUpperCase()} ${(profile.lastName || '').toUpperCase()}\n`;
  if (profile.targetJobTitle) cv += `${profile.targetJobTitle}\n`;
  const contactParts = [profile.email, profile.phone].filter(Boolean);
  if (contactParts.length > 0) cv += `${contactParts.join(' | ')}\n`;
  const locationParts = [profile.city, profile.country].filter(Boolean);
  if (locationParts.length > 0) cv += `${locationParts.join(', ')}\n`;
  const linkParts = [
    profile.linkedin ? `LinkedIn: ${profile.linkedin}` : null,
    profile.website ? `Portfolio: ${profile.website}` : null,
  ].filter(Boolean);
  if (linkParts.length > 0) cv += `${linkParts.join(' | ')}\n`;
  cv += '═══════════════════════════════════════\n\n';

  // Profile
  if (profile.summary) {
    cv += `▸ PROFIL PROFESSIONNEL\n${profile.summary}\n\n`;
  }

  // Objective
  if (profile.targetJobTitle) {
    cv += `▸ OBJECTIF PROFESSIONNEL\n`;
    cv += `Recherche un poste de ${profile.targetJobTitle}`;
    if (profile.targetLocation) cv += ` à ${profile.targetLocation}`;
    cv += '\n\n';
  }

  // Experience
  if (experiences?.length > 0) {
    cv += `▸ EXPÉRIENCES PROFESSIONNELLES\n`;
    experiences.forEach(exp => {
      cv += `\n• ${exp.position || 'Poste'} — ${exp.company || 'Entreprise'}\n`;
      cv += `  ${exp.startDate || ''} → ${exp.current ? 'Présent' : exp.endDate || ''}\n`;
      if (exp.location) cv += `  📍 ${exp.location}\n`;
      if (exp.description) cv += `  ${exp.description}\n`;
    });
    cv += '\n';
  }

  // Education
  if (educations?.length > 0) {
    cv += `▸ FORMATION\n`;
    educations.forEach(edu => {
      cv += `• ${edu.degree || 'Diplôme'} — ${edu.school || 'Établissement'}\n`;
      cv += `  ${edu.startDate || ''} → ${edu.current ? 'Présent' : edu.endDate || ''}\n`;
    });
    cv += '\n';
  }

  // Skills
  if (skills?.length > 0) {
    cv += `▸ COMPÉTENCES\n`;
    cv += skills.map(s => s.name).join(' • ') + '\n\n';
  }

  // Languages
  if (languages?.length > 0) {
    cv += `▸ LANGUES\n`;
    languages.forEach(lang => {
      cv += `• ${lang.name || 'Langue'} — ${lang.level || 'Niveau non spécifié'}\n`;
    });
    cv += '\n';
  }

  // Certifications
  if (certifications?.length > 0) {
    cv += `▸ CERTIFICATIONS\n`;
    certifications.forEach(cert => {
      cv += `• ${cert.name || 'Certification'} — ${cert.issuer || 'Organisme'}`;
      if (cert.date) cv += ` (${cert.date})`;
      cv += '\n';
    });
  }

  return cv;
}

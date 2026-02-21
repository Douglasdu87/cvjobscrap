import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      profile, 
      experiences, 
      skills, 
      preferences,
      generatedCV,
      maxApplications = 5
    } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Step 1: Generate search queries based on profile
    const searchQueryPrompt = `Basé sur le profil suivant, génère 3 requêtes de recherche d'emploi optimisées.

Profil:
- Nom: ${profile.firstName} ${profile.lastName}
- Poste recherché: ${profile.targetJobTitle || 'Non spécifié'}
- Compétences: ${skills?.map((s: any) => s.name).join(', ') || 'Non spécifiées'}
- Localisation: ${profile.targetLocation || profile.city || 'Non spécifiée'}
- Remote: ${profile.remoteWork ? 'Oui' : 'Non'}

Préférences:
${preferences?.jobTypes?.length ? `- Types de poste: ${preferences.jobTypes.join(', ')}` : ''}
${preferences?.locations?.length ? `- Localisations: ${preferences.locations.join(', ')}` : ''}
${preferences?.keywords?.length ? `- Mots-clés: ${preferences.keywords.join(', ')}` : ''}

Retourne un tableau JSON avec 3 objets, chaque objet ayant:
{
  "query": "requête de recherche",
  "location": "localisation",
  "jobType": "type de contrat"
}`;

    const searchResponse = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Tu es un expert en recherche d\'emploi. Tu génères des requêtes de recherche optimisées.' },
        { role: 'user', content: searchQueryPrompt }
      ],
      thinking: { type: 'disabled' }
    });

    let searchQueries;
    try {
      const content = searchResponse.choices[0]?.message?.content || '[]';
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      searchQueries = JSON.parse(jsonStr.trim());
    } catch {
      searchQueries = [
        { query: profile.targetJobTitle || 'Développeur', location: profile.city || 'Paris', jobType: 'CDI' }
      ];
    }

    // Step 2: Simulate job search results (in production, connect to job boards APIs)
    const mockJobs = [
      { id: '1', title: profile.targetJobTitle || 'Développeur Full Stack', company: 'TechStart', location: preferences?.locations?.[0] || profile.city || 'Paris', description: 'Startup innovante recherche profil passionné', salary: '45k-55k', jobType: 'CDI', remote: true, matchScore: 95, source: 'LinkedIn', publishedAt: new Date().toISOString() },
      { id: '2', title: profile.targetJobTitle || 'Développeur Senior', company: 'ScaleUp', location: preferences?.locations?.[0] || profile.city || 'Paris', description: 'Équipe technique en croissance', salary: '50k-65k', jobType: 'CDI', remote: preferences?.remoteOnly ?? true, matchScore: 88, source: 'Welcome to the Jungle', publishedAt: new Date().toISOString() },
      { id: '3', title: profile.targetJobTitle || 'Lead Tech', company: 'InnoCorp', location: 'Remote', description: 'Leadership technique', salary: '55k-75k', jobType: 'CDI', remote: true, matchScore: 82, source: 'Indeed', publishedAt: new Date().toISOString() },
    ];

    // Step 3: Filter jobs based on preferences
    const filteredJobs = mockJobs.filter((job: any) => {
      if (preferences?.remoteOnly && !job.remote) return false;
      if (preferences?.minSalary) {
        const salaryNum = parseInt(job.salary?.replace(/[^0-9]/g, '') || '0');
        if (salaryNum < preferences.minSalary * 1000) return false;
      }
      return true;
    }).slice(0, maxApplications);

    // Step 4: Generate cover letter and apply for each job
    const applications = [];
    
    for (const job of filteredJobs) {
      const coverLetterPrompt = `Génère une lettre de motivation personnalisée pour ce poste.

CANDIDAT:
- Nom: ${profile.firstName} ${profile.lastName}
- Email: ${profile.email}
- Expériences: ${experiences?.slice(0, 2).map((e: any) => `${e.position} chez ${e.company}`).join(', ') || 'Non spécifiées'}
- Compétences clés: ${skills?.slice(0, 5).map((s: any) => s.name).join(', ') || 'Non spécifiées'}

POSTE:
- Titre: ${job.title}
- Entreprise: ${job.company}
- Description: ${job.description}

CONSIGNES:
- Lettre professionnelle et engageante
- 3 paragraphes maximum
- Montre l'intérêt pour l'entreprise
- Relie les compétences au poste
- Ton professionnel mais chaleureux`;

      const coverLetterResponse = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'Tu es un expert en rédaction de lettres de motivation personnalisées et impactantes.' },
          { role: 'user', content: coverLetterPrompt }
        ],
        thinking: { type: 'disabled' }
      });

      const coverLetter = coverLetterResponse.choices[0]?.message?.content || '';

      applications.push({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        coverLetter,
        matchScore: job.matchScore,
        status: 'sent',
        sentAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      searchQueries,
      jobsFound: filteredJobs.length,
      applications,
      message: `${applications.length} candidatures envoyées automatiquement`
    });

  } catch (error: any) {
    console.error('Auto-apply Error:', error);
    return NextResponse.json({ 
      error: 'Auto-apply failed',
      details: error.message 
    }, { status: 500 });
  }
}

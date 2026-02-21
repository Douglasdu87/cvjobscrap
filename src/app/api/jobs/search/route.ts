import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, skills, filters } = body;

    const zai = await ZAI.create();

    // Generate realistic job offers based on profile
    const prompt = `Génère une liste de 5 offres d'emploi fictives mais réalistes correspondant au profil suivant.

**PROFIL CANDIDAT:**
- Poste recherché: ${profile.targetJobTitle || 'Non spécifié'}
- Localisation: ${profile.targetLocation || 'France'}
- Compétences: ${skills?.map((s: any) => s.name).join(', ') || 'Non spécifiées'}
- Type de contrat: ${profile.jobType || 'CDI'}
- Télétravail: ${profile.remoteWork ? 'Oui' : 'Non'}
- Filtres: ${filters?.location || 'Toutes'}, ${filters?.jobType || 'Tous types'}

**FORMAT DE RÉPONSE (JSON uniquement):**
{
  "jobs": [
    {
      "id": "unique-id",
      "title": "Titre du poste",
      "company": "Nom de l'entreprise",
      "location": "Ville, Pays",
      "description": "Description courte du poste (2-3 phrases)",
      "salary": "Fourchette salariale",
      "jobType": "CDI/CDD/Freelance",
      "remote": true/false,
      "source": "LinkedIn/Indeed/WelcomeToTheJungle",
      "matchScore": nombre entre 70-100,
      "publishedAt": "2024-01-XX"
    }
  ]
}

Les offres doivent être:
1. Pertinentes par rapport au profil
2. D'entreprises françaises ou internationales présentes en France
3. Avec des salaires réalistes
4. Le matchScore doit refléter la pertinence (plus élevé si compétences similaires)

Génère uniquement le JSON, sans autre texte.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'Tu es un assistant qui génère des données d\'offres d\'emploi réalistes au format JSON. Tu réponds uniquement avec du JSON valide.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    let jobs = [];
    try {
      const responseText = completion.choices[0]?.message?.content || '';
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        jobs = parsed.jobs || [];
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Return mock data if parsing fails
      jobs = generateMockJobs(profile, skills);
    }

    return NextResponse.json({ 
      jobs: jobs.length > 0 ? jobs : generateMockJobs(profile, skills),
      searchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Job Search Error:', error);
    return NextResponse.json({ 
      jobs: generateMockJobs({}, []),
      error: error.message 
    }, { status: 200 }); // Return mock data even on error
  }
}

function generateMockJobs(profile: any, skills: any[]) {
  const jobTitle = profile?.targetJobTitle || 'Développeur';
  const location = profile?.targetLocation || 'Paris';
  
  return [
    {
      id: 'job-1',
      title: `${jobTitle} Senior`,
      company: 'TechCorp France',
      location: location,
      description: `Poste de ${jobTitle} senior dans une entreprise innovante. Travail sur des projets stimulants avec des technologies modernes.`,
      salary: '55k-70k EUR',
      jobType: 'CDI',
      remote: true,
      source: 'LinkedIn',
      matchScore: 92,
      publishedAt: new Date().toISOString().split('T')[0]
    },
    {
      id: 'job-2',
      title: `Lead ${jobTitle}`,
      company: 'StartupVision',
      location: 'Lyon',
      description: `Leadership technique pour une startup en croissance. Équipe de 5 personnes à manager.`,
      salary: '60k-80k EUR',
      jobType: 'CDI',
      remote: true,
      source: 'Welcome to the Jungle',
      matchScore: 88,
      publishedAt: new Date(Date.now() - 86400000).toISOString().split('T')[0]
    },
    {
      id: 'job-3',
      title: `${jobTitle}`,
      company: 'FinanceTech',
      location: 'Bordeaux',
      description: 'Environnement fintech dynamique. Projets à fort impact business.',
      salary: '45k-60k EUR',
      jobType: 'CDI',
      remote: false,
      source: 'Indeed',
      matchScore: 85,
      publishedAt: new Date(Date.now() - 172800000).toISOString().split('T')[0]
    },
    {
      id: 'job-4',
      title: `${jobTitle} Cloud`,
      company: 'CloudScale',
      location: 'Remote France',
      description: '100% remote. Projets cloud innovants avec AWS/GCP.',
      salary: '50k-70k EUR',
      jobType: 'CDI',
      remote: true,
      source: 'LinkedIn',
      matchScore: 78,
      publishedAt: new Date(Date.now() - 259200000).toISOString().split('T')[0]
    }
  ];
}

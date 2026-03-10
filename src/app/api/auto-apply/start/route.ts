import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const groq = new Groq({ apiKey: GROQ_API_KEY });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action = 'apply', profile, skills, experiences, preferences, selectedJobs, maxApplications = 5 } = body;

  if (!profile && action === 'apply') {
    return NextResponse.json({ error: 'Profile is required for application' }, { status: 400 });
  }

  try {
    // MODE: SEARCH
    if (action === 'search') {
      let baseQuery = preferences?.keywords?.join(' ') || profile?.targetJobTitle || 'developer';
      let queryString = baseQuery;
      if (preferences?.locations?.length > 0) {
        queryString += ` in ${preferences.locations.join(', ')}`;
      }

      const params = new URLSearchParams({
        query: queryString,
        page: '1',
        num_pages: '1',
        country: 'fr',
        date_posted: 'week',
      });

      if (preferences?.remoteOnly) params.set('remote_jobs_only', 'true');

      const url = `https://${JSEARCH_HOST}/search?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': JSEARCH_HOST,
        },
      });

      if (!response.ok) throw new Error(`JSearch API returned ${response.status}`);
      const data = await response.json();

      return NextResponse.json({
        success: true,
        jobs: (data.data || []).map((job: any) => ({
          id: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          location: job.job_city || (job.job_is_remote ? 'Remote' : 'France'),
          description: job.job_description,
          url: job.job_apply_link,
          logo: job.employer_logo,
          postedAt: job.job_posted_at_datetime_utc,
        }))
      });
    }

    // MODE: APPLY (Generation of AI Cover Letters)
    if (action === 'apply') {
      if (!selectedJobs || selectedJobs.length === 0) {
        return NextResponse.json({ error: 'No jobs selected' }, { status: 400 });
      }

      const applications = await Promise.all(selectedJobs.map(async (job: any) => {
        // AI Tailored Cover Letter
        const prompt = `Tu es un expert en recrutement. Rédige une lettre de motivation percutante et personnalisée pour le poste suivant :
        
        POSTE : ${job.title}
        ENTREPRISE : ${job.company}
        DESCRIPTION DU POSTE : ${job.description?.substring(0, 1000)}...
        
        PROFIL DU CANDIDAT :
        - Nom : ${profile.firstName} ${profile.lastName}
        - Titre : ${profile.targetJobTitle}
        - Compétences : ${skills?.map((s: any) => s.name).join(', ')}
        - Résumé : ${profile.summary}
        
        RÈGLES :
        - Sois professionnel, enthousiaste et concis (maximum 300 mots).
        - Fais le lien entre les besoins du poste et les compétences du candidat.
        - En français.
        - Pas de blabla inutile, commence directement par Madame, Monsieur.`;

        let coverLetter = '';
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          });
          coverLetter = completion.choices[0]?.message?.content || '';
        } catch (e) {
          console.error('Groq Error, using fallback template');
          coverLetter = `Madame, Monsieur,\n\nPassionné par le secteur du développement, c'est avec un grand intérêt que je postule au poste de ${job.title} chez ${job.company}. Mon profil de ${profile.targetJobTitle} correspond aux attentes de votre équipe.\n\nCordialement,\n${profile.firstName} ${profile.lastName}`;
        }

        return {
          id: crypto.randomUUID(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: 'sent',
          coverLetter,
          sourceUrl: job.url,
          sentAt: new Date().toISOString()
        };
      }));

      return NextResponse.json({
        success: true,
        applications
      });
    }

  } catch (error: any) {
    console.error('Auto-Apply Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

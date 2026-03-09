import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_employment_type: string;
  job_is_remote: boolean;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}

function formatSalary(job: JSearchJob): string {
  if (job.job_min_salary && job.job_max_salary) {
    const currency = job.job_salary_currency || 'USD';
    const period = job.job_salary_period === 'YEAR' ? '/an' :
      job.job_salary_period === 'MONTH' ? '/mois' :
        job.job_salary_period === 'HOUR' ? '/h' : '';
    return `${Math.round(job.job_min_salary).toLocaleString()} - ${Math.round(job.job_max_salary).toLocaleString()} ${currency}${period}`;
  }
  if (job.job_min_salary) {
    return `À partir de ${Math.round(job.job_min_salary).toLocaleString()} ${job.job_salary_currency || 'USD'}`;
  }
  return 'Non spécifié';
}

function formatEmploymentType(type: string): string {
  const types: Record<string, string> = {
    'FULLTIME': 'CDI / Temps plein',
    'PARTTIME': 'Temps partiel',
    'CONTRACTOR': 'Freelance/Contract',
    'INTERN': 'Stage',
    'TEMPORARY': 'CDD / Temporaire',
  };
  return types[type] || type;
}

function formatLocation(job: JSearchJob): string {
  if (job.job_is_remote) return 'Remote';
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(', ') || 'Non spécifié';
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n');
  text = text.replace(/<(li)>/gi, '\n• ');
  text = text.replace(/<[^>]*>?/gm, '');
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function formatJobDescriptionToHTML(text: string): string {
  if (!text) return 'Description non disponible';

  // First, strip existing irregular HTML to have clean plain text
  const cleanText = stripHtml(text);
  const lines = cleanText.split('\n');
  const formattedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      formattedLines.push('<br />');
      continue;
    }

    const isBullet = /^[•\-\*]\s+/.test(line);
    const lowerLine = line.toLowerCase();
    const isMainTitle = /^(vos missions|votre profil|profil recherché|description du poste|mission|profil|compétences|prérequis|les plus|ce que nous offrons|pourquoi nous rejoindre|pourquoi nous rejoindre \?)\s*:?$/.test(lowerLine);
    // Short line ending with a colon or specific keywords
    const isSubTitle = !isMainTitle && line.length < 80 && (line.endsWith(':') || lowerLine === 'vie d\'équipe' || lowerLine === 'activité quotidienne' || lowerLine === 'gestion commerciale' || lowerLine === 'suivi administratif');

    if (isBullet) {
      if (!inList) {
        formattedLines.push('<ul>');
        inList = true;
      }
      // Bold important numbers and percentages (like "151,67 heures", "100%", "5 à 6 RDV")
      const boldedLine = line.replace(/^[•\-\*]\s+/, '').replace(/\b(\d+(?:,\d+)?\s*(?:€|euros|%|RDV|appels|heures|ans|jours))\b/gi, '<strong>$1</strong>');
      formattedLines.push(`<li>${boldedLine}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }

      if (isMainTitle) {
        formattedLines.push(`<h2>${line}</h2>`);
      } else if (isSubTitle) {
        formattedLines.push(`<h3>${line}</h3>`);
      } else {
        // Bold monetary amounts like "2100,00 euros" in paragraphs
        const boldedParagraph = line.replace(/\b(\d+(?:,\d+)?\s*(?:€|euros|%))\b/gi, '<strong>$1</strong>');
        formattedLines.push(`<p>${boldedParagraph}</p>`);
      }
    }
  }

  if (inList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('\n').replace(/(<br \/>\n*){2,}/g, '<br />');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, skills, filters } = body;

    // Build search query
    let baseQuery = 'developer';
    if (filters?.search) baseQuery = filters.search;
    else if (profile?.targetJobTitle) baseQuery = profile.targetJobTitle;
    else if (skills && skills.length > 0) baseQuery = skills[0].name;

    let queryString = baseQuery;

    if (filters?.location) {
      queryString += `, ${filters.location}`;
    }

    // Build JSearch API params
    const params = new URLSearchParams({
      query: queryString,
      page: '1',
      num_pages: '1',
      country: 'fr',
      language: 'fr',
    });

    if (filters?.radius && filters.radius !== '250') {
      params.set('radius', filters.radius);
    }

    // Add optional filters
    if (filters?.remote || profile?.remoteWork) {
      params.set('remote_jobs_only', 'true');
    }
    if (filters?.datePosted) {
      params.set('date_posted', filters.datePosted); // all, today, 3days, week, month
    }
    if (filters?.employmentType) {
      params.set('employment_types', filters.employmentType); // FULLTIME, PARTTIME, CONTRACTOR, INTERN
    }

    // Call JSearch API via RapidAPI
    const url = `https://${JSEARCH_HOST}/search?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': JSEARCH_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSearch API Error:', response.status, errorText);
      throw new Error(`JSearch API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let jobs: any[] = [];

    if (data?.data && data.data.length > 0) {
      jobs = data.data.slice(0, 10).map((job: JSearchJob) => {
        const plainDescription = stripHtml(job.job_description || '');

        return {
          id: job.job_id || String(Math.random()),
          title: job.job_title,
          company: job.employer_name,
          location: formatLocation(job),
          description: plainDescription.substring(0, 200) + (plainDescription.length > 200 ? '...' : ''),
          htmlDescription: formatJobDescriptionToHTML(job.job_description || ''),
          salary: formatSalary(job),
          jobType: formatEmploymentType(job.job_employment_type),
          remote: job.job_is_remote,
          source: 'JSearch (LinkedIn/Indeed/Glassdoor)',
          sourceUrl: job.job_apply_link,
          matchScore: calculateMatchScore(job, profile, skills),
          publishedAt: job.job_posted_at_datetime_utc
            ? job.job_posted_at_datetime_utc.split('T')[0]
            : new Date().toISOString().split('T')[0],
          // Extra data from JSearch
          employerLogo: job.employer_logo,
          highlights: job.job_highlights,
        };
      });
    }

    return NextResponse.json({
      jobs,
      searchedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Job Search Error (JSearch):', error);
    return NextResponse.json({
      jobs: [],
      error: error.message,
    }, { status: 500 });
  }
}

// Calculate a real match score based on profile/skills overlap
function calculateMatchScore(job: JSearchJob, profile: any, skills: any[]): number {
  let score = 50; // Base score

  const jobText = `${job.job_title} ${job.job_description}`.toLowerCase();

  // Check if target job title appears in job title
  if (profile?.targetJobTitle) {
    const targetWords = profile.targetJobTitle.toLowerCase().split(/\s+/);
    const titleMatches = targetWords.filter((w: string) =>
      job.job_title.toLowerCase().includes(w)
    ).length;
    score += Math.min(20, (titleMatches / targetWords.length) * 20);
  }

  // Check skills match
  if (skills && skills.length > 0) {
    const matchedSkills = skills.filter((s: any) =>
      jobText.includes(s.name.toLowerCase())
    ).length;
    score += Math.min(25, (matchedSkills / skills.length) * 25);
  }

  // Bonus for salary info
  if (job.job_min_salary) score += 3;

  // Bonus for remote if user wants remote
  if (profile?.remoteWork && job.job_is_remote) score += 5;

  return Math.min(99, Math.max(30, Math.round(score)));
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'home' | 'cv-builder' | 'cv-editor' | 'job-search' | 'dashboard' | 'pricing' | 'auto-apply' | 'import-cv';

// Subscription Plans
export type PlanType = 'starter' | 'pro' | 'elite';

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number;
  priceYearly: number;
  description: string;
  features: string[];
  limits: {
    applicationsPerWeek: number; // -1 = unlimited
    applicationsPerDay: number; // -1 = unlimited
    cvGeneration: number; // -1 = unlimited
    historyDays: number; // -1 = unlimited
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceYearly: 0,
    description: 'Pour découvrir notre plateforme',
    features: [
      '3 candidatures automatiques',
      'Génération de CV basique',
      'Accès limité aux templates',
      'Historique limité à 7 jours',
      'Support standard',
    ],
    limits: {
      applicationsPerWeek: 3,
      applicationsPerDay: 1,
      cvGeneration: 5,
      historyDays: 7,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceYearly: 95.90, // ~20% discount
    description: 'Notre offre la plus populaire',
    features: [
      '10 candidatures/semaine',
      'CV illimités optimisés ATS',
      'Lettres de motivation IA',
      'Planification automatique',
      'Dashboard complet',
      'Historique complet',
      'Support prioritaire',
      'Score de matching IA',
    ],
    limits: {
      applicationsPerWeek: 10,
      applicationsPerDay: 5,
      cvGeneration: -1,
      historyDays: -1,
    },
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 20,
    priceYearly: 192, // ~20% discount
    description: 'Pour les professionnels exigeants',
    features: [
      'Candidatures illimitées',
      'Priorité dans le matching',
      'Optimisation ATS avancée',
      'A/B testing lettres',
      'Analyse prédictive',
      'Suggestions de profil',
      'Multi-langue',
      'Alertes offres premium',
      'Support VIP dédié',
    ],
    limits: {
      applicationsPerWeek: -1,
      applicationsPerDay: 20,
      cvGeneration: -1,
      historyDays: -1,
    },
  },
];

export interface Subscription {
  plan: PlanType;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface Usage {
  applicationsThisWeek: number;
  applicationsToday: number;
  cvGenerated: number;
  weekStartDate: string;
  dayStartDate: string;
  totalApplications: number;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface Language {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native';
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CVTemplate {
  id: string;
  name: string;
  preview: string;
  primaryColor: string;
  layout: 'single' | 'double';
}

export const CV_TEMPLATES: CVTemplate[] = [
  { id: 'modern', name: 'Moderne', preview: '/templates/modern.png', primaryColor: '#1a365d', layout: 'single' },
  { id: 'elegant', name: 'Élégant', preview: '/templates/elegant.png', primaryColor: '#4a5568', layout: 'double' },
  { id: 'creative', name: 'Créatif', preview: '/templates/creative.png', primaryColor: '#8b5cf6', layout: 'double' },
  { id: 'minimal', name: 'Minimaliste', preview: '/templates/minimal.png', primaryColor: '#374151', layout: 'single' },
  { id: 'professional', name: 'Professionnel', preview: '/templates/professional.png', primaryColor: '#0f766e', layout: 'single' },
  { id: 'classic', name: 'Classique', preview: '/templates/classic.png', primaryColor: '#1e40af', layout: 'single' },
];

export const CV_COLORS = [
  { name: 'Bleu Marine', value: '#1a365d' },
  { name: 'Bleu Ciel', value: '#0284c7' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#db2777' },
  { name: 'Rouge', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Vert', value: '#16a34a' },
  { name: 'Turquoise', value: '#0d9488' },
  { name: 'Gris', value: '#374151' },
  { name: 'Noir', value: '#1f2937' },
];

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  linkedin: string;
  website: string;
  summary: string;
  targetJobTitle: string;
  targetLocation: string;
  targetSalary: string;
  jobType: 'full-time' | 'part-time' | 'freelance' | 'internship' | '';
  remoteWork: boolean;
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  htmlDescription?: string;
  salary: string;
  jobType: string;
  remote: boolean;
  source: string;
  sourceUrl: string;
  matchScore: number;
  publishedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'sent' | 'viewed' | 'replied' | 'rejected' | 'accepted';
  coverLetter: string;
  sourceUrl?: string;
  sentAt: string;
  appliedVia?: 'manual' | 'ai';
}

export interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  invoiceUrl?: string;
  description: string;
}

interface AppState {
  currentView: View;
  setCurrentView: (view: View) => void;

  // Profile
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;

  // Experiences
  experiences: Experience[];
  setExperiences: (exps: Experience[]) => void;
  addExperience: (exp: Experience) => void;
  updateExperience: (id: string, exp: Partial<Experience>) => void;
  removeExperience: (id: string) => void;

  // Educations
  educations: Education[];
  setEducations: (edus: Education[]) => void;
  addEducation: (edu: Education) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  // Certifications
  certifications: Certification[];
  setCertifications: (certs: Certification[]) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (id: string) => void;

  // Languages
  languages: Language[];
  setLanguages: (langs: Language[]) => void;
  addLanguage: (lang: Language) => void;
  removeLanguage: (id: string) => void;

  // Skills
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;

  // Job offers
  jobOffers: JobOffer[];
  setJobOffers: (offers: JobOffer[]) => void;

  // Applications
  applications: Application[];
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;

  // Generated CV
  generatedCV: string;
  setGeneratedCV: (cv: string) => void;
  cvScore: number;
  setCvScore: (score: number) => void;

  // CV Template Settings
  cvTemplate: string;
  cvPrimaryColor: string;
  setCvTemplate: (template: string) => void;
  setCvPrimaryColor: (color: string) => void;

  // Settings
  autoApply: boolean;
  setAutoApply: (value: boolean) => void;
  frequency: 'daily' | 'weekly' | 'custom';
  setFrequency: (value: 'daily' | 'weekly' | 'custom') => void;

  // Auto-Apply Job Preferences
  jobPreferences: {
    jobTypes: string[];
    locations: string[];
    minSalary: number | null;
    keywords: string[];
    excludeKeywords: string[];
    remoteOnly: boolean;
    maxApplicationsPerDay: number;
  };
  setJobPreferences: (prefs: Partial<AppState['jobPreferences']>) => void;

  // Auto-Apply Search & Selection
  searchingJobs: any[];
  setSearchingJobs: (jobs: any[]) => void;
  selectedJobIds: string[];
  setSelectedJobIds: (ids: string[]) => void;
  toggleJobSelection: (id: string) => void;

  // Imported CV File
  importedCVFile: {
    name: string;
    type: string;
    extension: string;
    size: number;
    dataUrl: string;
    uploadedAt: string;
  } | null;
  setImportedCVFile: (file: AppState['importedCVFile']) => void;
  clearImportedCVFile: () => void;

  // Subscription
  subscription: Subscription | null;
  setSubscription: (subscription: Subscription | null) => void;
  upgradePlan: (plan: PlanType) => void;
  cancelSubscription: () => void;

  // Usage & Quotas
  usage: Usage;
  incrementApplications: () => boolean; // Returns false if limit reached
  incrementCVGeneration: () => boolean;
  resetWeeklyUsage: () => void;
  canApply: () => boolean;
  canGenerateCV: () => boolean;
  getRemainingApplications: () => number;

  // Payment History
  paymentHistory: PaymentHistory[];
  addPayment: (payment: PaymentHistory) => void;
}

const getStartOfWeek = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),

      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'France',
        linkedin: '',
        website: '',
        summary: '',
        targetJobTitle: '',
        targetLocation: '',
        targetSalary: '',
        jobType: '',
        remoteWork: false,
      },
      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),

      experiences: [],
      setExperiences: (exps) => set({ experiences: exps }),
      addExperience: (exp) => set((state) => ({ experiences: [...state.experiences, exp] })),
      updateExperience: (id, exp) => set((state) => ({
        experiences: state.experiences.map((e) => e.id === id ? { ...e, ...exp } : e)
      })),
      removeExperience: (id) => set((state) => ({
        experiences: state.experiences.filter((e) => e.id !== id)
      })),

      educations: [],
      setEducations: (edus) => set({ educations: edus }),
      addEducation: (edu) => set((state) => ({ educations: [...state.educations, edu] })),
      updateEducation: (id, edu) => set((state) => ({
        educations: state.educations.map((e) => e.id === id ? { ...e, ...edu } : e)
      })),
      removeEducation: (id) => set((state) => ({
        educations: state.educations.filter((e) => e.id !== id)
      })),

      certifications: [],
      setCertifications: (certs) => set({ certifications: certs }),
      addCertification: (cert) => set((state) => ({ certifications: [...state.certifications, cert] })),
      removeCertification: (id) => set((state) => ({
        certifications: state.certifications.filter((c) => c.id !== id)
      })),

      languages: [],
      setLanguages: (langs) => set({ languages: langs }),
      addLanguage: (lang) => set((state) => ({ languages: [...state.languages, lang] })),
      removeLanguage: (id) => set((state) => ({
        languages: state.languages.filter((l) => l.id !== id)
      })),

      skills: [],
      setSkills: (skills) => set({ skills }),
      addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (id) => set((state) => ({
        skills: state.skills.filter((s) => s.id !== id)
      })),

      jobOffers: [],
      setJobOffers: (offers) => set({ jobOffers: offers }),

      applications: [],
      addApplication: (app) => set((state) => ({ applications: [...state.applications, app] })),
      updateApplicationStatus: (id, status) => set((state) => ({
        applications: state.applications.map((a) => a.id === id ? { ...a, status } : a)
      })),

      generatedCV: '',
      setGeneratedCV: (cv) => set({ generatedCV: cv }),
      cvScore: 0,
      setCvScore: (score) => set({ cvScore: score }),

      // CV Template Settings
      cvTemplate: 'modern',
      cvPrimaryColor: '#1a365d',
      setCvTemplate: (template) => set({ cvTemplate: template }),
      setCvPrimaryColor: (color) => set({ cvPrimaryColor: color }),

      autoApply: false,
      setAutoApply: (value) => set({ autoApply: value }),
      frequency: 'daily',
      setFrequency: (value) => set({ frequency: value }),

      // Job Preferences
      jobPreferences: {
        jobTypes: [],
        locations: [],
        minSalary: null,
        keywords: [],
        excludeKeywords: [],
        remoteOnly: false,
        maxApplicationsPerDay: 5,
      },
      setJobPreferences: (prefs) => set((state) => ({
        jobPreferences: { ...state.jobPreferences, ...prefs }
      })),

      searchingJobs: [],
      setSearchingJobs: (jobs) => set({ searchingJobs: jobs }),
      selectedJobIds: [],
      setSelectedJobIds: (ids) => set({ selectedJobIds: ids }),
      toggleJobSelection: (id) => set((state) => ({
        selectedJobIds: state.selectedJobIds.includes(id)
          ? state.selectedJobIds.filter(jid => jid !== id)
          : [...state.selectedJobIds, id]
      })),

      // Imported CV File
      importedCVFile: null,
      setImportedCVFile: (file) => set({ importedCVFile: file }),
      clearImportedCVFile: () => set({ importedCVFile: null }),

      // Subscription
      subscription: null,
      setSubscription: (subscription) => set({ subscription }),
      upgradePlan: (plan) => set((state) => ({
        subscription: {
          plan,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        },
        paymentHistory: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount: SUBSCRIPTION_PLANS.find(p => p.id === plan)?.price || 0,
            status: 'succeeded',
            description: `Abonnement ${plan}`,
          },
          ...state.paymentHistory,
        ],
      })),
      cancelSubscription: () => set((state) => state.subscription ? {
        subscription: {
          ...state.subscription,
          cancelAtPeriodEnd: true,
        }
      } : state),

      // Usage & Quotas
      usage: {
        applicationsThisWeek: 0,
        applicationsToday: 0,
        cvGenerated: 0,
        weekStartDate: getStartOfWeek(),
        dayStartDate: new Date().toISOString().split('T')[0],
        totalApplications: 0,
      },

      incrementApplications: () => {
        const state = get();
        if (!state.canApply()) return false;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentWeekStart = getStartOfWeek();

        set((s) => ({
          usage: {
            ...s.usage,
            applicationsThisWeek: (s.usage.weekStartDate === currentWeekStart ? s.usage.applicationsThisWeek : 0) + 1,
            applicationsToday: (s.usage.dayStartDate === todayStr ? s.usage.applicationsToday : 0) + 1,
            weekStartDate: currentWeekStart,
            dayStartDate: todayStr,
            totalApplications: s.usage.totalApplications + 1,
          }
        }));
        return true;
      },

      incrementCVGeneration: () => {
        const state = get();
        if (!state.canGenerateCV()) return false;

        set((s) => ({
          usage: {
            ...s.usage,
            cvGenerated: s.usage.cvGenerated + 1,
          }
        }));
        return true;
      },

      resetWeeklyUsage: () => set((s) => ({
        usage: {
          ...s.usage,
          applicationsThisWeek: 0,
          weekStartDate: getStartOfWeek(),
        }
      })),

      canApply: () => {
        const state = get();
        const plan = state.subscription?.plan || 'starter';
        const planLimits = SUBSCRIPTION_PLANS.find(p => p.id === plan)?.limits;
        if (!planLimits) return false;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentWeekStart = getStartOfWeek();

        // Check if day has changed
        if (state.usage.dayStartDate !== todayStr) {
          set((s) => ({
            usage: { ...s.usage, applicationsToday: 0, dayStartDate: todayStr }
          }));
        }

        // Check if week has changed
        if (state.usage.weekStartDate !== currentWeekStart) {
          set((s) => ({
            usage: { ...s.usage, applicationsThisWeek: 0, weekStartDate: currentWeekStart }
          }));
        }

        // Daily limit check
        if (planLimits.applicationsPerDay !== -1 && state.usage.applicationsToday >= planLimits.applicationsPerDay) {
          return false;
        }

        // Weekly limit check
        if (planLimits.applicationsPerWeek !== -1 && state.usage.applicationsThisWeek >= planLimits.applicationsPerWeek) {
          return false;
        }

        return true;
      },

      canGenerateCV: () => {
        const state = get();
        const plan = state.subscription?.plan || 'starter';
        const planLimits = SUBSCRIPTION_PLANS.find(p => p.id === plan)?.limits;
        if (!planLimits) return false;

        // Unlimited
        if (planLimits.cvGeneration === -1) return true;

        return state.usage.cvGenerated < planLimits.cvGeneration;
      },

      getRemainingApplications: () => {
        const state = get();
        const plan = state.subscription?.plan || 'starter';
        const planLimits = SUBSCRIPTION_PLANS.find(p => p.id === plan)?.limits;
        if (!planLimits) return 0;

        const dayRemaining = planLimits.applicationsPerDay === -1 ? Infinity : Math.max(0, planLimits.applicationsPerDay - state.usage.applicationsToday);
        const weekRemaining = planLimits.applicationsPerWeek === -1 ? Infinity : Math.max(0, planLimits.applicationsPerWeek - state.usage.applicationsThisWeek);

        const remaining = Math.min(dayRemaining, weekRemaining);
        return remaining === Infinity ? -1 : remaining;
      },

      // Payment History
      paymentHistory: [],
      addPayment: (payment) => set((state) => ({
        paymentHistory: [payment, ...state.paymentHistory]
      })),
    }),
    {
      name: 'cvjobscrap-storage',
      partialize: (state) => ({
        profile: state.profile,
        experiences: state.experiences,
        educations: state.educations,
        certifications: state.certifications,
        languages: state.languages,
        skills: state.skills,
        applications: state.applications,
        autoApply: state.autoApply,
        frequency: state.frequency,
        jobPreferences: state.jobPreferences,
        importedCVFile: state.importedCVFile,
        subscription: state.subscription,
        usage: state.usage,
        paymentHistory: state.paymentHistory,
        cvTemplate: state.cvTemplate,
        cvPrimaryColor: state.cvPrimaryColor,
        cvScore: state.cvScore,
      }),
    }
  )
);

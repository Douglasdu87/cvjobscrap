'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, type View, type Profile, type Skill, type Language, SUBSCRIPTION_PLANS, CV_TEMPLATES, CV_COLORS } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText, Search, Briefcase, Home, User, Plus, Trash2,
  Download, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp,
  Building2, MapPin, Calendar, DollarSign, Sparkles, Zap,
  Target, BarChart3, Settings, Bell, Star, Globe, Copy,
  Award, BookOpen, Languages, Wrench,
  Menu, X, ArrowRight, Check, RefreshCw, CreditCard,
  Crown, Rocket, Shield, Palette, Layout, Paintbrush,
  Upload, FileUp, Play, Pause, Filter, Wand2, ExternalLink,
  Mail, Phone
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession, signOut } from 'next-auth/react';
import { LoginModal, RegisterModal } from '@/components/AuthModals';
import NextImage from 'next/image';

// ============================================
// PAYMENT DIALOG COMPONENT (defined first to avoid hoisting issues)
// ============================================
function PaymentDialog({ plan, children }: { plan: typeof SUBSCRIPTION_PLANS[0]; children: React.ReactNode }) {
  const { upgradePlan, setCurrentView, profile, setProfile } = useAppStore();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async () => {
    if (plan.id === 'starter') {
      upgradePlan('starter');
      setOpen(false);
      setCurrentView('cv-builder');
      toast({ title: 'Bienvenue !', description: 'Votre compte Starter est activé.' });
      return;
    }

    setIsProcessing(true);

    // Show toast immediately to indicate processing
    toast({ title: 'Connexion à Stripe...', description: 'Veuillez patienter quelques secondes.' });

    try {
      // Call Stripe checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          billingCycle,
          email: profile.email || 'user@example.com',
          name: `${profile.firstName} ${profile.lastName}`.trim() || 'User',
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout in the same window
        toast({ title: 'Redirection vers Stripe...', description: 'Vous allez être redirigé vers la page de paiement.' });
        window.location.href = data.url;
        return;
      }

      if (data.success) {
        // Free plan or direct activation
        upgradePlan(plan.id);
        setOpen(false);
        setCurrentView('cv-builder');
        if (data.demo) {
          toast({
            title: 'Mode Démo',
            description: `${plan.name} activé. Configurez Stripe dans .env pour les vrais paiements.`
          });
        } else {
          toast({ title: 'Abonnement activé !', description: `Votre plan ${plan.name} est maintenant actif.` });
        }
        return;
      }

      throw new Error(data.error || 'Erreur lors du paiement');

    } catch (error: any) {
      // Fallback to simulated payment for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      upgradePlan(plan.id);
      setOpen(false);
      setCurrentView('cv-builder');
      toast({
        title: 'Paiement simulé',
        description: `Mode démo: Abonnement ${plan.name} activé. Configurez Stripe pour les vrais paiements.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const finalPrice = billingCycle === 'yearly' ? plan.priceYearly / 12 : plan.price;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plan.id === 'starter' && <Sparkles className="h-5 w-5" />}
            {plan.id === 'pro' && <Crown className="h-5 w-5" />}
            {plan.id === 'elite' && <Rocket className="h-5 w-5" />}
            {plan.name}
          </DialogTitle>
          <DialogDescription>{plan.description}</DialogDescription>
        </DialogHeader>

        {plan.price > 0 && (
          <div className="space-y-4">
            <div className="flex rounded-lg border p-1">
              <Button variant={billingCycle === 'monthly' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setBillingCycle('monthly')}>Mensuel</Button>
              <Button variant={billingCycle === 'yearly' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setBillingCycle('yearly')}>Annuel (-20%)</Button>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{plan.name}</span>
                <span className="font-bold">{finalPrice.toFixed(2)}€/mois</span>
              </div>
              {billingCycle === 'yearly' && <div className="text-sm text-accent mt-1">Économisez {((plan.price * 12) - plan.priceYearly).toFixed(2)}€/an</div>}
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {plan.features.slice(0, 5).map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Annuler</Button>
          <Button className="flex-1 gradient-primary text-white" onClick={handleSubscribe} disabled={isProcessing}>
            {isProcessing ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Traitement...</> : plan.price === 0 ? 'Activer gratuitement' : <><CreditCard className="h-4 w-4 mr-2" />Payer {billingCycle === 'yearly' ? plan.priceYearly : plan.price}€</>}
          </Button>
        </div>

        {plan.price > 0 && (
          <div className="flex items-center justify-center gap-2 pt-3 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Paiement sécurisé par Stripe</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// JOB DETAILS DIALOG COMPONENT
// ============================================
function JobDetailsDialog({ job, onApply, children }: { job: any; onApply: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <DialogTitle className="text-2xl">{job.title}</DialogTitle>
              <DialogDescription className="text-lg mt-1 font-medium text-primary">
                {job.company}
              </DialogDescription>
            </div>
            {job.companyLogo && (
              <img src={job.companyLogo} alt={job.company} className="h-12 w-12 rounded object-contain bg-white" />
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 my-4">
          {job.location && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{job.location}</Badge>}
          {job.remote && <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" />Remote</Badge>}
          {job.salary && job.salary !== 'Non spécifié' && (
            <Badge variant="secondary" className="gap-1"><DollarSign className="h-3 w-3" />{job.salary}</Badge>
          )}
          <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />{job.jobType}</Badge>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg my-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Match IA pour votre profil</h4>
            <div className="text-xl font-bold text-accent">{job.matchScore}%</div>
          </div>
          <Progress value={job.matchScore} className="h-2" />
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
          <h3 className="text-lg font-semibold mb-3">Description du poste</h3>
          {job.htmlDescription ? (
            <div
              className="mt-4 space-y-4 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: job.htmlDescription }}
            />
          ) : (
            <p className="text-muted-foreground">{job.description}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4 sticky bottom-0 bg-background/95 backdrop-blur py-4">
          <Button
            className="flex-1 gradient-primary text-white"
            onClick={() => {
              setOpen(false);
              onApply();
            }}
          >
            <Send className="h-4 w-4 mr-2" /> Postuler maintenant
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              Voir sur {job.source} <Eye className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// APPLY WIZARD - Multi-step application flow (Indeed Smart Apply style)
// ============================================
function ApplyWizard({ job, onClose, onSubmit }: { job: any; onClose: () => void; onSubmit: (data: any) => void }) {
  const { profile } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    city: profile?.targetLocation || '',
    postalCode: '',
    cvFileName: '',
    cvUploaded: false,
    coverLetter: '',
    coverLetterMode: 'ai' as 'ai' | 'manual' | 'none',
    isGeneratingCL: false,
  });

  const steps = [
    { title: 'Vos informations', progress: 25 },
    { title: 'Votre CV', progress: 50 },
    { title: 'Lettre de motivation', progress: 75 },
    { title: 'Vérification', progress: 100 },
  ];

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (currentStep === 0) return formData.firstName && formData.lastName && formData.email;
    if (currentStep === 1) return true; // CV is optional
    if (currentStep === 2) return true; // Cover letter is optional
    return true;
  };

  const handleGenerateCoverLetter = async () => {
    updateField('isGeneratingCL', true);
    try {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, profile, skills: [], jobOffer: job, generateOnly: true }),
      });
      const data = await response.json();
      updateField('coverLetter', data.coverLetter || `Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de ${job.title} au sein de ${job.company}.\n\nFort(e) d'une expérience significative, je suis convaincu(e) que mes compétences correspondent à vos attentes. Je serais ravi(e) d'échanger avec vous pour discuter de cette opportunité.\n\nCordialement,\n${formData.firstName} ${formData.lastName}`);
    } catch {
      updateField('coverLetter', `Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de ${job.title} au sein de ${job.company}.\n\nFort(e) d'une expérience significative, je suis convaincu(e) que mes compétences correspondent à vos attentes. Je serais ravi(e) d'échanger avec vous pour discuter de cette opportunité.\n\nCordialement,\n${formData.firstName} ${formData.lastName}`);
    } finally {
      updateField('isGeneratingCL', false);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f3f2f1]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <span className="font-semibold text-gray-900 text-sm hidden sm:block">{job.title}</span>
          </div>
          <button onClick={onClose} className="text-[#2557a7] font-medium text-sm hover:underline">
            Enregistrer et fermer
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left - Form */}
          <div className="bg-white rounded-lg border shadow-sm p-8 mb-6 lg:mb-0">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                {currentStep > 0 && (
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="text-gray-500 hover:text-gray-800">
                    <ArrowRight className="h-5 w-5 rotate-180" />
                  </button>
                )}
                <span className="text-sm text-gray-500 ml-auto">{steps[currentStep].progress} %</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${steps[currentStep].progress}%`, backgroundColor: '#2557a7' }}
                />
              </div>
            </div>

            {/* Step 1: Contact Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez vos informations</h2>
                  <p className="text-sm text-gray-500">
                    En précisant vos informations, vous aidez les employeurs à vous contacter rapidement.
                    Les champs obligatoires sont marqués d'un astérisque (<span className="text-red-500">*</span>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Prénom <span className="text-red-500">*</span></Label>
                    <Input
                      className="mt-1.5 h-11"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Nom <span className="text-red-500">*</span></Label>
                    <Input
                      className="mt-1.5 h-11"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Email <span className="text-red-500">*</span></Label>
                  <Input
                    className="mt-1.5 h-11"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Téléphone</Label>
                  <Input
                    className="mt-1.5 h-11"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Ville</Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Paris, Lyon, Remote..."
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Code postal</Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="75001"
                  />
                </div>
              </div>
            )}

            {/* Step 2: CV */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ajoutez un CV pour l'employeur</h2>
                  <p className="text-sm text-gray-500">Un CV augmente vos chances d'être contacté par le recruteur.</p>
                </div>

                {formData.cvUploaded ? (
                  <div className="border-2 border-[#2557a7] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2.5 rounded-lg">
                        <FileText className="h-6 w-6 text-[#2557a7]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{formData.cvFileName}</p>
                        <p className="text-xs text-gray-500">Importé le {new Date().toLocaleDateString('fr-FR')}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-[#2557a7]" />
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#2557a7] hover:bg-blue-50/30 transition-all">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#2557a7]">Télécharger un CV</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — Max 5 Mo</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateField('cvFileName', file.name);
                          updateField('cvUploaded', true);
                        }
                      }}
                    />
                  </label>
                )}

                {formData.cvUploaded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#2557a7]"
                    onClick={() => { updateField('cvUploaded', false); updateField('cvFileName', ''); }}
                  >
                    Changer de CV
                  </Button>
                )}
              </div>
            )}

            {/* Step 3: Cover Letter */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Lettre de motivation</h2>
                  <p className="text-sm text-gray-500">Personnalisez votre candidature avec une lettre adaptée au poste.</p>
                </div>

                <div className="space-y-3">
                  {(['ai', 'manual', 'none'] as const).map((mode) => (
                    <div
                      key={mode}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${formData.coverLetterMode === mode ? 'border-[#2557a7] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => updateField('coverLetterMode', mode)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.coverLetterMode === mode ? 'border-[#2557a7]' : 'border-gray-300'
                          }`}>
                          {formData.coverLetterMode === mode && <div className="w-2.5 h-2.5 rounded-full bg-[#2557a7]" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {mode === 'ai' && '✨ Générer avec l\'IA'}
                            {mode === 'manual' && '✍️ Écrire manuellement'}
                            {mode === 'none' && '⏭️ Passer cette étape'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mode === 'ai' && 'Laissez notre IA rédiger une lettre adaptée au poste'}
                            {mode === 'manual' && 'Rédigez votre propre lettre de motivation'}
                            {mode === 'none' && 'Ne pas inclure de lettre de motivation'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.coverLetterMode === 'ai' && (
                  <div className="space-y-3">
                    {!formData.coverLetter ? (
                      <Button
                        className="w-full h-12 text-base font-semibold rounded-lg"
                        style={{ backgroundColor: '#2557a7', color: 'white' }}
                        onClick={handleGenerateCoverLetter}
                        disabled={formData.isGeneratingCL}
                      >
                        {formData.isGeneratingCL ? (
                          <><RefreshCw className="h-5 w-5 animate-spin mr-2" /> Génération en cours...</>
                        ) : (
                          <><Sparkles className="h-5 w-5 mr-2" /> Générer ma lettre</>
                        )}
                      </Button>
                    ) : (
                      <Textarea
                        className="min-h-[200px] text-sm"
                        value={formData.coverLetter}
                        onChange={(e) => updateField('coverLetter', e.target.value)}
                      />
                    )}
                  </div>
                )}

                {formData.coverLetterMode === 'manual' && (
                  <Textarea
                    className="min-h-[200px] text-sm"
                    placeholder="Rédigez votre lettre de motivation..."
                    value={formData.coverLetter}
                    onChange={(e) => updateField('coverLetter', e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre candidature</h2>
                  <p className="text-sm text-gray-500">Assurez-vous que toutes les informations sont correctes avant d'envoyer.</p>
                </div>

                {/* Contact summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User className="h-4 w-4" /> Informations de contact</h3>
                    <button onClick={() => setCurrentStep(0)} className="text-[#2557a7] text-sm font-medium hover:underline">Modifier</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Nom :</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="font-medium text-gray-800">Email :</span> {formData.email}</p>
                    <p><span className="font-medium text-gray-800">Tél :</span> {formData.phone || 'Non renseigné'}</p>
                    <p><span className="font-medium text-gray-800">Ville :</span> {formData.city || 'Non renseignée'}</p>
                  </div>
                </div>

                {/* CV summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4" /> CV</h3>
                    <button onClick={() => setCurrentStep(1)} className="text-[#2557a7] text-sm font-medium hover:underline">Modifier</button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.cvUploaded ? (
                      <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> {formData.cvFileName}</span>
                    ) : (
                      <span className="text-gray-400">Aucun CV ajouté</span>
                    )}
                  </p>
                </div>

                {/* Cover letter summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileUp className="h-4 w-4" /> Lettre de motivation</h3>
                    <button onClick={() => setCurrentStep(2)} className="text-[#2557a7] text-sm font-medium hover:underline">Modifier</button>
                  </div>
                  {formData.coverLetter ? (
                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{formData.coverLetter}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Pas de lettre de motivation</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8">
              {currentStep < 3 ? (
                <Button
                  className="w-full h-12 text-base font-semibold rounded-lg"
                  style={{ backgroundColor: '#2557a7', color: 'white' }}
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canContinue()}
                >
                  Continuer
                </Button>
              ) : (
                <Button
                  className="w-full h-14 text-lg font-semibold rounded-lg"
                  style={{ backgroundColor: '#2557a7', color: 'white' }}
                  onClick={handleSubmit}
                >
                  <Send className="h-5 w-5 mr-2" /> Envoyer votre candidature
                </Button>
              )}
            </div>
          </div>

          {/* Right - Job Summary (Desktop) */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{job.company} — {job.location}</p>

              {job.htmlDescription ? (
                <div className="text-sm text-gray-600 line-clamp-6" dangerouslySetInnerHTML={{ __html: job.htmlDescription }} />
              ) : (
                <p className="text-sm text-gray-600 line-clamp-6">{job.description}</p>
              )}

              <button className="text-[#2557a7] text-sm font-medium mt-3 hover:underline flex items-center gap-1">
                Afficher la description complète du poste
                <ArrowRight className="h-3.5 w-3.5 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ============================================
// CV MODAL PREVIEW - Full screen 1:1 scale
// ============================================
function CVModalPreview({ cvDataJson, primaryColor, template, children }: { cvDataJson: string, primaryColor: string, template: string, children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild id="open-cv-modal">{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] w-fit h-[95vh] p-0 border-none bg-zinc-900 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-bold">Aperçu Haute Fidélité (Échelle 1:1)</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-zinc-100/50">
          <div className="shadow-2xl bg-white origin-top" style={{ width: '210mm', minHeight: '297mm' }}>
            <CVPreviewA4 cvDataJson={cvDataJson} primaryColor={primaryColor} template={template} isModal={true} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  const { currentView, setCurrentView } = useAppStore();
  const { data: session } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { setProfile, setExperiences, setEducations, setSkills, setLanguages, setCertifications } = useAppStore();

  // Synchronize store with database when session changes
  useEffect(() => {
    const syncWithDB = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            if (data.profile) setProfile(data.profile);
            if (data.experiences) setExperiences(data.experiences);
            if (data.educations) setEducations(data.educations);
            if (data.skills) setSkills(data.skills);
            if (data.languages) setLanguages(data.languages);
            if (data.certifications) setCertifications(data.certifications);
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      }
    };
    syncWithDB();
  }, [session, setProfile, setExperiences, setEducations, setSkills, setLanguages, setCertifications]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        onLoginClick={() => setIsLoginModalOpen(true)}
        onRegisterClick={() => setIsRegisterModalOpen(true)}
      />
      <main className="flex-1">
        {currentView === 'home' && <HomePage />}
        {currentView === 'cv-builder' && <CVBuilderPage />}
        {currentView === 'job-search' && <JobSearchPage />}
        {currentView === 'dashboard' && <DashboardPage />}
        {currentView === 'pricing' && <PricingPage />}
        {currentView === 'auto-apply' && <AutoApplyPage />}
        {currentView === 'import-cv' && <ImportCVPage />}
      </main>
      <Footer />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}


// ============================================
// HEADER COMPONENT
// ============================================
function Header({ onLoginClick, onRegisterClick }: { onLoginClick: () => void, onRegisterClick: () => void }) {
  const { currentView, setCurrentView, subscription, getRemainingApplications } = useAppStore();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const remaining = getRemainingApplications();

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Accueil', icon: <Home className="h-4 w-4" /> },
    { id: 'cv-builder', label: 'Créer CV', icon: <FileText className="h-4 w-4" /> },
    { id: 'import-cv', label: 'Importer', icon: <Upload className="h-4 w-4" /> },
    { id: 'job-search', label: 'Emplois', icon: <Search className="h-4 w-4" /> },
    { id: 'auto-apply', label: 'Auto-Apply', icon: <Zap className="h-4 w-4" /> },
    { id: 'pricing', label: 'Tarifs', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <NextImage src="/logo.png" alt="CVJobScrap" width={40} height={40} className="h-10 w-auto" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CVJobScrap</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button key={item.id} variant={currentView === item.id ? 'default' : 'ghost'} size="sm" onClick={() => setCurrentView(item.id)} className="gap-2">
              {item.icon}{item.label}
            </Button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {subscription && subscription.plan !== 'starter' && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" /> {subscription.plan.toUpperCase()}
              {remaining >= 0 && <span className="ml-1">• {remaining} candidatures</span>}
            </Badge>
          )}
          
          <Button variant="ghost" size="sm"><Bell className="h-4 w-4" /></Button>
          
          {session ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setCurrentView('dashboard')} className="gradient-primary text-white gap-2">
                <User className="h-4 w-4" />
                {session.user?.name || 'Mon Compte'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <XCircle className="h-4 w-4 text-zinc-400 hover:text-red-500 transition-colors" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onLoginClick}>Se connecter</Button>
              <Button size="sm" onClick={onRegisterClick} className="gradient-primary text-white">S'inscrire</Button>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Button key={item.id} variant={currentView === item.id ? 'default' : 'ghost'} size="sm" onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }} className="gap-2 justify-start">
                {item.icon}{item.label}
              </Button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

// ============================================
// HOME PAGE
// ============================================
function HomePage() {
  const { setCurrentView } = useAppStore();

  const features = [
    { icon: <Sparkles className="h-6 w-6" />, title: 'CV Optimisé ATS', description: 'Passez les filtres automatiques des recruteurs.' },
    { icon: <Search className="h-6 w-6" />, title: 'Recherche Intelligente', description: 'Trouvez les meilleures opportunités avec l\'IA.' },
    { icon: <Send className="h-6 w-6" />, title: 'Candidature Automatisée', description: 'Lettres personnalisées générées par IA.' },
    { icon: <BarChart3 className="h-6 w-6" />, title: 'Suivi en Temps Réel', description: 'Visualisez vos statistiques et progressez.' },
  ];

  const stats = [
    { value: '15,000+', label: 'CV générés' },
    { value: '98%', label: 'Satisfaction' },
    { value: '50,000+', label: 'Candidatures' },
    { value: '3x', label: 'Plus de réponses' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 px-4 py-1"><Zap className="h-3 w-3 mr-1" /> Propulsé par l'IA</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Votre carrière, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">optimisée par l'IA</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                Générez des CV professionnels, trouvez les meilleures opportunités et automatisez vos candidatures.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="gradient-primary text-white gap-2 h-12 px-8" onClick={() => setCurrentView('cv-builder')}>
                  <Sparkles className="h-5 w-5" />Créer mon CV gratuit
                </Button>
                <Button size="lg" variant="outline" className="gap-2 h-12 px-8" onClick={() => setCurrentView('pricing')}>
                  <CreditCard className="h-5 w-5" />Voir les tarifs
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative animate-float">
                <div className="bg-card rounded-2xl shadow-2xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
                    <div><div className="font-semibold">CV Généré</div><div className="text-sm text-muted-foreground">Optimisé ATS</div></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-primary/20 rounded w-full" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Node.js</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4" /><span className="text-sm font-medium">Score: 95/100</span></div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2"><Send className="h-5 w-5" /><span className="font-medium">Candidature envoyée!</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Notre plateforme combine les dernières technologies d'IA.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{f.icon}</div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent><CardDescription>{f.description}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground">Trois étapes simples</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Créez votre profil', desc: 'Remplissez vos informations.' },
              { step: '02', title: 'Générez votre CV', desc: 'CV optimisé ATS automatique.' },
              { step: '03', title: 'Postulez', desc: 'Candidatures automatiques personnalisées.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-primary/10 absolute -top-4 left-0">{item.step}</div>
                <div className="relative z-10 pt-8">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="gradient-primary text-white overflow-hidden relative">
            <CardContent className="p-12 text-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à décrocher l'emploi de vos rêves ?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Rejoignez des milliers de professionnels.</p>
              <Button size="lg" variant="secondary" className="gap-2 h-12 px-8" onClick={() => setCurrentView('cv-builder')}>
                Commencer gratuitement<ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// ============================================
// PRICING PAGE
// ============================================
function PricingPage() {
  const { setCurrentView, subscription } = useAppStore();

  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4"><CreditCard className="h-3 w-3 mr-1" /> Tarifs</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choisissez votre plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement, évoluez selon vos besoins. Paiement sécurisé via Stripe.
          </p>
        </div>

        {subscription && (
          <Card className="max-w-md mx-auto mb-12 border-accent">
            <CardContent className="p-6 text-center">
              <Crown className="h-8 w-8 mx-auto mb-2 text-accent" />
              <p className="font-semibold">Plan actuel: {subscription.plan.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">Renouvellement: {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary text-white"><Star className="h-3 w-3 mr-1" /> Populaire</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {plan.id === 'starter' && <Sparkles className="h-6 w-6 text-primary" />}
                  {plan.id === 'pro' && <Crown className="h-6 w-6 text-primary" />}
                  {plan.id === 'elite' && <Rocket className="h-6 w-6 text-primary" />}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price === 0 ? 'Gratuit' : `${plan.price}€`}</span>
                  {plan.price > 0 && <span className="text-muted-foreground">/mois</span>}
                </div>
                {plan.price > 0 && <p className="text-sm text-muted-foreground">ou {plan.priceYearly}€/an (-20%)</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {subscription?.plan === plan.id ? (
                  <Button className="w-full mt-4" variant="outline" disabled>Plan actuel</Button>
                ) : (
                  <PaymentDialog plan={plan}>
                    <Button className={`w-full mt-4 ${plan.popular ? 'gradient-primary text-white' : ''}`} variant={plan.id === 'starter' ? 'outline' : 'default'}>
                      {plan.id === 'starter' ? 'Commencer gratuitement' : `Choisir ${plan.name}`}
                    </Button>
                  </PaymentDialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => setCurrentView('home')}>← Retour à l'accueil</Button>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Questions fréquentes</h3>
          <div className="space-y-4">
            {[
              { q: 'Puis-je annuler à tout moment ?', r: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord.' },
              { q: 'Comment fonctionne l\'essai gratuit ?', r: 'L\'offre Starter est gratuite à vie. Pour Pro, profitez de 7 jours d\'essai sans engagement.' },
              { q: 'Les paiements sont-ils sécurisés ?', r: 'Oui, tous les paiements sont traités par Stripe, le leader mondial des paiements en ligne.' },
              { q: 'Puis-je changer de plan ?', r: 'Absolument ! Vous pouvez upgrader ou downgrader à tout moment depuis votre compte.' },
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.r}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// A4 CV PREVIEW COMPONENT
// ============================================
function CVPreviewA4({ cvDataJson, primaryColor, template, isModal = false }: { cvDataJson: string, primaryColor: string, template: string, isModal?: boolean }) {
  const [autoScale, setAutoScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  let parsedData: any = {};
  try {
    parsedData = JSON.parse(cvDataJson);
  } catch (e) {
    // We still call hooks above, so it's safe to return here
    return <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">{cvDataJson}</div>;
  }

  const profile = parsedData.profile || {};
  const experiences = parsedData.experiences || [];
  const educations = parsedData.educations || [];
  const skills = parsedData.skills || [];
  const languages = parsedData.languages || [];
  const interests = parsedData.interests || [];
  const summary = parsedData.summary || profile?.summary || "";
  const header = parsedData.header || {};

  const isDoubleColumn = template === 'modern' || template === 'elegant' || template === 'creative';
  const baseSize = (isModal ? 1 : 0.42) * autoScale;

  return (
    <div
      ref={containerRef}
      className={`bg-white overflow-hidden ${isModal ? '' : 'w-full shadow-md'}`}
      style={{
        width: isModal ? '210mm' : '100%',
        height: isModal ? '297mm' : 'auto',
        aspectRatio: '210/297',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div ref={contentRef} className="h-full w-full text-zinc-800" style={{ fontSize: `${10 * baseSize}pt` }}>
        {isDoubleColumn ? (
          <div className="flex h-full">
            {/* Sidebar per Image 2 */}
            <div className="w-[33%] h-full flex flex-col pt-[12mm] px-[8mm] gap-[12mm]" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
              <div className="w-[40mm] h-[40mm] mx-auto rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-inner">
                <User className="opacity-20" style={{ width: `${18 * baseSize}mm`, height: `${18 * baseSize}mm` }} />
              </div>

              {[
                { label: 'PROFIL', content: summary, type: 'text' },
                { label: 'CONTACT', content: [
                  { icon: <MapPin className="opacity-70" />, text: profile.city || header.location },
                  { icon: <Mail className="opacity-70" />, text: profile.email || header.email },
                  { icon: <Phone className="opacity-70" />, text: profile.phone || header.phone },
                  { icon: <Shield className="opacity-70" />, text: "Permis B" }
                ], type: 'contact' },
                { label: 'INTÉRÊTS', content: interests, type: 'list' }
              ].map((sec, i) => (
                <div key={i} className="space-y-[4mm]">
                  <h3 className="font-extrabold tracking-[2.5px] text-center border-b border-white/20 pb-[2mm] uppercase" style={{ fontSize: `${11 * baseSize}pt` }}>{sec.label}</h3>
                  {sec.type === 'text' && <p className="text-center leading-[1.6] opacity-90 font-medium" style={{ fontSize: `${9 * baseSize}pt` }}>{sec.content as string}</p>}
                  {sec.type === 'contact' && (
                    <div className="space-y-[4mm]">
                      {(sec.content as any[]).map((c, j) => c.text && (
                        <div key={j} className="flex items-center gap-[4mm] opacity-90" style={{ fontSize: `${8.5 * baseSize}pt` }}>
                          <span className="shrink-0 flex items-center justify-center bg-white/10 rounded-md" style={{ width: `${7 * baseSize}mm`, height: `${7 * baseSize}mm` }}>
                            {c.icon}
                          </span>
                          <span className="truncate font-medium">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sec.type === 'list' && (sec.content as string[]).length > 0 && (
                    <div className="space-y-[2.5mm] opacity-90 font-medium" style={{ fontSize: `${8.5 * baseSize}pt` }}>
                      {(sec.content as string[]).map((item, j) => (
                        <div key={j} className="flex items-center gap-[3mm]">
                          <div className="h-[1.2mm] w-[1.2mm] bg-white rounded-full shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col pt-[15mm] pl-[4mm] pr-[16mm] gap-[12mm] overflow-hidden">
              <div className="border-l-8 pl-[6mm]" style={{ borderColor: primaryColor }}>
                <h1 className="font-black tracking-tighter leading-[0.9] text-zinc-900" style={{ fontSize: `${44 * baseSize}pt` }}>
                  {profile.firstName || 'DOUGLAS'}<br/>
                  <span className="text-zinc-400 uppercase">{profile.lastName || 'NTOUTOU'}</span>
                </h1>
                <h2 className="font-black text-zinc-300 tracking-[6px] mt-[5mm] uppercase" style={{ fontSize: `${15 * baseSize}pt` }}>
                  {header.targetJobTitle || profile.targetJobTitle || 'DÉVELOPPEUR'}
                </h2>
              </div>

              {[
                { title: 'FORMATION', items: educations, type: 'edu' },
                { title: 'EXPÉRIENCE', items: experiences, type: 'exp' },
                { title: 'COMPÉTENCES', items: skills, type: 'skills' }
              ].map((section, idx) => section.items.length > 0 && (
                <div key={idx} className="space-y-[5mm]">
                  <div className="flex items-center gap-[4mm]">
                    <div className="w-[14mm] h-[1.5mm]" style={{ backgroundColor: primaryColor }} />
                    <h3 className="font-extrabold tracking-[4px] text-zinc-800 uppercase" style={{ fontSize: `${12.5 * baseSize}pt` }}>{section.title}</h3>
                    <div className="flex-1 h-[0.3mm] bg-zinc-100" />
                  </div>

                  <div className="space-y-[7mm]">
                    {section.type === 'edu' && section.items.map((item: any, i: number) => (
                      <div key={i} className="flex gap-[8mm]">
                        <div className="w-[38mm] shrink-0 font-extrabold text-zinc-400 whitespace-nowrap pt-[1mm]" style={{ fontSize: `${9.5 * baseSize}pt` }}>{item.period}</div>
                        <div className="flex-1">
                          <div className="font-black text-zinc-800 uppercase leading-tight" style={{ fontSize: `${11 * baseSize}pt` }}>{item.degree}</div>
                          <div className="font-bold text-zinc-400 italic mt-[1mm]" style={{ fontSize: `${10 * baseSize}pt` }}>{item.school}</div>
                        </div>
                      </div>
                    ))}

                    {section.type === 'exp' && section.items.map((item: any, i: number) => (
                      <div key={i} className="flex gap-[8mm]">
                        <div className="w-[38mm] shrink-0 space-y-[2mm] pt-[1mm]">
                          <div className="font-black text-zinc-900 tracking-tight" style={{ fontSize: `${10.5 * baseSize}pt` }}>{item.period}</div>
                          <div className="font-black text-zinc-300 uppercase tracking-widest" style={{ fontSize: `${8.5 * baseSize}pt` }}>{item.company}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-zinc-800 uppercase leading-tight" style={{ fontSize: `${11.5 * baseSize}pt` }}>{item.position}</div>
                          <ul className="mt-[3mm] space-y-[2mm]">
                            {(item.achievements || [item.description]).map((ach: string, j: number) => (
                              <li key={j} className="text-zinc-600 flex gap-[3mm] leading-[1.5] font-medium" style={{ fontSize: `${9 * baseSize}pt` }}>
                                <span className="text-zinc-200 mt-[1mm]">•</span> <span>{ach}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}

                    {section.type === 'skills' && (
                      <div className="grid grid-cols-2 gap-[10mm]">
                        <div className="space-y-[4mm] min-w-0">
                          <h4 className="font-black text-zinc-800 tracking-widest border-b-2 pb-[1.5mm] uppercase" style={{ fontSize: `${10 * baseSize}pt`, borderColor: `${primaryColor}20` }}>LANGUES</h4>
                          <div className="space-y-[2mm]">
                            {languages.map((lang: any, i: number) => (
                              <div key={i} className="flex flex-col gap-0.5 border-b border-zinc-100 last:border-0 pb-1" style={{ fontSize: `${9 * baseSize}pt` }}>
                                <span className="font-black text-zinc-800 break-words uppercase">{lang.name}</span>
                                <span className="text-zinc-500 italic font-medium uppercase tracking-wider" style={{ fontSize: `${7.5 * baseSize}pt` }}>{lang.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-[4mm] min-w-0">
                          <h4 className="font-black text-zinc-800 tracking-widest border-b-2 pb-[1.5mm] uppercase" style={{ fontSize: `${10 * baseSize}pt`, borderColor: `${primaryColor}20` }}>LOGICIELS</h4>
                          <div className="flex flex-wrap gap-x-[3mm] gap-y-[2mm]">
                            {skills.map((skill: any, i: number) => (
                              <div key={i} className="flex items-center gap-[1.5mm] text-zinc-600 font-bold" style={{ fontSize: `${9 * baseSize}pt` }}>
                                <div className="h-[1.5mm] w-[1.5mm] rounded-full shrink-0" style={{ backgroundColor: primaryColor }} /> <span className="break-words">{skill.name || skill}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-auto pt-[6mm] border-t border-zinc-100 flex justify-between uppercase tracking-[3px] font-black text-zinc-200" style={{ fontSize: `${7 * baseSize}pt` }}>
                <span>CVJobScrap Premium Template</span>
                <span>Page 01 // 01</span>
              </div>
            </div>
          </div>
        ) : (
          /* Single Column Layout (Minimal/Professional/Classic) */
          <div className="w-full p-16 flex flex-col gap-12 text-gray-800">
            {/* Minimal/Professional Header */}
            <div className="mb-12">
              <div className="flex justify-between items-baseline mb-4">
                <h1 className="text-5xl font-bold tracking-tight text-gray-900">
                  {header?.fullName || 'Votre Nom'}
                </h1>
                <div className="text-right text-gray-500 space-y-1">
                  {header?.email && <div className="text-sm">{header.email}</div>}
                  {header?.phone && <div className="text-sm">{header.phone}</div>}
                  {header?.location && <div className="text-sm">{header.location}</div>}
                </div>
              </div>
              <div className="h-0.5 w-full mt-2" style={{ backgroundColor: primaryColor }}></div>
              <h2 className="text-2xl mt-4 font-medium text-gray-500 uppercase tracking-widest">
                {header?.targetJobTitle || 'Titre du poste'}
              </h2>
            </div>

            {/* Summary */}
            {summary && (
              <section className="space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Profil</h3>
                <p className="text-gray-600 leading-relaxed text-lg italic border-l-4 pl-6" style={{ borderColor: primaryColor }}>
                  {summary}
                </p>
              </section>
            )}

            {/* Experience */}
            {experiences && experiences.length > 0 && (
              <section className="space-y-8">
                <h3 className="text-xl font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Expérience Professionnelle</h3>
                <div className="space-y-10">
                  {experiences.map((exp: any, i: number) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span className="text-xl">{exp.position}</span>
                        <span className="text-gray-400 font-medium">{(exp.period || `${exp.startDate} - ${exp.endDate}`).replace(/ - $/, '').replace(/^ - /, '')}</span>
                      </div>
                      {exp.company && !exp.position.toLowerCase().includes(exp.company.toLowerCase()) && (
                        <div className="text-lg font-semibold" style={{ color: primaryColor }}>{exp.company}</div>
                      )}
                      <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        {exp.achievements?.map((ach: string, j: number) => (
                          <li key={j} className="leading-relaxed">{ach}</li>
                        )) || <li className="leading-relaxed">{exp.description}</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {educations && educations.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Formation</h3>
                <div className="space-y-4">
                  {educations.map((edu: any, i: number) => (
                    <div key={i} className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div className="flex-1 pr-4">
                        <span className="font-bold text-gray-900 block">{edu.degree}</span>
                        {edu.school && !edu.degree.toLowerCase().includes(edu.school.toLowerCase()) && (
                          <span className="text-gray-500 text-sm italic">{edu.school}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400 font-medium whitespace-nowrap">{(edu.period || `${edu.startDate} - ${edu.endDate}`).replace(/ - $/, '').replace(/^ - /, '')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bottom Row: Skills & Interests */}
            <div className="grid grid-cols-2 gap-12 mt-auto">
              {skills && skills.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Compétences</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 rounded text-gray-700 text-sm border-b-2" style={{ borderColor: primaryColor }}>
                        {skill.name || skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {interests && interests.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Centres d'intérêt</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {interests.join(' • ')}
                  </p>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CV MODAL FULLSCREEN
// ============================================
function CVModalFullscreen({ cvDataJson, primaryColor, template, onClose, onDownload, isExporting }: { cvDataJson: string, primaryColor: string, template: string, onClose: () => void, onDownload: () => void, isExporting: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-md flex flex-col items-center overflow-y-auto pt-8 pb-20 px-4">
      {/* Modal Toolbar */}
      <div className="flex w-full max-w-[210mm] justify-between items-center mb-8 sticky top-0 z-10 bg-zinc-950/80 p-4 rounded-xl backdrop-blur-md border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-white font-bold leading-none">Aperçu Haute Définition</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Echelle 1:1 - Format A4 Standard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onDownload} 
            disabled={isExporting}
            className="gap-2 bg-white text-black hover:bg-zinc-200 font-bold"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Export...' : 'Télécharger PDF'}
          </Button>
          
          <Separator orientation="vertical" className="h-8 bg-white/10 mx-2" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* CV Content Container */}
      <div className="bg-white shadow-[0_0_80px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden shrink-0 transition-all duration-500 transform scale-[1.02] hover:scale-100 origin-top">
        <CVPreviewA4 cvDataJson={cvDataJson} primaryColor={primaryColor} template={template} isModal={true} />
      </div>

      <div className="mt-12 text-zinc-500 text-xs text-center max-w-sm opacity-50 font-medium">
        Ce document est optimisé pour les systèmes ATS et le format A4 international.
      </div>
    </div>
  );
}

// ============================================
// CV BUILDER PAGE
// ============================================
function CVBuilderPage() {
  const {
    profile, setProfile,
    experiences, addExperience, removeExperience,
    educations, addEducation, removeEducation,
    certifications, addCertification, removeCertification,
    languages, addLanguage, removeLanguage,
    skills, addSkill, removeSkill,
    generatedCV, setGeneratedCV,
    cvScore, setCvScore,
    canGenerateCV, incrementCVGeneration,
    cvTemplate, setCvTemplate,
    cvPrimaryColor, setCvPrimaryColor
  } = useAppStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const handleGenerateCV = async () => {
    if (!canGenerateCV()) {
      toast({ title: 'Limite atteinte', description: 'Passez à un plan supérieur pour générer plus de CV.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      // Call the real API
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, experiences, educations, certifications, languages, skills }),
      });

      if (!response.ok) throw new Error('Erreur lors de la génération');

      const data = await response.json();
      incrementCVGeneration();
      setGeneratedCV(data.cv);
      setCvScore(data.score);
      toast({ title: 'CV généré !', description: `Score ATS: ${data.score}/100` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de générer le CV.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/cv/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile, experiences, educations, certifications, languages, skills,
          template: cvTemplate,
          primaryColor: cvPrimaryColor,
          generatedCV
        }),
      });

      const data = await response.json();

      if (data.pdf) {
        // Create download link
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = data.filename || 'CV.pdf';
        link.click();
        toast({ title: 'PDF téléchargé !', description: 'Votre CV est prêt.' });
      } else if (data.cv) {
        // Fallback: copy text to clipboard
        await navigator.clipboard.writeText(data.cv);
        toast({ title: 'CV copié !', description: 'Le PDF n\'est pas disponible, le texte a été copié.' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'exporter le PDF.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Créer votre CV</h1>
            <p className="text-muted-foreground">Remplissez vos informations pour générer un CV optimisé ATS</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-1">
              <TabsTrigger value="personal" className="text-xs sm:text-sm">Personnel</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs sm:text-sm">Expériences</TabsTrigger>
              <TabsTrigger value="education" className="text-xs sm:text-sm">Formation</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs sm:text-sm">Compétences</TabsTrigger>
              <TabsTrigger value="languages" className="text-xs sm:text-sm">Langues</TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs sm:text-sm">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Informations personnelles</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Prénom</Label><Input value={profile.firstName} onChange={(e) => setProfile({ firstName: e.target.value })} placeholder="Jean" /></div>
                    <div className="space-y-2"><Label>Nom</Label><Input value={profile.lastName} onChange={(e) => setProfile({ lastName: e.target.value })} placeholder="Dupont" /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} placeholder="jean@email.com" /></div>
                    <div className="space-y-2"><Label>Téléphone</Label><Input value={profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} placeholder="+33 6 12 34 56 78" /></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Ville</Label><Input value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} placeholder="Paris" /></div>
                    <div className="space-y-2"><Label>Code postal</Label><Input value={profile.postalCode} onChange={(e) => setProfile({ postalCode: e.target.value })} placeholder="75001" /></div>
                    <div className="space-y-2"><Label>Pays</Label><Input value={profile.country} onChange={(e) => setProfile({ country: e.target.value })} placeholder="France" /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>LinkedIn</Label><Input value={profile.linkedin} onChange={(e) => setProfile({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
                    <div className="space-y-2"><Label>Site web</Label><Input value={profile.website} onChange={(e) => setProfile({ website: e.target.value })} placeholder="https://..." /></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Objectif professionnel</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Résumé</Label><Textarea value={profile.summary} onChange={(e) => setProfile({ summary: e.target.value })} placeholder="Décrivez votre parcours..." rows={4} /></div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Poste recherché</Label><Input value={profile.targetJobTitle} onChange={(e) => setProfile({ targetJobTitle: e.target.value })} placeholder="Développeur Full Stack" /></div>
                    <div className="space-y-2"><Label>Localisation</Label><Input value={profile.targetLocation} onChange={(e) => setProfile({ targetLocation: e.target.value })} placeholder="Paris, Remote" /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={profile.remoteWork} onCheckedChange={(checked) => setProfile({ remoteWork: checked })} />
                    <Label>Ouvert au télétravail</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Expériences</CardTitle>
                  <AddItemDialog type="experience" onAdd={(data) => addExperience({ id: crypto.randomUUID(), ...data } as any)} />
                </CardHeader>
                <CardContent>
                  {experiences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune expérience</p></div>
                  ) : (
                    <div className="space-y-4">
                      {experiences.map((exp) => (
                        <Card key={exp.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{exp.position}</h4>
                                <p className="text-muted-foreground">{exp.company}</p>
                                <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Formation</CardTitle>
                  <AddItemDialog type="education" onAdd={(data) => addEducation({ id: crypto.randomUUID(), ...data } as any)} />
                </CardHeader>
                <CardContent>
                  {educations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune formation</p></div>
                  ) : (
                    <div className="space-y-4">
                      {educations.map((edu) => (
                        <Card key={edu.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{edu.degree}</h4>
                                <p className="text-muted-foreground">{edu.school}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Compétences</CardTitle>
                  <AddItemDialog type="skill" onAdd={(data) => addSkill({ id: crypto.randomUUID(), ...data } as any)} />
                </CardHeader>
                <CardContent>
                  {skills.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune compétence</p></div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeSkill(skill.id)}>
                          {skill.name}<X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="languages" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5" />Langues</CardTitle>
                  <AddItemDialog type="language" onAdd={(data) => addLanguage({ id: crypto.randomUUID(), ...data } as any)} />
                </CardHeader>
                <CardContent>
                  {languages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Languages className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune langue</p></div>
                  ) : (
                    <div className="space-y-2">
                      {languages.map((lang) => (
                        <div key={lang.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div><span className="font-medium">{lang.name}</span><Badge variant="outline" className="ml-2">{lang.level}</Badge></div>
                          <Button variant="ghost" size="sm" onClick={() => removeLanguage(lang.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Certifications</CardTitle>
                  <AddItemDialog type="certification" onAdd={(data) => addCertification({ id: crypto.randomUUID(), ...data } as any)} />
                </CardHeader>
                <CardContent>
                  {certifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Award className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune certification</p></div>
                  ) : (
                    <div className="space-y-4">
                      {certifications.map((cert) => (
                        <Card key={cert.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{cert.name}</h4>
                                <p className="text-muted-foreground">{cert.issuer}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeCertification(cert.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="gradient-primary text-white gap-2" onClick={handleGenerateCV} disabled={isGenerating}>
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" />Génération...</> : <><Sparkles className="h-5 w-5" />Générer mon CV</>}
            </Button>
          </div>
        </div>

        <div className="lg:w-96">
          <div className="sticky top-24 space-y-4">
            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Modèle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {CV_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCvTemplate(t.id)}
                      className={`relative rounded-lg border-2 p-2 transition-all ${cvTemplate === t.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <div
                        className="aspect-[3/4] rounded bg-gradient-to-br from-gray-100 to-gray-200 mb-1"
                        style={{
                          background: t.id === 'creative'
                            ? `linear-gradient(135deg, ${t.primaryColor}20 0%, ${t.primaryColor}40 100%)`
                            : `linear-gradient(180deg, ${t.primaryColor}30 0%, transparent 40%)`
                        }}
                      >
                        <div className="h-full flex flex-col">
                          <div className="h-1/4" style={{ backgroundColor: t.id !== 'minimal' ? t.primaryColor : 'transparent' }} />
                          <div className="flex-1 p-1">
                            <div className="h-1 w-3/4 bg-gray-300 rounded mb-1" />
                            <div className="h-0.5 w-1/2 bg-gray-200 rounded mb-2" />
                            <div className="space-y-0.5">
                              <div className="h-0.5 w-full bg-gray-200 rounded" />
                              <div className="h-0.5 w-2/3 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center truncate">{t.name}</p>
                      {cvTemplate === t.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" />
                  Couleur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CV_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCvPrimaryColor(c.value)}
                      className={`w-8 h-8 rounded-full transition-all ${cvPrimaryColor === c.value
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {cvPrimaryColor === c.value && (
                        <Check className="h-4 w-4 mx-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CV Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg">Aperçu</CardTitle>
                {generatedCV && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowFullPreview(true)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generatedCV ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="gradient-primary text-white">Score ATS: {cvScore}/100</Badge>
                    </div>

                    <div className="relative group cursor-zoom-in" onClick={() => setShowFullPreview(true)}>
                      <CVPreviewA4 cvDataJson={generatedCV} primaryColor={cvPrimaryColor} template={cvTemplate} isModal={false} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center rounded-lg border border-zinc-200">
                        <div className="bg-white/90 shadow-lg px-4 py-2 rounded-full flex items-center gap-2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all font-bold text-xs text-primary">
                          <Eye className="h-3.5 w-3.5" /> Agrandir l'aperçu
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button className="w-full gap-2 gradient-primary text-white" onClick={handleDownloadPDF} disabled={isExporting}>
                        {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isExporting ? 'Export en cours...' : 'Télécharger PDF'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 border-2 border-dashed rounded-xl">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Votre CV apparaîtra ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {showFullPreview && generatedCV && (
        <CVModalFullscreen 
          cvDataJson={generatedCV} 
          primaryColor={cvPrimaryColor} 
          template={cvTemplate} 
          onClose={() => setShowFullPreview(false)} 
          onDownload={handleDownloadPDF}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}

// ============================================
// ADD ITEM DIALOG
// ============================================
function AddItemDialog({ type, onAdd }: { type: string; onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fields: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
    experience: [
      { key: 'company', label: 'Entreprise', placeholder: 'Nom' },
      { key: 'position', label: 'Poste', placeholder: 'Titre' },
      { key: 'startDate', label: 'Début', placeholder: '', type: 'month' },
      { key: 'endDate', label: 'Fin', placeholder: '', type: 'month' },
    ],
    education: [
      { key: 'school', label: 'École', placeholder: 'Nom' },
      { key: 'degree', label: 'Diplôme', placeholder: 'Master...' },
      { key: 'startDate', label: 'Début', placeholder: '', type: 'month' },
      { key: 'endDate', label: 'Fin', placeholder: '', type: 'month' },
    ],
    skill: [
      { key: 'name', label: 'Compétence', placeholder: 'JavaScript...' },
    ],
    language: [
      { key: 'name', label: 'Langue', placeholder: 'Anglais...' },
    ],
    certification: [
      { key: 'name', label: 'Nom', placeholder: 'AWS Certified...' },
      { key: 'issuer', label: 'Organisme', placeholder: 'Amazon...' },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ajouter</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {fields[type]?.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input
                type={f.type || 'text'}
                value={form[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          {type === 'language' && (
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={form.level || ''} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="fluent">Courant</SelectItem>
                  <SelectItem value="native">Natif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={() => { onAdd(form); setForm({}); setOpen(false); }} className="w-full">Ajouter</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// JOB SEARCH PAGE
// ============================================
function JobSearchPage() {
  const { jobOffers, setJobOffers, canApply, incrementApplications, addApplication, profile, skills } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState(profile?.targetLocation || '');
  const [searchRadius, setSearchRadius] = useState('50');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applyingJob, setApplyingJob] = useState<any | null>(null);

  // Sync profile location initially
  useEffect(() => {
    if (profile?.targetLocation && !searchLocation) {
      setSearchLocation(profile.targetLocation);
    }
  }, [profile?.targetLocation]);

  const mockJobs = [
    { id: '1', title: 'Développeur Full Stack', company: 'TechCorp', location: 'Paris', description: 'React, Node.js, AWS', salary: '55k-70k', jobType: 'CDI', remote: true, matchScore: 92, source: 'LinkedIn', sourceUrl: '', publishedAt: '2024-01-15' },
    { id: '2', title: 'Lead Developer', company: 'StartupVision', location: 'Lyon', description: 'Lead tech, architecture', salary: '60k-80k', jobType: 'CDI', remote: true, matchScore: 88, source: 'Welcome', sourceUrl: '', publishedAt: '2024-01-14' },
    { id: '3', title: 'Backend Engineer', company: 'FinanceTech', location: 'Bordeaux', description: 'Node.js, PostgreSQL', salary: '45k-60k', jobType: 'CDI', remote: false, matchScore: 85, source: 'Indeed', sourceUrl: '', publishedAt: '2024-01-13' },
    { id: '4', title: 'DevOps Engineer', company: 'CloudScale', location: 'Remote', description: 'AWS, Kubernetes, Terraform', salary: '50k-70k', jobType: 'CDI', remote: true, matchScore: 78, source: 'LinkedIn', sourceUrl: '', publishedAt: '2024-01-12' },
  ];

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, skills, filters: { search: searchQuery, location: searchLocation, radius: searchRadius } }),
      });
      const data = await response.json();
      const jobs = data.jobs || [];
      setJobOffers(jobs);
      if (jobs.length > 0) setSelectedJob(jobs[0]);
      else setSelectedJob(null);
    } catch {
      setJobOffers([]);
      setSelectedJob(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobOffers.length === 0 && !isLoading) handleSearch();
  }, []);

  const handleApply = (job: typeof mockJobs[0]) => {
    if (!canApply()) {
      toast({ title: 'Limite atteinte', description: 'Passez à un plan supérieur.', variant: 'destructive' });
      return;
    }
    setApplyingJob(job);
  };

  const handleWizardSubmit = async (formData: any) => {
    const job = applyingJob;
    if (!job) return;
    setApplyingJob(null);
    try {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, profile, skills, jobOffer: job }),
      });
      const data = await response.json();
      incrementApplications();
      addApplication({
        id: data.applicationId || crypto.randomUUID(),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        status: 'sent',
        coverLetter: formData.coverLetter || data.coverLetter || '',
        sentAt: new Date().toISOString()
      });
      toast({ title: '🎉 Candidature envoyée !', description: `Votre candidature pour ${job.title} chez ${job.company} a été envoyée avec succès.` });
    } catch {
      incrementApplications();
      addApplication({ id: crypto.randomUUID(), jobId: job.id, jobTitle: job.title, company: job.company, status: 'sent', coverLetter: formData.coverLetter || '', sentAt: new Date().toISOString() });
      toast({ title: '🎉 Candidature envoyée !', description: `Votre candidature pour ${job.title} a été envoyée.` });
    }
  };

  return (
    <>
      <div className="bg-[#f3f2f1] min-h-screen -mt-0">
        {/* Barre de recherche style Indeed */}
        <div className="bg-white border-b shadow-sm py-5">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white rounded-xl border shadow-md p-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Intitulé de poste, mots-clés"
                  className="pl-10 h-12 border-0 shadow-none text-base focus-visible:ring-0 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Separator orientation="vertical" className="hidden sm:block h-12 my-auto" />
              <div className="flex-1 flex items-center relative pr-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Lieu (ex: Paris, Remote)"
                    className="pl-10 h-12 border-0 shadow-none text-base focus-visible:ring-0 bg-transparent"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Separator orientation="vertical" className="h-8 hidden sm:block mx-1" />
                <Select value={searchRadius} onValueChange={setSearchRadius}>
                  <SelectTrigger className="w-[110px] h-10 border-0 shadow-none focus:ring-0 text-gray-600 bg-transparent hover:bg-gray-50 shrink-0">
                    <SelectValue placeholder="Rayon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">+ 10 km</SelectItem>
                    <SelectItem value="25">+ 25 km</SelectItem>
                    <SelectItem value="50">+ 50 km</SelectItem>
                    <SelectItem value="100">+ 100 km</SelectItem>
                    <SelectItem value="250">Partout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="h-12 px-8 text-base font-semibold rounded-lg shrink-0"
                style={{ backgroundColor: '#2557a7', color: 'white' }}
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Rechercher'}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 pt-6">
          {/* Compteur de résultats */}
          {jobOffers.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Emplois <strong>{searchQuery || 'recommandés'}</strong> — {jobOffers.length} résultat{jobOffers.length > 1 ? 's' : ''}
            </div>
          )}

          <div className="lg:grid lg:grid-cols-[420px_1fr] gap-4 items-start">
            {/* Colonne Liste (Gauche) */}
            <div className="space-y-2 lg:h-[calc(100vh-10rem)] lg:overflow-y-auto pr-1 pb-20">
              {jobOffers.length === 0 && !isLoading && (
                <div className="text-center py-16 bg-white rounded-lg border">
                  <Search className="h-14 w-14 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune offre trouvée</h3>
                  <p className="text-gray-500 text-sm">Essayez avec d'autres mots-clés ou une autre localisation.</p>
                </div>
              )}
              {jobOffers.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md ${selectedJob?.id === job.id
                    ? 'border-[#2557a7] shadow-md'
                    : 'border-transparent hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <h3 className="font-semibold text-base text-[#2557a7] mb-1 line-clamp-2">{job.title}</h3>
                  <p className="text-sm font-medium text-gray-900 mb-1">{job.company}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location || 'Remote'}
                    {job.remote && <span className="ml-1">• Télétravail</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.jobType && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded">{job.jobType}</span>
                    )}
                    {job.salary && job.salary !== 'Non spécifié' && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded">{job.salary}</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Zap className="h-3 w-3" />
                      <span>Candidature simplifiée</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(job.publishedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Fallback Mobile */}
                  <div className="lg:hidden mt-3 pt-3 border-t">
                    <JobDetailsDialog job={job} onApply={() => handleApply(job)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Voir les détails
                      </Button>
                    </JobDetailsDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Colonne Détails (Droite) - Desktop uniquement */}
            <div className="hidden lg:block lg:h-[calc(100vh-10rem)]">
              {selectedJob ? (
                <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-8">
                    {/* En-tête du poste */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h1>
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={selectedJob.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2557a7] font-medium hover:underline flex items-center gap-1"
                      >
                        {selectedJob.company} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="text-sm text-gray-600 mb-6 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedJob.location || 'Remote'}
                      {selectedJob.remote && <span>• Télétravail</span>}
                    </div>

                    {/* Bouton Postuler */}
                    <div className="flex items-center gap-3 mb-8">
                      <Button
                        className="px-8 py-3 h-auto text-base font-semibold rounded-lg"
                        style={{ backgroundColor: '#2557a7', color: 'white' }}
                        onClick={() => handleApply(selectedJob)}
                      >
                        Postuler maintenant
                      </Button>
                    </div>

                    <Separator className="mb-8" />

                    {/* Section "Détails de l'emploi" - style Indeed */}
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Détails de l'emploi</h2>

                      {selectedJob.salary && selectedJob.salary !== 'Non spécifié' && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-gray-500" />
                            <span className="font-semibold text-sm text-gray-700">Salaire</span>
                          </div>
                          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded ml-7">{selectedJob.salary}</span>
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-5 w-5 text-gray-500" />
                          <span className="font-semibold text-sm text-gray-700">Type de poste</span>
                        </div>
                        <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded ml-7">{selectedJob.jobType || 'CDI'}</span>
                      </div>
                    </div>

                    <Separator className="mb-8" />

                    {/* Section "Lieu" - style Indeed */}
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Lieu</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        {selectedJob.location || 'Remote'}
                        {selectedJob.remote && <span>• Télétravail</span>}
                      </div>
                    </div>

                    <Separator className="mb-8" />

                    {/* Compatibilité IA */}
                    <div className="flex items-center gap-4 mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1 text-[#2557a7] flex items-center gap-1">
                          <Sparkles className="h-4 w-4" /> Compatibilité IA avec votre profil
                        </h4>
                        <Progress value={selectedJob.matchScore} className="h-2 mt-2" />
                      </div>
                      <div className="text-3xl font-bold text-[#2557a7] pl-4 border-l border-blue-200">{selectedJob.matchScore}%</div>
                    </div>

                    <Separator className="mb-8" />

                    {/* Description complète du poste */}
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Description complète du poste</h2>
                      {selectedJob.htmlDescription ? (
                        <div
                          className="prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-5 prose-ul:marker:text-[#e85d04] prose-h2:text-2xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-sm prose-h3:font-bold prose-h3:text-gray-800 prose-h3:mt-6 prose-h3:mb-2 prose-p:my-2"
                          dangerouslySetInnerHTML={{ __html: selectedJob.htmlDescription }}
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Footer fixe */}
                  <div className="p-4 bg-white border-t flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                    <Button
                      className="flex-1 py-3 h-auto text-base font-semibold rounded-lg"
                      style={{ backgroundColor: '#2557a7', color: 'white' }}
                      onClick={() => handleApply(selectedJob)}
                    >
                      <Send className="h-5 w-5 mr-2" /> Postuler maintenant
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border h-full flex items-center justify-center">
                  <div className="text-center p-8 text-gray-400">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-medium mb-2 text-gray-600">Aucune offre sélectionnée</h3>
                    <p>Cliquez sur une offre dans la liste pour voir les détails ici.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Wizard */}
      {
        applyingJob && (
          <ApplyWizard
            job={applyingJob}
            onClose={() => setApplyingJob(null)}
            onSubmit={handleWizardSubmit}
          />
        )
      }
    </>
  );
}

// ============================================
// DASHBOARD PAGE
// ============================================
function DashboardPage() {
  const { data: session } = useSession();
  const { applications, subscription, profile, cvScore, getRemainingApplications, cancelSubscription, setCurrentView, updateApplicationStatus } = useAppStore();
  const planName = subscription?.plan?.toUpperCase() || 'STARTER';
  const remaining = getRemainingApplications();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Calculate real stats
  const total = applications.length;
  const views = applications.filter(a => ['viewed', 'replied', 'accepted', 'rejected'].includes(a.status)).length;
  const interviews = applications.filter(a => ['replied', 'accepted'].includes(a.status)).length;
  const responseRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  const stats = { 
    total, 
    responseRate, 
    views, 
    interviews 
  };

  // Profile completion calculation
  const profileFields = [
    profile.firstName, profile.lastName, profile.email, profile.phone, 
    profile.city, profile.summary, profile.targetJobTitle
  ];
  const completedFields = profileFields.filter(f => !!f).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const displayApps = applications;

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
    sent: { label: 'Envoyée', icon: Send, color: 'bg-blue-500' },
    viewed: { label: 'Vue', icon: Eye, color: 'bg-purple-500' },
    replied: { label: 'Réponse', icon: CheckCircle, color: 'bg-green-500' },
    rejected: { label: 'Refusée', icon: XCircle, color: 'bg-red-500' },
    accepted: { label: 'Acceptée', icon: CheckCircle, color: 'bg-emerald-500' },
  };

  const handleBillingPortal = async () => {
    if (!subscription?.stripeCustomerId) {
      toast({ title: 'Non disponible', description: 'Gérez votre abonnement depuis la page Tarifs.', variant: 'destructive' });
      return;
    }

    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le portail de facturation.', variant: 'destructive' });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Suivez vos candidatures</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Send className="h-5 w-5 text-primary" /></div><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Candidatures</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-accent" /></div><div><div className="text-2xl font-bold">{stats.responseRate}%</div><div className="text-sm text-muted-foreground">Réponses</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Eye className="h-5 w-5 text-purple-500" /></div><div><div className="text-2xl font-bold">{stats.views}</div><div className="text-sm text-muted-foreground">Vues</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-green-500" /></div><div><div className="text-2xl font-bold">{stats.interviews}</div><div className="text-sm text-muted-foreground">Entretiens</div></div></div></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Applications */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Candidatures récentes</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {displayApps.length > 0 ? (
                  displayApps.map((app) => {
                    const s = statusConfig[app.status] || statusConfig.pending;
                    const Icon = s.icon;
                    const isAI = app.appliedVia === 'ai';
                    
                    return (
                      <div key={app.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/50 transition-all shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.color} shadow-[0_0_8px] shadow-current`} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">{app.jobTitle}</span>
                              {isAI && (
                                <Badge variant="secondary" className="h-5 text-[10px] gap-1 bg-primary/10 text-primary border-primary/20 shrink-0">
                                  <Zap className="h-2.5 w-2.5" /> AGENT IA
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {app.company}
                              </div>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {app.sentAt ? new Date(app.sentAt).toLocaleDateString('fr-FR') : ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                          {app.coverLetter && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 shrink-0">
                                  <FileText className="h-3.5 w-3.5" /> Voir Lettre
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Lettre personnalisée par l'IA
                                  </DialogTitle>
                                  <DialogDescription className="font-bold text-gray-900">
                                    {app.jobTitle} @ {app.company}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="flex-1 mt-4 p-6 rounded-xl bg-muted/30 border-2 border-dashed border-muted-foreground/20 font-serif text-sm leading-relaxed whitespace-pre-wrap">
                                  {app.coverLetter}
                                </ScrollArea>
                                <div className="flex justify-end gap-3 mt-6">
                                  <Button variant="outline" onClick={async () => {
                                    await navigator.clipboard.writeText(app.coverLetter);
                                    toast({ title: 'Copié !', description: 'La lettre est dans votre presse-papier.' });
                                  }} className="gap-2">
                                    <Copy className="h-4 w-4" /> Copier le texte
                                  </Button>
                                  <DialogTrigger asChild>
                                    <Button className="gradient-primary text-white">Fermer</Button>
                                  </DialogTrigger>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {app.sourceUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild 
                              className={`h-8 text-xs gap-2 shrink-0 border-primary/20 hover:bg-primary/5 ${app.status === 'pending' ? 'bg-primary/10 border-primary animate-pulse' : ''}`}
                              onClick={() => {
                                if (app.status === 'pending') {
                                  updateApplicationStatus(app.id, 'sent');
                                  toast({ title: 'Statut mis à jour', description: 'Candidature marquée comme envoyée.' });
                                }
                              }}
                            >
                              <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" /> {app.status === 'pending' ? 'Finaliser Envoi' : 'Revoir l\'offre'}
                              </a>
                            </Button>
                          )}

                          <Badge 
                            variant={app.status === 'sent' ? 'default' : 'outline'} 
                            className={`h-8 gap-1.5 px-3 shrink-0 ${app.status === 'sent' && isAI ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {isAI && app.status === 'sent' ? 'Action Agent IA' : (app.sourceUrl && app.status === 'pending' ? 'À Finaliser' : s.label)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                    <p>Aucune candidature pour le moment.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Account Management & Subscription */}
        <div className="space-y-6">
          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="acc-name">Nom complet</Label>
                <Input 
                  id="acc-name" 
                  defaultValue={session?.user?.name || ''} 
                  placeholder="Jean Dupont"
                  onChange={(e) => {
                    // This would ideally call an update API
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-email">Email</Label>
                <Input 
                  id="acc-email" 
                  defaultValue={session?.user?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={async () => {
                  const state = useAppStore.getState();
                  try {
                    const res = await fetch('/api/user/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        profile: state.profile,
                        experiences: state.experiences,
                        educations: state.educations,
                        skills: state.skills,
                        languages: state.languages,
                        certifications: state.certifications
                      })
                    });
                    if (res.ok) {
                      toast({ title: "Synchronisation réussie", description: "Toutes vos données ont été sauvegardées sur votre compte." });
                    }
                  } catch (e) {
                    toast({ title: "Erreur", description: "Impossible de synchroniser les données.", variant: "destructive" });
                  }
                }}
              >
                Sauvegarder tout sur mon compte
              </Button>
              <Separator />
              <Button 
                variant="destructive" 
                className="w-full gap-2" 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <XCircle className="h-4 w-4" /> Déconnexion
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Abonnement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{planName}</div>
                  <div className="text-sm text-muted-foreground">
                    {remaining === -1 ? 'Candidatures illimitées' : `${remaining} candidatures restantes`}
                  </div>
                  {subscription?.currentPeriodEnd && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Renouvellement: {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                <Crown className="h-8 w-8 text-accent" />
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Votre abonnement se terminera le {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR') : 'fin de période'}.
                </div>
              )}

              <div className="space-y-2">
                {subscription && subscription.plan !== 'elite' && (
                  <Button className="w-full" onClick={() => setCurrentView('pricing')}>Upgrader</Button>
                )}

                {subscription && subscription.plan !== 'starter' && subscription.stripeCustomerId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleBillingPortal}
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                    Gérer l'abonnement
                  </Button>
                )}

                {subscription && subscription.plan !== 'starter' && !subscription.stripeCustomerId && (
                  <Button variant="outline" className="w-full" onClick={cancelSubscription}>
                    Annuler le renouvellement
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><div className="flex justify-between text-sm"><span>Réponses</span><span className="font-medium">{stats.responseRate}%</span></div><Progress value={stats.responseRate} className="h-2" /></div>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span>Profil</span><span className="font-medium">{profileCompletion}%</span></div><Progress value={profileCompletion} className="h-2" /></div>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span>Score CV</span><span className="font-medium">{cvScore}%</span></div><Progress value={cvScore} className="h-2" /></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================
// IMPORT CV PAGE
// ============================================
function ImportCVPage() {
  const { importedCVFile, setImportedCVFile, clearImportedCVFile, setCurrentView, profile } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setDragActive(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/cv/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.file) {
        setImportedCVFile({
          name: data.file.name,
          type: data.file.type,
          extension: data.file.extension,
          size: data.file.size,
          dataUrl: data.file.dataUrl,
          uploadedAt: new Date().toISOString()
        });
        toast({
          title: 'CV importé avec succès !',
          description: 'Votre CV est prêt à être utilisé pour vos candidatures.'
        });
      } else {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'importer le CV. Essayez un autre fichier.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownload = () => {
    if (importedCVFile?.dataUrl) {
      const link = document.createElement('a');
      link.href = importedCVFile.dataUrl;
      link.download = importedCVFile.name;
      link.click();
    }
  };

  const handlePreview = () => {
    if (importedCVFile?.dataUrl) {
      window.open(importedCVFile.dataUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      default: return '📁';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Importer votre CV</h1>
        <p className="text-muted-foreground">Importez votre CV existant (PDF, DOC, DOCX, TXT) pour l'utiliser directement dans vos candidatures</p>
      </div>

      {/* Imported CV Display */}
      {importedCVFile ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Votre CV importé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="text-4xl">{getFileIcon(importedCVFile.extension)}</div>
              <div className="flex-1">
                <div className="font-medium">{importedCVFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(importedCVFile.size)} • {importedCVFile.extension.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Importé le {new Date(importedCVFile.uploadedAt).toLocaleString('fr-FR')}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Prêt à l'emploi
              </Badge>
            </div>

            {/* Preview for PDF */}
            {importedCVFile.extension === 'pdf' && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 text-sm font-medium flex items-center justify-between">
                  <span>Aperçu du PDF</span>
                  <Button variant="ghost" size="sm" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-1" /> Agrandir
                  </Button>
                </div>
                <iframe
                  src={importedCVFile.dataUrl}
                  className="w-full h-96"
                  title="CV Preview"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" /> Aperçu
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
              <Button className="gradient-primary text-white shadow-lg" onClick={() => setShowApplyModal(true)}>
                <Send className="h-4 w-4 mr-2" /> Utiliser pour candidater
              </Button>
              <Button variant="destructive" onClick={clearImportedCVFile}>
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-800 mb-1">💡 Bon à savoir</p>
              <p className="text-blue-700">
                Votre CV importé sera utilisé tel quel pour vos candidatures automatiques.
                Il sera envoyé en pièce jointe avec vos lettres de motivation personnalisées.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Upload Zone */
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
            >
              {isImporting ? (
                <div className="space-y-4">
                  <RefreshCw className="h-16 w-16 mx-auto animate-spin text-primary" />
                  <p className="text-lg font-medium">Import en cours...</p>
                  <p className="text-sm text-muted-foreground">Veuillez patienter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileUp className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium">Glissez votre CV ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button asChild>
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground">Formats supportés: PDF, DOC, DOCX, TXT</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Import simple</h3>
            <p className="text-sm text-muted-foreground">Glissez-déposez ou sélectionnez votre CV existant</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Données sécurisées</h3>
            <p className="text-sm text-muted-foreground">Votre CV est stocké localement sur votre appareil</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Candidature rapide</h3>
            <p className="text-sm text-muted-foreground">Utilisez votre CV directement pour postuler</p>
          </CardContent>
        </Card>
      </div>

      {/* Application Summary Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-2xl bg-zinc-50 border-white/20 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Prêt pour votre candidature ?</DialogTitle>
                <DialogDescription>Récapitulatif de votre dossier avant lancement</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* CV Section */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="h-4 w-4" /></div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-600">Document Principal</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{importedCVFile ? getFileIcon(importedCVFile.extension) : '📄'}</div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold truncate text-sm">{importedCVFile?.name || 'CV par défaut'}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      {importedCVFile ? `${formatFileSize(importedCVFile.size)} • ${importedCVFile.extension}` : 'Fichier système'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Context Section */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><User className="h-4 w-4" /></div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-600">Profil Candidat</h4>
                </div>
                <div className="font-extrabold text-sm">{profile.firstName} {profile.lastName}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">{profile.targetJobTitle || 'Poste non défini'}</div>
              </div>
            </div>

            <div className="bg-zinc-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/30 transition-all duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="font-black text-sm uppercase tracking-[2px]">Intelligence Artificielle</h4>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  Notre système va générer des <span className="text-white font-bold italic">lettres de motivation personnalisées</span> pour chaque offre d'emploi détectée, en utilisant votre CV importé comme base de connaissances.
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Multi-langues</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Optimisé ATS</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Choisissez votre stratégie</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  className="flex items-center justify-between p-4 bg-white border-2 border-primary rounded-xl text-left hover:shadow-md transition-all group"
                  onClick={() => {
                    toast({ title: "Stratégie activée", description: "Lancement de l'Auto-Apply avec Lettre de Motivation." });
                    setCurrentView('auto-apply');
                    setShowApplyModal(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm uppercase tracking-tight">Avec Lettre de Motivation (Recommandé)</div>
                      <div className="text-xs text-zinc-500 font-medium">L'IA génère un document unique par offre d'emploi.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary" />
                </button>

                <button
                  className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl text-left hover:border-zinc-300 transition-all opacity-80"
                  onClick={() => {
                    toast({ title: "Stratégie simplifiée", description: "Lancement de l'Auto-Apply sans Lettre de Motivation." });
                    setCurrentView('auto-apply');
                    setShowApplyModal(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-zinc-100 rounded-lg">
                      <X className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-600">Envoyer sans Lettre de Motivation</div>
                      <div className="text-xs text-zinc-400">Plus rapide, mais moins de chances de retenir l'attention.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-zinc-300" />
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// AUTO-APPLY PAGE
// ============================================
function AutoApplyPage() {
  const { 
    profile, experiences, skills, 
    jobPreferences, setJobPreferences, 
    autoApply, setAutoApply, 
    frequency, setFrequency, 
    addApplication, subscription,
    usage, incrementApplications, getRemainingApplications,
    searchingJobs, setSearchingJobs,
    selectedJobIds, setSelectedJobIds,
    toggleJobSelection
  } = useAppStore();
  
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [applicationsToday, setApplicationsToday] = useState(0);

  const handleSearchJobs = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/auto-apply/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          profile,
          preferences: jobPreferences,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSearchingJobs(data.jobs);
        setSelectedJobIds([]); // Reset selection
        toast({ title: '🔍 Recherche terminée', description: `${data.jobs.length} offres trouvées.` });
      } else {
        toast({ title: 'Information', description: data.message || 'Aucune offre trouvée.' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de rechercher des offres.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplySelected = async () => {
    if (selectedJobIds.length === 0) {
      toast({ title: 'Attention', description: 'Veuillez sélectionner au moins un poste.', variant: 'destructive' });
      return;
    }

    if (selectedJobIds.length > getRemainingApplications() && getRemainingApplications() !== -1) {
      toast({ 
        title: 'Quota atteint', 
        description: `Vous ne pouvez postuler qu'à ${getRemainingApplications()} offre(s) supplémentaire(s) aujourd'hui.`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsApplying(true);
    const selectedJobs = searchingJobs.filter(job => selectedJobIds.includes(job.id));

    try {
      const response = await fetch('/api/auto-apply/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          profile,
          skills,
          experiences,
          selectedJobs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        data.applications.forEach((app: any) => {
          addApplication({
            ...app,
            appliedVia: 'ai'
          });
          incrementApplications();
        });

        setApplicationsToday(prev => prev + data.applications.length);
        setLastRun(new Date().toISOString());
        setSearchingJobs([]); // Clear search after apply
        setSelectedJobIds([]);

        // Send Email Summary
        try {
          fetch('/api/notifications/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applications: data.applications }),
          });
        } catch (e) {
          console.error("Failed to send summary email", e);
        }

        toast({ 
          title: '🚀 Succès !', 
          description: `${data.applications.length} candidatures IA préparées. Un récapitulatif a été envoyé sur votre e-mail.` 
        });
      } else {
        toast({ title: 'Erreur', description: data.error || 'Échec de la génération des candidatures.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Échec de la génération des candidatures.', variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          Auto-Candidature IA
        </h1>
        <p className="text-muted-foreground">Laissez l'IA rechercher et postuler aux meilleures offres pour vous</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Action Card */}
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <span>Agent Intelligent</span>
                </div>
                {autoApply ? (
                  <Badge className="bg-green-500 animate-pulse">Actif</Badge>
                ) : (
                  <Badge variant="secondary">En veille</Badge>
                )}
              </CardTitle>
              <CardDescription>
                L'IA analyse vos critères, trouve des postes et rédige des lettres de motivation sur mesure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background border rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-primary">{getRemainingApplications() === -1 ? '∞' : getRemainingApplications()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Restant / jour</div>
                </div>
                <div className="text-center p-3 bg-background border rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-primary">{usage.applicationsToday}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Aujourd'hui</div>
                </div>
                <div className="text-center p-3 bg-background border rounded-lg shadow-sm hidden md:block">
                  <div className="text-xl font-bold text-primary">{lastRun ? new Date(lastRun).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dernière Run</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="gradient-primary text-white flex-1 relative overflow-hidden group"
                  onClick={handleSearchJobs}
                  disabled={isSearching || isApplying || !profile.firstName}
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  {isSearching ? (
                    <><RefreshCw className="h-5 w-5 animate-spin mr-2" />Recherche en cours...</>
                  ) : (
                    <><Search className="h-5 w-5 mr-2" />Rechercher des offres</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1"
                  onClick={() => setAutoApply(!autoApply)}
                >
                  {autoApply ? <><Pause className="h-5 w-5 mr-2" />Désactiver l'automatisation</> : <><Play className="h-5 w-5 mr-2" />Activer le mode Auto</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchingJobs.length > 0 && (
            <Card className="border-primary/30 shadow-lg">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Offres trouvées ({searchingJobs.length})
                  </CardTitle>
                  <div className="text-sm font-medium text-primary">
                    {selectedJobIds.length} sélectionnée(s)
                  </div>
                </div>
                <CardDescription>
                  Sélectionnez les postes auxquels vous souhaitez postuler avec l'IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <div className="divide-y">
                    {searchingJobs.map((job) => (
                      <div key={job.id} className={`p-4 transition-colors hover:bg-muted/50 flex gap-4 items-start ${selectedJobIds.includes(job.id) ? 'bg-primary/5' : ''}`}>
                        <Checkbox 
                          id={`job-${job.id}`}
                          checked={selectedJobIds.includes(job.id)}
                          onCheckedChange={() => toggleJobSelection(job.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <label htmlFor={`job-${job.id}`} className="font-bold text-lg cursor-pointer leading-tight group-hover:text-primary transition-colors">
                              {job.title}
                            </label>
                            <Badge variant="outline" className="bg-background whitespace-nowrap">{job.location}</Badge>
                          </div>
                          <div className="text-primary font-semibold flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed italic">
                            {job.description?.substring(0, 150)}...
                          </p>
                          <div className="pt-2 flex items-center gap-4">
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Voir l'offre originale
                            </a>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              Rédiger via IA
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 bg-muted/30 border-t flex justify-end">
                <Button 
                  className="gradient-primary text-white"
                  disabled={selectedJobIds.length === 0 || isApplying}
                  onClick={handleApplySelected}
                >
                  {isApplying ? (
                    <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Rédaction des lettres...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" />Lancer l'auto-candidature ({selectedJobIds.length})</>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {searchingJobs.length === 0 && !isSearching && (
             <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <Search className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-center font-medium max-w-[300px]">
                  Utilisez les filtres à droite pour trouver les meilleures opportunités.
                </p>
             </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Paramètres de l'Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type de contrats</Label>
                <div className="flex flex-wrap gap-2">
                  {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map((type) => (
                    <Badge
                      key={type}
                      variant={jobPreferences.jobTypes.includes(type) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${jobPreferences.jobTypes.includes(type) ? 'scale-105 shadow-md' : 'opacity-70 hover:opacity-100'}`}
                      onClick={() => {
                        const types = jobPreferences.jobTypes.includes(type)
                          ? jobPreferences.jobTypes.filter(t => t !== type)
                          : [...jobPreferences.jobTypes, type];
                        setJobPreferences({ jobTypes: types });
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Où chercher ?</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Ville, Pays ou Remote..."
                    value={jobPreferences.locations.join(', ')}
                    onChange={(e) => setJobPreferences({ locations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expertise / Mots-clés</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="React, Lead, Manager..."
                    value={jobPreferences.keywords.join(', ')}
                    onChange={(e) => setJobPreferences({ keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Télétravail total</Label>
                  <p className="text-[11px] text-muted-foreground">Uniquement 100% remote</p>
                </div>
                <Switch
                  checked={jobPreferences.remoteOnly}
                  onCheckedChange={(checked) => setJobPreferences({ remoteOnly: checked })}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Limite quotidienne</Label>
                  <span className="text-sm font-bold text-primary">{jobPreferences.maxApplicationsPerDay} candidatures/jour</span>
                </div>
                <Select
                  value={jobPreferences.maxApplicationsPerDay.toString()}
                  onValueChange={(v) => setJobPreferences({ maxApplicationsPerDay: parseInt(v) })}
                >
                  <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 candidatures</SelectItem>
                    <SelectItem value="5">5 candidatures (Recommandé)</SelectItem>
                    <SelectItem value="10">10 candidatures</SelectItem>
                    <SelectItem value="20">20 candidatures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary">PLAN PRO</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Vos informations sont protégées. L'IA génère des contenus uniques pour éviter le spam.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  const { setCurrentView } = useAppStore();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <NextImage src="/logo.png" alt="CVJobScrap" width={32} height={32} className="h-8 w-auto" />
              <span className="text-lg font-bold">CVJobScrap</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">Votre partenaire IA pour une recherche d'emploi optimisée.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-foreground">Accueil</button></li>
              <li><button onClick={() => setCurrentView('cv-builder')} className="hover:text-foreground">Créer un CV</button></li>
              <li><button onClick={() => setCurrentView('job-search')} className="hover:text-foreground">Emplois</button></li>
              <li><button onClick={() => setCurrentView('pricing')} className="hover:text-foreground">Tarifs</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground">Mentions légales</button></li>
              <li><button className="hover:text-foreground">Confidentialité</button></li>
              <li><button className="hover:text-foreground">CGU</button></li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>© 2024 CVJobScrap. Tous droits réservés.</div>
          <div className="flex gap-4">
            <button className="hover:text-foreground">Twitter</button>
            <button className="hover:text-foreground">LinkedIn</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

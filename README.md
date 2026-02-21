# CVJobScrap - Application de Gestion de CV et Candidatures Automatiques

Une application web complète pour créer des CV professionnels, importer des CV existants, et postuler automatiquement aux offres d'emploi grâce à l'IA.

## 🚀 Fonctionnalités

### Création de CV
- **6 modèles professionnels** : Moderne, Élégant, Créatif, Minimaliste, Professionnel, Classique
- **10 couleurs personnalisables**
- **Génération IA** de contenu optimisé ATS
- **Export PDF** haute qualité

### Import de CV
- Support des formats **PDF, DOC, DOCX, TXT**
- Conservation du fichier original
- Aperçu intégré pour les PDF
- Utilisation directe pour les candidatures

### Recherche d'Emploi
- Recherche IA d'offres personnalisées
- Filtrage par type de contrat, localisation, salaire
- Score de matching automatique

### Auto-Candidature IA
- Génération automatique de lettres de motivation
- Postulation en 1 clic
- Planification quotidienne/hebdomadaire
- Suivi des candidatures

### Abonnements (Stripe)
- **Starter** : Gratuit, 3 candidatures/semaine
- **Pro** : 9.99€/mois, 10 candidatures/semaine
- **Elite** : 20€/mois, candidatures illimitées

## 🛠️ Stack Technique

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : SQLite (Prisma ORM)
- **IA** : Z-AI SDK (z-ai-web-dev-sdk)
- **Paiements** : Stripe
- **PDF** : jsPDF

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/VOTRE-USERNAME/cvjobscrap.git
cd cvjobscrap

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Initialiser la base de données
bun run db:push

# Lancer en développement
bun run dev
```

## ⚙️ Configuration

Créez un fichier `.env` avec :

```env
# Base de données
DATABASE_URL=file:./db/custom.db

# Stripe (Mode Test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de l'application
NEXT_PUBLIC_URL=http://localhost:3000
```

## 🔑 Obtenir les clés Stripe

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans **Developers** → **API Keys**
3. Copiez les clés de test (commencent par `pk_test_` et `sk_test_`)
4. Pour les webhooks : **Developers** → **Webhooks** → **Add endpoint**

## 📁 Structure du Projet

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── auto-apply/   # Auto-candidature
│   │   ├── applications/ # Création candidatures
│   │   ├── cover-letter/ # Génération lettres
│   │   ├── cv/           # Génération et export CV
│   │   ├── jobs/         # Recherche offres
│   │   └── stripe/       # Paiements Stripe
│   ├── page.tsx          # Application principale
│   └── globals.css       # Styles globaux
├── lib/
│   ├── store.ts          # État global (Zustand)
│   ├── stripe.ts         # Configuration Stripe
│   └── db.ts             # Prisma client
└── components/ui/        # Composants UI
```

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Variables d'environnement Vercel

Ajoutez dans les settings du projet Vercel :
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_URL`

## 📝 Scripts Disponibles

```bash
bun run dev      # Développement
bun run build    # Build production
bun run start    # Serveur production
bun run lint     # Linting
bun run db:push  # Migrer la DB
```

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

---

Développé avec ❤️ par CVJobScrap Team

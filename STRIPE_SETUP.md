# Guide de Configuration Stripe pour CVJobScrap

## Étape 1: Créer un compte Stripe

1. Allez sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Créez un compte avec votre email
3. Confirmez votre email

## Étape 2: Obtenir vos clés API

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com/)
2. En haut à droite, assurez-vous d'être en mode **"Test"** (pour les tests)
3. Allez dans **Developers** → **API Keys**
4. Copiez les deux clés:
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (commence par `sk_test_...`) - Cliquez sur "Reveal" pour la voir

## Étape 3: Configurer le webhook (important pour les paiements)

1. Dans le Dashboard Stripe, allez dans **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. Pour l'URL, entrez: `https://votre-domaine.com/api/stripe/webhook`
   - En local: Utilisez Stripe CLI (voir étape 4)
4. Sélectionnez ces événements:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Cliquez sur **"Add endpoint"**
6. Copiez le **"Signing secret"** (commence par `whsec_...`)

## Étape 4: Tester en local avec Stripe CLI

Pour tester les webhooks en local:

```bash
# Installez Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git && scoop install stripe

# Connectez-vous
stripe login

# Redirigez les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Cela vous donnera une clé webhook locale (whsec_...) à utiliser.

## Étape 5: Mettre à jour le fichier .env

Ouvrez le fichier `.env` dans votre projet et remplacez les valeurs:

```env
# Remplacez par vos vraies clés Stripe
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_ici
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_ici
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret_ici

# Optionnel: Prix prédéfinis (sinon créés automatiquement)
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_ELITE_MONTHLY_PRICE_ID=
STRIPE_ELITE_YEARLY_PRICE_ID=
```

## Étape 6: Configurer les produits dans Stripe (Optionnel)

Vous pouvez créer les produits manuellement:

1. Allez dans **Products** dans le Dashboard Stripe
2. Créez 2 produits:
   - **CVJobScrap Pro** - 9.99€/mois ou 95.90€/an
   - **CVJobScrap Elite** - 20€/mois ou 192€/an
3. Copiez les Price IDs et ajoutez-les dans `.env`

## Mode Démo (Sans Stripe)

Si vous n'avez pas encore configuré Stripe, l'application fonctionne en **mode démo**:
- Les paiements sont simulés
- Les abonnements sont activés localement
- Parfait pour tester l'interface

## Passer en Production

1. Passez votre compte Stripe en mode **"Live"** dans le Dashboard
2. Remplacez les clés test par les clés live dans `.env`
3. Créez un nouveau webhook avec l'URL de production
4. Mettez à jour `NEXT_PUBLIC_URL` avec votre domaine de production

## Tarifs Configurés

| Plan | Mensuel | Annuel (20% off) |
|------|---------|------------------|
| Starter | Gratuit | Gratuit |
| Pro | 9.99€ | 95.90€ |
| Elite | 20€ | 192€ |

## Support

- Documentation Stripe: [https://stripe.com/docs](https://stripe.com/docs)
- Support Stripe: [https://support.stripe.com](https://support.stripe.com)

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CVJobScrap - Génération de CV par IA et Candidature Automatisée",
  description: "Générez des CV optimisés ATS avec l'IA, trouvez des offres d'emploi pertinentes et automatisez vos candidatures. Votre carrière, simplifiée.",
  keywords: ["CV", "IA", "emploi", "candidature", "recrutement", "carrière", "automatisation"],
  authors: [{ name: "CVJobScrap Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "CVJobScrap - Votre Carrière, Optimisée par l'IA",
    description: "Génération de CV intelligente et candidature automatisée",
    url: "https://cvjobscrap.com",
    siteName: "CVJobScrap",
    type: "website",
  },
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

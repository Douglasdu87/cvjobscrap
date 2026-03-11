import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        experiences: true,
        educations: true,
        certifications: true,
        languages: true,
        skills: true,
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { profile, experiences, educations, skills, languages, certifications } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Atomic update/upsert for everything
    await db.$transaction(async (tx) => {
      // 1. Profile
      if (profile) {
        await tx.profile.upsert({
          where: { userId: user.id },
          create: { ...profile, userId: user.id },
          update: profile,
        });
      }

      // 2. Experiences (replacing for simplicity in sync)
      if (experiences) {
        await tx.experience.deleteMany({ where: { userId: user.id } });
        await tx.experience.createMany({
          data: experiences.map((e: any) => ({ ...e, userId: user.id, id: undefined })),
        });
      }

      // 3. Educations
      if (educations) {
        await tx.education.deleteMany({ where: { userId: user.id } });
        await tx.education.createMany({
          data: educations.map((e: any) => ({ ...e, userId: user.id, id: undefined })),
        });
      }

      // 4. Skills
      if (skills) {
        await tx.skill.deleteMany({ where: { userId: user.id } });
        await tx.skill.createMany({
          data: skills.map((s: any) => ({ ...s, userId: user.id, id: undefined })),
        });
      }

      // 5. Languages
      if (languages) {
        await tx.language.deleteMany({ where: { userId: user.id } });
        await tx.language.createMany({
          data: languages.map((l: any) => ({ ...l, userId: user.id, id: undefined })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

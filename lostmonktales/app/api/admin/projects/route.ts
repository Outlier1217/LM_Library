
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type ProjectImageInput = {
  url: string;
  alt?: string;
  caption?: string;
};

function makeSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.architectureProject.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Project list failed:", error);
    return NextResponse.json(
      { error: "Could not load projects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title || !description) {
      return NextResponse.json(
        { error: "Project title and description are required." },
        { status: 400 }
      );
    }

    if (title.length > 200 || description.length > 50000) {
      return NextResponse.json(
        { error: "Title or description is too long." },
        { status: 400 }
      );
    }

    const slug = makeSlug(
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : title
    );

    if (!slug) {
      return NextResponse.json({ error: "Invalid project slug." }, { status: 400 });
    }

    const existing = await prisma.architectureProject.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This project slug already exists." },
        { status: 409 }
      );
    }

    const categories = [
      "ARCHITECTURE",
      "INTERIOR",
      "COMMERCIAL",
      "RESIDENTIAL",
    ];

    const category = categories.includes(body.category)
      ? body.category
      : "ARCHITECTURE";

    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const images = Array.isArray(body.images)
      ? body.images.filter(
          (image: unknown): image is { url: string; alt?: string; caption?: string } =>
            !!image &&
            typeof image === "object" &&
            "url" in image &&
            typeof image.url === "string" &&
            image.url.startsWith("/uploads/projects/")
        ).slice(0, 30)
      : [];

    const project = await prisma.architectureProject.create({
      data: {
        title,
        slug,
        description,
        category,
        clientName:
          typeof body.clientName === "string" ? body.clientName.trim() || null : null,
        location:
          typeof body.location === "string" ? body.location.trim() || null : null,
        siteArea: body.siteArea ? Number(body.siteArea) : null,
        siteAreaUnit: body.siteAreaUnit || null,
        cost: body.cost ? Number(body.cost) : null,
        costCurrency: body.costCurrency || "INR",
        builtUpArea: body.builtUpArea ? Number(body.builtUpArea) : null,
        builtUpAreaUnit: body.builtUpAreaUnit || null,
        completionYear: body.completionYear ? Number(body.completionYear) : null,
        coverImage:
          typeof body.coverImage === "string" ? body.coverImage : null,
        isFeatured: body.isFeatured === true,
        status,
        authorId: admin.id,
        images: {
          create: images.map(
            (image: ProjectImageInput, index: number) => ({
              url: image.url,
              alt: typeof image.alt === "string" ? image.alt : title,
              caption: typeof image.caption === "string" ? image.caption : null,
              sortOrder: index,
            })
          ),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Project create failed:", error);
    return NextResponse.json(
      { error: "Could not create project. Check numeric fields and try again." },
      { status: 500 }
    );
  }
}

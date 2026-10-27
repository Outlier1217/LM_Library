
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type Props = { params: Promise<{ id: string }> };
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

export async function PATCH(request: Request, { params }: Props) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const current = await prisma.architectureProject.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 }
      );
    }

    const slug = makeSlug(
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : title
    );

    if (!slug) {
      return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
    }

    const slugOwner = await prisma.architectureProject.findUnique({
      where: { slug },
    });

    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        { error: "This slug already belongs to another project." },
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
      : current.category;

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

    const project = await prisma.architectureProject.update({
      where: { id },
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
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        images: {
          deleteMany: {},
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

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project update failed:", error);
    return NextResponse.json(
      { error: "Could not update project." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const project = await prisma.architectureProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await prisma.architectureProject.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete project." },
      { status: 500 }
    );
  }
}

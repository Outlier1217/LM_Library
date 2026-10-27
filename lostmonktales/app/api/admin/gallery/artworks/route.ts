import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [artworks, categories] = await Promise.all([
      prisma.galleryArtwork.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          categories: { include: { category: true } },
        },
      }),
      prisma.galleryCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ artworks, categories });
  } catch (error) {
    console.error("Admin gallery list failed:", error);

    return NextResponse.json(
      { error: "Could not load gallery artworks." },
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

    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title || !description) {
      return NextResponse.json(
        { error: "Artwork title and description are required." },
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
      return NextResponse.json(
        { error: "Please enter a valid artwork title." },
        { status: 400 }
      );
    }

    const existing = await prisma.galleryArtwork.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An artwork with this slug already exists. Change the title." },
        { status: 409 }
      );
    }

    const rawCategoryIds: unknown[] = Array.isArray(body.categoryIds)
      ? body.categoryIds
      : [];

    const categoryIds = [
      ...new Set(
        rawCategoryIds.filter(
          (id): id is string =>
            typeof id === "string" && id.trim().length > 0
        )
      ),
    ].slice(0, 30);

    const images = Array.isArray(body.images)
      ? body.images
          .filter(
            (image: unknown): image is { url: string; alt?: string } =>
              typeof image === "object" &&
              image !== null &&
              "url" in image &&
              typeof image.url === "string" &&
              image.url.startsWith("/uploads/gallery/")
          )
          .slice(0, 30)
      : [];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one artwork image." },
        { status: 400 }
      );
    }

    if (categoryIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one category." },
        { status: 400 }
      );
    }

    const validCategories = await prisma.galleryCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (validCategories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "One or more selected categories are invalid." },
        { status: 400 }
      );
    }

    const artwork = await prisma.galleryArtwork.create({
      data: {
        title,
        slug,
        description,
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        isFeatured: body.isFeatured === true,
        authorId: admin.id,
        categories: {
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
        images: {
          create: images.map(
            (image: { url: string; alt?: string }, index: number) => ({
              url: image.url,
              alt: typeof image.alt === "string" ? image.alt : title,
              sortOrder: index,
            })
          ),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    console.error("Admin gallery artwork creation failed:", error);

    return NextResponse.json(
      { error: "Could not save artwork. Please check the details and try again." },
      { status: 500 }
    );
  }
}
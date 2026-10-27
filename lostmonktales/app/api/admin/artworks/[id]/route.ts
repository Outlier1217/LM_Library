
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type Props = { params: Promise<{ id: string }> };
type ArtworkImageInput = {
  url: string;
  alt?: string;
};

const categories = [
  "PENCIL_PORTRAIT",
  "PAINTING",
  "OIL_PAINTING",
  "ACRYLIC",
  "OTHER",
];

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

    const current = await prisma.artwork.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const price = Number(body.price);

    if (!title || !description || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Enter a title, description and valid non-negative price." },
        { status: 400 }
      );
    }

    const slug = makeSlug(
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : title
    );

    if (!slug) {
      return NextResponse.json({ error: "Invalid artwork slug." }, { status: 400 });
    }

    const slugOwner = await prisma.artwork.findUnique({ where: { slug } });

    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        { error: "This slug already belongs to another artwork." },
        { status: 409 }
      );
    }

    const category = categories.includes(body.category)
      ? body.category
      : current.category;

    const images = Array.isArray(body.images)
      ? body.images.filter(
          (image: unknown): image is { url: string; alt?: string } =>
            !!image &&
            typeof image === "object" &&
            "url" in image &&
            typeof image.url === "string" &&
            image.url.startsWith("/uploads/artworks/")
        ).slice(0, 30)
      : [];

    const artwork = await prisma.artwork.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        category,
        price,
        currency: typeof body.currency === "string" ? body.currency : "INR",
        dimensions:
          typeof body.dimensions === "string" ? body.dimensions.trim() || null : null,
        medium:
          typeof body.medium === "string" ? body.medium.trim() || null : null,
        contactNumber:
          typeof body.contactNumber === "string"
            ? body.contactNumber.trim() || null
            : null,
        isAvailable: body.isAvailable !== false,
        isFeatured: body.isFeatured === true,
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        images: {
          deleteMany: {},
          create: images.map(
            (image: ArtworkImageInput, index: number) => ({
              url: image.url,
              alt: typeof image.alt === "string" ? image.alt : title,
              sortOrder: index,
            })
          ),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("Artwork update failed:", error);
    return NextResponse.json(
      { error: "Could not update artwork." },
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
    const existing = await prisma.artwork.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }

    await prisma.artwork.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Artwork deletion failed:", error);
    return NextResponse.json(
      { error: "Could not delete artwork." },
      { status: 500 }
    );
  }
}

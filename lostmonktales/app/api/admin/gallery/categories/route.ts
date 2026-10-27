
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const categories = await prisma.galleryCategory.findMany({
      include: {
        _count: {
          select: { artworks: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Gallery categories GET error:", error);

    return NextResponse.json(
      { error: "Failed to load gallery categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Category name is required and must be 80 characters or fewer." },
        { status: 400 }
      );
    }

    const slug = makeSlug(name);

    if (!slug) {
      return NextResponse.json(
        { error: "Please enter a category name containing letters or numbers." },
        { status: 400 }
      );
    }

    const existing = await prisma.galleryCategory.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { slug },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }

    const category = await prisma.galleryCategory.create({
      data: { name, slug },
    });

    return NextResponse.json(
      { message: "Category created successfully.", category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gallery categories POST error:", error);

    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}

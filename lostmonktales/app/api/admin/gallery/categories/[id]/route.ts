
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
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
        { error: "Please enter a valid category name." },
        { status: 400 }
      );
    }

    const current = await prisma.galleryCategory.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const duplicate = await prisma.galleryCategory.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { slug },
        ],
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Another category with this name already exists." },
        { status: 409 }
      );
    }

    const category = await prisma.galleryCategory.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Gallery category PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const category = await prisma.galleryCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { artworks: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    if (category._count.artworks > 0) {
      return NextResponse.json(
        {
          error:
            "This category is assigned to artworks. Remove it from those artworks before deleting the category.",
        },
        { status: 409 }
      );
    }

    await prisma.galleryCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Gallery category DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}

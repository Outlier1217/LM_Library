import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const data: {
      status?: "DRAFT" | "PUBLISHED";
      isFeatured?: boolean;
    } = {};

    if (body.status === "DRAFT" || body.status === "PUBLISHED") {
      data.status = body.status;
    }

    if (typeof body.isFeatured === "boolean") {
      data.isFeatured = body.isFeatured;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid changes supplied." },
        { status: 400 }
      );
    }

    const result = await prisma.galleryArtwork.updateMany({
      where: { id },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 }
      );
    }

    const artwork = await prisma.galleryArtwork.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("Gallery artwork update failed:", error);

    return NextResponse.json(
      { error: "Could not update artwork." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const result = await prisma.galleryArtwork.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Artwork deleted successfully." });
  } catch (error) {
    console.error("Gallery artwork delete failed:", error);

    return NextResponse.json(
      { error: "Could not delete artwork." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const artwork = await prisma.galleryArtwork.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    });

    if (!artwork) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("Artwork detail API error:", error);
    return NextResponse.json(
      { error: "Unable to load artwork." },
      { status: 500 },
    );
  }
}

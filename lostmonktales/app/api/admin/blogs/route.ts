
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
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
    const blogs = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        status: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Admin blog list failed:", error);
    return NextResponse.json(
      { error: "Could not load blogs." },
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
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const coverImage =
      typeof body.coverImage === "string" && body.coverImage.trim()
        ? body.coverImage.trim()
        : null;

    const youtubeUrl =
     typeof body.youtubeUrl === "string" && body.youtubeUrl.trim()
        ? body.youtubeUrl.trim()
        : null;
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string")
          .map((tag: string) => tag.trim()).filter(Boolean).slice(0, 30)
      : [];
    const isFeatured = body.isFeatured === true;
    const publish = body.status === "PUBLISHED";

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: "Title, excerpt and content are required." },
        { status: 400 }
      );
    }

    if (title.length > 200 || excerpt.length > 1000 || content.length > 100000) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    if (coverImage && !coverImage.startsWith("/") &&
        !/^https?:\/\//i.test(coverImage)) {
      return NextResponse.json(
        { error: "Cover image must be a site path or HTTP(S) URL." },
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
        { error: "Please provide a valid title or slug." },
        { status: 400 }
      );
    }

    const existing = await prisma.blogPost.findUnique({ where: { slug } });

    if (existing) {
      return NextResponse.json(
        { error: "That slug already exists. Choose a different slug." },
        { status: 409 }
      );
    }

    const blog = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category: category || null,
        coverImage,
        youtubeUrl,
        tags,
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        isFeatured,
        authorId: admin.id,
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error("Admin blog create failed:", error);
    return NextResponse.json(
      { error: "Could not create blog. Please check the fields and try again." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function makeSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const current = await prisma.blogPost.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: "Blog not found." }, { status: 404 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

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

    const slug = makeSlug(
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : title
    );

    if (!slug) {
      return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
    }

    const slugOwner = await prisma.blogPost.findUnique({ where: { slug } });

    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        { error: "That slug already belongs to another blog." },
        { status: 409 }
      );
    }

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : null;

    const coverImage =
      typeof body.coverImage === "string" && body.coverImage.trim()
        ? body.coverImage.trim()
        : null;
    const youtubeUrl =
     typeof body.youtubeUrl === "string" && body.youtubeUrl.trim()
        ? body.youtubeUrl.trim()
        : null;

    if (coverImage && !coverImage.startsWith("/") &&
        !/^https?:\/\//i.test(coverImage)) {
      return NextResponse.json(
        { error: "Cover image must be a site path or HTTP(S) URL." },
        { status: 400 }
      );
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string")
          .map((tag: string) => tag.trim()).filter(Boolean).slice(0, 30)
      : [];

    const publish = body.status === "PUBLISHED";

    const blog = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        coverImage,
        youtubeUrl,
        tags,
        isFeatured: body.isFeatured === true,
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? current.publishedAt ?? new Date() : null,
      },
    });

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Admin blog update failed:", error);
    return NextResponse.json(
      { error: "Could not update blog." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const blog = await prisma.blogPost.findUnique({ where: { id } });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found." }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin blog delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete blog." },
      { status: 500 }
    );
  }
}

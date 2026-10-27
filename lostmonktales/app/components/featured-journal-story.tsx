
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export default function FeaturedJournalStory() {
  return (
    <Suspense fallback={null}>
      <FeaturedStoryContent />
    </Suspense>
  );
}

async function FeaturedStoryContent() {
  await connection();

  const blog = await prisma.blogPost.findFirst({
    where: {
      isFeatured: true,
      status: "PUBLISHED",
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      coverImage: true,
      publishedAt: true,
    },
  });

  if (!blog) return null;

  return (
    <section className="home-featured-journal">
      <div className="home-featured-heading">
        <div>
          <p className="eyebrow">EDITOR'S PICK</p>
          <h2>Featured from the Journal</h2>
        </div>
        <Link href="/blogs">Explore all stories →</Link>
      </div>

      <article className="home-featured-card">
        {blog.coverImage && (
          <Link
            href={`/blogs/${blog.slug}`}
            className="home-featured-image"
          >
            <Image
              src={blog.coverImage}
              alt={blog.title}
              width={900}
              height={600}
              sizes="(max-width: 760px) 100vw, 50vw"
            />
          </Link>
        )}

        <div className="home-featured-copy">
          <p className="eyebrow">{blog.category || "JOURNAL"}</p>
          <h3>
            <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
          </h3>
          <p>{blog.excerpt}</p>

          {blog.publishedAt && (
            <time dateTime={blog.publishedAt.toISOString()}>
              {blog.publishedAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
          )}

          <Link
            href={`/blogs/${blog.slug}`}
            className="button-primary"
          >
            Read the story →
          </Link>
        </div>
      </article>
    </section>
  );
}

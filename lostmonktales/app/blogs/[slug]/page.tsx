
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export default function BlogDetailPage({ params }: BlogPageProps) {
  return (
    <Suspense fallback={<ArticleLoading />}>
      <BlogArticle params={params} />
    </Suspense>
  );
}

function ArticleLoading() {
  return (
    <main className="article-page">
      <header className="blogs-header">
        <Link href="/" className="blogs-brand">
          LostMonkTales
        </Link>
        <Link href="/blogs" className="back-link">
          ← All stories
        </Link>
      </header>
      <section className="article-loading">
        <p className="eyebrow">THE LOST MONK JOURNAL</p>
        <h1>Loading article...</h1>
      </section>
    </main>
  );
}

async function BlogArticle({ params }: BlogPageProps) {
  await connection();

  const { slug } = await params;

  const blog = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      youtubeUrl: true,
      category: true,
      tags: true,
      publishedAt: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  if (!blog) {
    notFound();
  }

  return (
    <main className="article-page">
      <header className="blogs-header">
        <Link href="/" className="blogs-brand">
          LostMonkTales
        </Link>
        <Link href="/blogs" className="back-link">
          ← All stories
        </Link>
      </header>

      <article className="article-container">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/blogs">Journal</Link>
          <span>/</span>
          <span>{blog.category || "Article"}</span>
        </nav>

        <header className="article-header">
          <p className="eyebrow">
            {blog.category || "THE LOST MONK JOURNAL"}
          </p>

          <h1>{blog.title}</h1>

          <p className="article-excerpt">{blog.excerpt}</p>

          {blog.publishedAt && (
            <time
              className="article-date"
              dateTime={blog.publishedAt.toISOString()}
            >
              Published{" "}
              {blog.publishedAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
          )}
        </header>

        {blog.coverImage && (
          <div className="article-cover">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              width={1400}
              height={800}
              priority
              className="article-cover-image"
            />
          </div>
        )}

        
{blog.youtubeUrl && (() => {
  let videoId = "";

  try {
    const url = new URL(blog.youtubeUrl);

    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(url.hostname)
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/")
      ) {
        videoId = url.pathname.split("/")[2] || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      videoId = "";
    }
  } catch {
    videoId = "";
  }

  return videoId ? (
    <section className="article-video-section">
      <p className="eyebrow">WATCH THE VIDEO</p>
      <div className="article-video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={`${blog.title} — YouTube video`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  ) : null;
})()}


        <div className="article-body">
          {blog.content}
        </div>

        {blog.tags.length > 0 && (
          <div className="article-tags">
            <span>Explore topics:</span>
            {blog.tags.map((tag) => (
              <span className="article-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <footer className="article-footer">
          <p className="eyebrow">KEEP EXPLORING</p>
          <h2>There is always more to discover.</h2>
          <Link href="/blogs" className="home-button">
            Read more stories →
          </Link>
        </footer>
      </article>

      <footer className="blogs-footer">
        © 2026 LostMonkTales. All rights reserved.
      </footer>
    </main>
  );
}

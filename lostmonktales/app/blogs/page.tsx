
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Journal",
  description:
    "Explore ideas, architecture, creativity, and stories from LostMonkTales.",
};

export default function BlogsPage() {
  return (
    <Suspense fallback={<BlogsLoading />}>
      <BlogsContent />
    </Suspense>
  );
}

function BlogsLoading() {
  return (
    <main className="blogs-page">
      <header className="blogs-header">
        <Link href="/" className="blogs-brand">
          LostMonkTales
        </Link>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <section className="blogs-hero">
        <p className="eyebrow">THE LOST MONK JOURNAL</p>
        <h1>
          Ideas that inspire.
          <br />
          Stories that matter.
        </h1>
        <p className="blogs-intro">
          Explore ideas, knowledge, architecture, creativity,
          and perspectives that encourage deeper understanding.
        </p>
      </section>

      <section className="blogs-content">
        <p>Loading journal articles...</p>
      </section>
    </main>
  );
}

async function BlogsContent() {
  await connection();

  const blogs = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
      isFeatured: true,
    },
  });

  const featuredBlog = blogs.find((blog) => blog.isFeatured);
  const otherBlogs = blogs.filter(
    (blog) => blog.id !== featuredBlog?.id
  );

  return (
    <main className="blogs-page">
      <header className="blogs-header">
        <Link href="/" className="blogs-brand">
          LostMonkTales
        </Link>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <section className="blogs-hero">
        <p className="eyebrow">THE LOST MONK JOURNAL</p>
        <h1>
          Ideas that inspire.
          <br />
          Stories that matter.
        </h1>
        <p className="blogs-intro">
          Explore ideas, knowledge, architecture, creativity,
          and perspectives that encourage deeper understanding.
        </p>
      </section>

      <section className="blogs-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OUR LATEST THINKING</p>
            <h2>Explore the Journal</h2>
          </div>

          <span className="coming-soon">
            {blogs.length}{" "}
            {blogs.length === 1 ? "ARTICLE" : "ARTICLES"}
          </span>
        </div>

        {blogs.length === 0 ? (
          <div className="empty-blogs">
            <span className="empty-icon">✳</span>
            <h3>Our journal is just getting started.</h3>
            <p>
              New stories and ideas will appear here once they
              are published. Stay curious and visit again soon.
            </p>
            <Link href="/" className="home-button">
              Explore LostMonkTales
            </Link>
          </div>
        ) : (
          <>
            {featuredBlog && (
              <article className="featured-blog featured-blog-compact">
                {featuredBlog.coverImage && (
                  <Link
                    href={`/blogs/${featuredBlog.slug}`}
                    className="blog-image-link"
                  >
                    <Image
                      src={featuredBlog.coverImage}
                      alt={featuredBlog.title}
                      width={1200}
                      height={700}
                      className="blog-cover-image"
                    />
                  </Link>
                )}

                <div className="featured-blog-copy">
                  <p className="eyebrow">
                    {featuredBlog.category || "FEATURED STORY"}
                  </p>

                  <h3>
                    <Link href={`/blogs/${featuredBlog.slug}`}>
                      {featuredBlog.title}
                    </Link>
                  </h3>

                  <p>{featuredBlog.excerpt}</p>

                  {featuredBlog.publishedAt && (
                    <time
                      dateTime={featuredBlog.publishedAt.toISOString()}
                    >
                      {featuredBlog.publishedAt.toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        }
                      )}
                    </time>
                  )}

                  <Link
                    href={`/blogs/${featuredBlog.slug}`}
                    className="home-button"
                  >
                    Read the story →
                  </Link>
                </div>
              </article>
            )}

            <div className="blog-grid">
              {otherBlogs.map((blog) => (
                <article className="blog-card" key={blog.id}>
                  {blog.coverImage && (
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="blog-image-link"
                    >
                      <Image
                        src={blog.coverImage}
                        alt={blog.title}
                        width={700}
                        height={450}
                        className="blog-cover-image"
                      />
                    </Link>
                  )}

                  <div className="blog-card-copy">
                    <p className="eyebrow">
                      {blog.category || "JOURNAL"}
                    </p>

                    <h3>
                      <Link href={`/blogs/${blog.slug}`}>
                        {blog.title}
                      </Link>
                    </h3>

                    <p>{blog.excerpt}</p>

                    {blog.publishedAt && (
                      <time dateTime={blog.publishedAt.toISOString()}>
                        {blog.publishedAt.toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          }
                        )}
                      </time>
                    )}

                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="read-more"
                    >
                      Read article →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="blogs-footer">
        © 2026 LostMonkTales. All rights reserved.
      </footer>
    </main>
  );
}

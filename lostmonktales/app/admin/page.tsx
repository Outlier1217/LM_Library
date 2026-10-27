
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="admin-loading">Loading dashboard...</p>}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const [
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    totalProjects,
    totalArtworks,
    totalQuizzes,
  ] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.architectureProject.count(),
    prisma.artwork.count(),
    prisma.quiz.count(),
  ]);

  async function logout() {
    "use server";

    const { destroyAdminSession } = await import("@/lib/admin-auth");
    destroyAdminSession();
    redirect("/admin/login");
  }

  const stats = [
    { label: "Total blogs", value: totalBlogs },
    { label: "Published blogs", value: publishedBlogs },
    { label: "Draft blogs", value: draftBlogs },
    { label: "Architecture projects", value: totalProjects },
    { label: "Artworks", value: totalArtworks },
    { label: "Quizzes", value: totalQuizzes },
  ];

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-sidebar-brand">
          LostMonkTales
        </Link>

        <p className="admin-sidebar-label">WORKSPACE</p>

        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-active">
            Dashboard
          </Link>
          <Link href="/admin/blogs">Blog management</Link>
          <Link href="/admin/projects">Architecture projects</Link>
          <Link href="/admin/artworks">Art gallery</Link>
          <Link href="/admin/art-gallery">Art Gallery Categories</Link>
          <Link href="/admin/quizzes">Quiz management</Link>
          <Link href="/admin/settings">Website settings</Link>
        </nav>

        <Link href="/" className="admin-view-site">
          View website ↗
        </Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">WORKSPACE OVERVIEW</p>
            <h1>Dashboard</h1>
          </div>

          <div className="admin-account">
            <div>
              <strong>{admin.name}</strong>
              <p>{admin.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="admin-logout">
                Log out
              </button>
            </form>
          </div>
        </header>

        <div className="admin-welcome">
          <p className="eyebrow">LOSTMONKTALES ADMINISTRATION</p>
          <h2>Welcome back, {admin.name}.</h2>
          <p>
            Manage your journal, projects, artwork and learning content
            from one place.
          </p>
        </div>

        <section className="admin-stats">
          {stats.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="admin-quick-actions">
          <h2>Content management</h2>
          <p>
            Your dashboard is ready. The individual management screens
            will be connected in the next steps.
          </p>

          <div className="admin-action-grid">
            <Link href="/admin/blogs">
              <strong>Blog management</strong>
              <span>Create and publish journal articles →</span>
            </Link>
            <Link href="/admin/projects">
              <strong>Architecture projects</strong>
              <span>Manage project portfolios →</span>
            </Link>
            <Link href="/admin/artworks">
              <strong>Art gallery</strong>
              <span>Manage artwork and pricing →</span>
            </Link>
            <Link href="/admin/quizzes">
              <strong>Quiz management</strong>
              <span>Manage questions and quizzes →</span>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

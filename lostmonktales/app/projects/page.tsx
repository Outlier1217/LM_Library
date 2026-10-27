
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProjectGallery, { type PublicProject } from "./project-gallery";

export const metadata = {
  title: "Architecture Projects",
  description:
    "Explore architecture, residential, commercial and interior projects by LostMonkTales.",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<main className="public-projects"><p>Loading projects...</p></main>}>
      <ProjectsContent />
    </Suspense>
  );
}

async function ProjectsContent() {
  await connection();

  const records = await prisma.architectureProject.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  const projects: PublicProject[] = records.map((project) => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    category: project.category,
    location: project.location,
    coverImage: project.coverImage,
    isFeatured: project.isFeatured,
    images: project.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      caption: image.caption,
    })),
  }));

  return (
    <main className="public-projects">
      <header className="public-projects-header">
        <Link href="/" className="projects-brand">LostMonkTales</Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/blogs">Journal</Link>
          <Link href="/projects" aria-current="page">Projects</Link>
        </nav>
      </header>

      <section className="projects-hero">
        <p className="eyebrow">OUR PORTFOLIO</p>
        <h1>Spaces shaped by purpose.</h1>
        <p>
          Explore our architecture, residential, commercial and interior
          projects — each designed with thought, clarity and attention to detail.
        </p>
      </section>

      <section className="projects-listing">
        <div className="projects-listing-heading">
          <div>
            <p className="eyebrow">SELECTED WORK</p>
            <h2>Explore our projects</h2>
          </div>
          <span>{projects.length} {projects.length === 1 ? "PROJECT" : "PROJECTS"}</span>
        </div>

        <ProjectGallery projects={projects} />
      </section>

      <footer className="projects-footer">
        © 2026 LostMonkTales. All rights reserved.
      </footer>
    </main>
  );
}

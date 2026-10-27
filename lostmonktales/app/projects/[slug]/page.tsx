
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Project Details",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="project-detail"><p>Loading project...</p></main>}>
      <ProjectDetailContent params={params} />
    </Suspense>
  );
}

async function ProjectDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();

  const { slug } = await params;

  const project = await prisma.architectureProject.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!project) notFound();

  const galleryImages = [
    ...(project.coverImage
      ? [{
          url: project.coverImage,
          alt: project.title,
          caption: null as string | null,
        }]
      : []),
    ...project.images
      .filter((image) => image.url !== project.coverImage)
      .map((image) => ({
        url: image.url,
        alt: image.alt || project.title,
        caption: image.caption,
      })),
  ];

  return (
    <main className="project-detail">
      <header className="public-projects-header">
        <Link href="/" className="projects-brand">LostMonkTales</Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/projects">All projects</Link>
        </nav>
      </header>

      <section className="project-detail-hero">
        <div className="project-detail-hero-copy">
          <Link href="/projects" className="project-back-link">← All projects</Link>
          <p className="eyebrow">{project.category.replaceAll("_", " ")}</p>
          <h1>{project.title}</h1>
          {project.location && <p className="project-detail-location">{project.location}</p>}
          <p className="project-detail-description">{project.description}</p>
        </div>

        {galleryImages[0] && (
          <div className="project-detail-hero-image">
            <Image
              src={galleryImages[0].url}
              alt={galleryImages[0].alt || project.title}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 46vw"
            />
          </div>
        )}
      </section>

      <section className="project-facts">
        {project.clientName && (
          <div><span>CLIENT</span><strong>{project.clientName}</strong></div>
        )}
        {project.siteArea != null && (
          <div><span>SITE AREA</span><strong>{project.siteArea.toString()} {project.siteAreaUnit || ""}</strong></div>
        )}
        {project.builtUpArea != null && (
          <div><span>BUILT-UP AREA</span><strong>{project.builtUpArea.toString()} {project.builtUpAreaUnit || ""}</strong></div>
        )}
        {project.cost != null && (
          <div><span>PROJECT COST</span><strong>{project.costCurrency} {Number(project.cost).toLocaleString("en-IN")}</strong></div>
        )}
        {project.completionYear && (
          <div><span>COMPLETION</span><strong>{project.completionYear}</strong></div>
        )}
      </section>

      <section className="project-detail-gallery">
        <div className="project-gallery-heading">
          <p className="eyebrow">PROJECT GALLERY</p>
          <h2>Explore the details</h2>
        </div>

        {galleryImages.length > 0 ? (
          <div className="project-detail-image-grid">
            {galleryImages.map((image, index) => (
              <figure
                className={index === 0 ? "project-detail-image-feature" : ""}
                key={`${image.url}-${index}`}
              >
                <a href={image.url} target="_blank" rel="noreferrer" title="Open full-size image">
                  <Image
                    src={image.url}
                    alt={image.alt || project.title}
                    width={1200}
                    height={850}
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </a>
                {image.caption && <figcaption>{image.caption}</figcaption>}
              </figure>
            ))}
          </div>
        ) : (
          <p>Project images will be added soon.</p>
        )}
      </section>

      <footer className="projects-footer">
        <Link href="/projects">← Explore more projects</Link>
        <p>© 2026 LostMonkTales. All rights reserved.</p>
      </footer>
    </main>
  );
}

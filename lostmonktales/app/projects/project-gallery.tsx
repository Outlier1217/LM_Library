
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string | null;
  coverImage: string | null;
  isFeatured: boolean;
  images: {
    url: string;
    alt: string | null;
    caption: string | null;
  }[];
};

const categories = [
  { label: "All projects", value: "ALL" },
  { label: "Architecture", value: "ARCHITECTURE" },
  { label: "Interior", value: "INTERIOR" },
  { label: "Commercial", value: "COMMERCIAL" },
  { label: "Residential", value: "RESIDENTIAL" },
];

export default function ProjectGallery({
  projects,
}: {
  projects: PublicProject[];
}) {
  const [category, setCategory] = useState("ALL");

  const filteredProjects = useMemo(
    () =>
      category === "ALL"
        ? projects
        : projects.filter((project) => project.category === category),
    [projects, category]
  );

  return (
    <>
      <div className="project-filters" aria-label="Filter projects by category">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={category === item.value ? "project-filter active" : "project-filter"}
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <h3>No projects in this category yet.</h3>
          <p>New work will appear here as projects are published.</p>
          <button type="button" onClick={() => setCategory("ALL")}>
            View all projects
          </button>
        </div>
      ) : (
        <div className="public-project-grid">
          {filteredProjects.map((project) => {
            const image = project.coverImage || project.images[0]?.url;

            return (
              <article className="public-project-card" key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="public-project-image"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={project.title}
                      width={900}
                      height={650}
                      sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="project-no-image">LostMonkTales</div>
                  )}

                  {project.isFeatured && (
                    <span className="project-featured-label">Featured</span>
                  )}
                </Link>

                <div className="public-project-card-copy">
                  <p className="eyebrow">{project.category.replaceAll("_", " ")}</p>
                  <h3>
                    <Link href={`/projects/${project.slug}`}>
                      {project.title}
                    </Link>
                  </h3>

                  {project.location && <p className="project-location">{project.location}</p>}

                  <p className="project-card-description">
                    {project.description.length > 150
                      ? `${project.description.slice(0, 150).trim()}…`
                      : project.description}
                  </p>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="project-read-more"
                  >
                    Explore project →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

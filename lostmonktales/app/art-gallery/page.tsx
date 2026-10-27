
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Artwork = {
  id: string;
  title: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  images: { id: string; url: string; alt: string | null }[];
  categories: { category: Category }[];
};

export default function ArtGalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const response = await fetch("/api/gallery/artworks");
        if (!response.ok) throw new Error("Gallery could not be loaded.");

        const data = await response.json();
        if (!cancelled) {
          setArtworks(data.artworks ?? []);
          setCategories(data.categories ?? []);
        }
      } catch {
        if (!cancelled) setError("Gallery load nahi ho paayi. Please refresh karke try karein.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredArtworks = useMemo(() => {
    if (activeCategory === "all") return artworks;

    return artworks.filter((artwork) =>
      artwork.categories.some(
        (item) => item.category.slug === activeCategory,
      ),
    );
  }, [artworks, activeCategory]);

  return (
    <main className="public-gallery">
      <section className="public-gallery-hero">
        <p className="public-gallery-eyebrow">THE ART COLLECTION</p>
        <h1>Art Gallery<span>.</span></h1>
        <p className="public-gallery-intro">
          A collection of ideas, expressions, and stories told through art.
          Explore the work and discover the details behind each piece.
        </p>
        <div className="public-gallery-count">
          {artworks.length} {artworks.length === 1 ? "ARTWORK" : "ARTWORKS"}
        </div>
      </section>

      <section className="public-gallery-content">
        <div className="public-gallery-toolbar">
          <div>
            <p className="public-gallery-eyebrow">EXPLORE THE COLLECTION</p>
            <h2>Selected Works</h2>
          </div>

          <div className="public-gallery-filters" aria-label="Filter by category">
            <button
              type="button"
              className={activeCategory === "all" ? "active" : ""}
              onClick={() => setActiveCategory("all")}
            >
              All works
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={activeCategory === category.slug ? "active" : ""}
                onClick={() => setActiveCategory(category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="public-gallery-message">Loading the collection…</div>
        ) : error ? (
          <div className="public-gallery-message">{error}</div>
        ) : filteredArtworks.length === 0 ? (
          <div className="public-gallery-message">
            No published artworks found in this category yet.
          </div>
        ) : (
          <div className="public-gallery-grid">
            {filteredArtworks.map((artwork) => {
              const cover = artwork.images[0];

              return (
                <Link
                  href={`/art-gallery/${encodeURIComponent(artwork.slug)}`}
                  className="public-artwork-card"
                  key={artwork.id}
                >
                  <div className="public-artwork-image">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover.url}
                        alt={cover.alt || artwork.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="public-artwork-no-image">Artwork</div>
                    )}

                    {artwork.isFeatured && (
                      <span className="public-artwork-featured">Featured</span>
                    )}
                    <span className="public-artwork-view">View artwork ↗</span>
                  </div>

                  <div className="public-artwork-info">
                    <div className="public-artwork-categories">
                      {artwork.categories.slice(0, 2).map(({ category }) => (
                        <span key={category.id}>{category.name}</span>
                      ))}
                    </div>
                    <h3>{artwork.title}</h3>
                    <p>{artwork.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

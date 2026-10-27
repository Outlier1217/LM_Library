
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ArtworkCategory =
  | "PENCIL_PORTRAIT"
  | "PAINTING"
  | "OIL_PAINTING"
  | "ACRYLIC"
  | "OTHER";

type GalleryArtwork = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ArtworkCategory;
  price: number;
  currency: string;
  dimensions: string | null;
  medium: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  images: {
    id: string;
    url: string;
    alt: string | null;
  }[];
};

const categories: { label: string; value: string }[] = [
  { label: "All Artworks", value: "ALL" },
  { label: "Pencil Portraits", value: "PENCIL_PORTRAIT" },
  { label: "Paintings", value: "PAINTING" },
  { label: "Oil Paintings", value: "OIL_PAINTING" },
  { label: "Acrylic", value: "ACRYLIC" },
  { label: "Other Art", value: "OTHER" },
];

function categoryLabel(category: ArtworkCategory) {
  return (
    categories.find((item) => item.value === category)?.label ??
    "Original Artwork"
  );
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("en-IN")}`;
  }
}

export default function ArtGallery({
  artworks,
}: {
  artworks: GalleryArtwork[];
}) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredArtworks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return artworks.filter((artwork) => {
      const categoryMatches =
        activeCategory === "ALL" ||
        artwork.category === activeCategory;

      const searchMatches =
        !query ||
        artwork.title.toLowerCase().includes(query) ||
        artwork.description.toLowerCase().includes(query) ||
        categoryLabel(artwork.category).toLowerCase().includes(query) ||
        (artwork.medium ?? "").toLowerCase().includes(query);

      return categoryMatches && searchMatches;
    });
  }, [artworks, activeCategory, search]);

  const featuredCount = artworks.filter(
    (artwork) => artwork.isFeatured
  ).length;

  return (
    <main className="art-page">
      <section className="art-hero">
        <div className="art-hero-inner">
          <p className="art-eyebrow">THE ART COLLECTION</p>

          <h1>
            Art that speaks.
            <br />
            <span>Stories that stay.</span>
          </h1>

          <p className="art-hero-description">
            Explore original artworks created with imagination,
            patience and passion. Find a piece that speaks to you.
          </p>

          <a href="#artworks" className="art-explore-button">
            Explore the collection <span aria-hidden="true">↘</span>
          </a>

          <div className="art-hero-stats">
            <div>
              <strong>{artworks.length}</strong>
              <span>Artworks</span>
            </div>
            <div>
              <strong>{featuredCount}</strong>
              <span>Featured pieces</span>
            </div>
            <div>
              <strong>
                {artworks.filter((artwork) => artwork.isAvailable).length}
              </strong>
              <span>Available now</span>
            </div>
          </div>
        </div>
      </section>

      <section className="art-collection" id="artworks">
        <div className="art-section-heading">
          <div>
            <p className="art-eyebrow">MADE WITH PASSION</p>
            <h2>Discover the collection</h2>
            <p className="art-section-description">
              Every piece has its own character. Find the one that feels
              right for you.
            </p>
          </div>

          <div className="art-search-wrap">
            <label className="sr-only" htmlFor="art-search">
              Search artworks
            </label>
            <input
              id="art-search"
              type="search"
              placeholder="Search artworks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="art-category-filters" aria-label="Filter artworks">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              className={
                activeCategory === category.value
                  ? "art-filter active"
                  : "art-filter"
              }
              onClick={() => setActiveCategory(category.value)}
              aria-pressed={activeCategory === category.value}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="art-results-count" aria-live="polite">
          Showing {filteredArtworks.length}{" "}
          {filteredArtworks.length === 1 ? "artwork" : "artworks"}
        </div>

        {filteredArtworks.length > 0 ? (
          <div className="art-grid">
            {filteredArtworks.map((artwork) => {
              const cover = artwork.images[0];

              return (
                <article className="art-card" key={artwork.id}>
                  <Link
                    href={`/art/${artwork.slug}`}
                    className="art-card-image-link"
                    aria-label={`View ${artwork.title}`}
                  >
                    <div className="art-card-image">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover.url}
                          alt={cover.alt || artwork.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="art-no-image">
                          <span>Artwork image coming soon</span>
                        </div>
                      )}

                      {artwork.isFeatured && (
                        <span className="art-featured-badge">
                          Featured
                        </span>
                      )}

                      {!artwork.isAvailable && (
                        <span className="art-unavailable-badge">
                          Unavailable
                        </span>
                      )}

                      <span className="art-view-overlay">
                        View artwork <span aria-hidden="true">↗</span>
                      </span>
                    </div>
                  </Link>

                  <div className="art-card-content">
                    <p className="art-card-category">
                      {categoryLabel(artwork.category)}
                    </p>

                    <h3>
                      <Link href={`/art/${artwork.slug}`}>
                        {artwork.title}
                      </Link>
                    </h3>

                    <p className="art-card-description">
                      {artwork.description}
                    </p>

                    <div className="art-card-bottom">
                      <strong className="art-card-price">
                        {formatPrice(artwork.price, artwork.currency)}
                      </strong>

                      <Link
                        href={`/art/${artwork.slug}`}
                        className="art-card-arrow"
                        aria-label={`View details for ${artwork.title}`}
                      >
                        ↗
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="art-empty-state">
            <span aria-hidden="true">✳</span>
            <h3>No artworks found</h3>
            <p>
              {artworks.length === 0
                ? "The collection is being prepared. Please check back soon."
                : "Try another search or select a different category."}
            </p>

            {(search || activeCategory !== "ALL") && (
              <button
                type="button"
                className="art-reset-button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("ALL");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

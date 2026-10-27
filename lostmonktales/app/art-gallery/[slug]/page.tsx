
"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Artwork = {
  id: string;
  title: string;
  description: string;
  images: { id: string; url: string; alt: string | null }[];
  categories: {
    category: { id: string; name: string; slug: string };
  }[];
};

export default function ArtworkDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="public-gallery-message">
          Loading artwork…
        </main>
      }
    >
      <ArtworkDetailContent />
    </Suspense>
  );
}

function ArtworkDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadArtwork() {
      try {
        const response = await fetch(
          `/api/gallery/artworks/${encodeURIComponent(slug)}`,
        );

        if (response.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!response.ok) throw new Error("Unable to load artwork.");

        const data = await response.json();
        if (!cancelled) setArtwork(data.artwork);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) loadArtwork();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <main className="public-gallery-message">Loading artwork…</main>;
  }

  if (notFound || !artwork) {
    return (
      <main className="public-gallery-message">
        <h1>Artwork not found</h1>
        <p>This artwork may have been removed or is not published.</p>
        <Link href="/art-gallery">← Back to Gallery</Link>
      </main>
    );
  }

  return (
    <main className="public-gallery public-artwork-detail">
      <div className="public-detail-topbar">
        <Link href="/art-gallery">← Back to Gallery</Link>
        <span>ART COLLECTION</span>
      </div>

      <header className="public-detail-heading">
        <div className="public-artwork-categories">
          {artwork.categories.map(({ category }) => (
            <span key={category.id}>{category.name}</span>
          ))}
        </div>
        <h1>{artwork.title}</h1>
        <p>{artwork.description}</p>
      </header>

      <section className="public-detail-images" aria-label="Artwork images">
        {artwork.images.map((image, index) => (
          <figure key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt || `${artwork.title} — image ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </figure>
        ))}
      </section>

      <footer className="public-detail-footer">
        <p>Thank you for exploring this piece.</p>
        <Link href="/art-gallery">Explore more artworks ↗</Link>
      </footer>
    </main>
  );
}

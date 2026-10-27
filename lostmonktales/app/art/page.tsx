
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import ArtGallery from "./art-gallery";

async function ArtGalleryContent() {
  await connection();

  const artworks = await prisma.artwork.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
  });

  const galleryArtworks = artworks.map((artwork) => ({
    id: artwork.id,
    title: artwork.title,
    slug: artwork.slug,
    description: artwork.description,
    category: artwork.category,
    price: Number(artwork.price),
    currency: artwork.currency,
    dimensions: artwork.dimensions,
    medium: artwork.medium,
    isAvailable: artwork.isAvailable,
    isFeatured: artwork.isFeatured,
    images: artwork.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
    })),
  }));

  return <ArtGallery artworks={galleryArtworks} />;
}

export default function ArtPage() {
  return (
    <Suspense
      fallback={
        <main className="art-page">
          <div className="art-loading">Loading the art collection...</div>
        </main>
      }
    >
      <ArtGalleryContent />
    </Suspense>
  );
}

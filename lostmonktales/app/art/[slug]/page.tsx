
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
};

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

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    PENCIL_PORTRAIT: "Pencil Portrait",
    PAINTING: "Painting",
    OIL_PAINTING: "Oil Painting",
    ACRYLIC: "Acrylic Painting",
    OTHER: "Original Artwork",
  };

  return labels[category] ?? "Original Artwork";
}

export default async function ArtworkDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="art-detail-page">
          <div className="art-detail-container">
            <p className="art-detail-loading">Loading artwork...</p>
          </div>
        </main>
      }
    >
      <ArtworkDetailContent params={params} />
    </Suspense>
  );
}

async function ArtworkDetailContent({ params }: Props) {
  await connection();

  const { slug } = await params;

  const artwork = await prisma.artwork.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!artwork) {
    notFound();
  }

  const phoneDigits = (artwork.contactNumber ?? "").replace(/\D/g, "");
  const whatsappNumber =
    phoneDigits.length >= 10 ? phoneDigits : "";

  const message = `Hi, I'm interested in "${artwork.title}" (${formatPrice(
    Number(artwork.price),
    artwork.currency
  )}). Please share more details.`;

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <main className="art-detail-page">
      <div className="art-detail-container">
        <nav className="art-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/art">Art Gallery</Link>
          <span>/</span>
          <span>{artwork.title}</span>
        </nav>

        <div className="art-detail-layout">
          <section className="art-detail-gallery">
            {artwork.images.length > 0 ? (
              artwork.images.map((image, index) => (
                <div className="art-detail-image" key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt || `${artwork.title} — image ${index + 1}`}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </div>
              ))
            ) : (
              <div className="art-detail-no-image">
                Artwork image unavailable
              </div>
            )}
          </section>

          <section className="art-detail-info">
            <p className="art-eyebrow">
              {getCategoryLabel(artwork.category)}
            </p>

            {artwork.isFeatured && (
              <span className="art-detail-featured">
                Featured Artwork
              </span>
            )}

            <h1>{artwork.title}</h1>

            <p className="art-detail-price">
              {formatPrice(Number(artwork.price), artwork.currency)}
            </p>

            <div className="art-detail-availability">
              <span
                className={
                  artwork.isAvailable
                    ? "art-status-dot available"
                    : "art-status-dot unavailable"
                }
              />
              {artwork.isAvailable
                ? "Currently available"
                : "Currently unavailable"}
            </div>

            <div className="art-detail-description">
              {artwork.description}
            </div>

            <div className="art-detail-specifications">
              {artwork.medium && (
                <div>
                  <span>Medium</span>
                  <strong>{artwork.medium}</strong>
                </div>
              )}

              {artwork.dimensions && (
                <div>
                  <span>Dimensions</span>
                  <strong>{artwork.dimensions}</strong>
                </div>
              )}

              <div>
                <span>Category</span>
                <strong>{getCategoryLabel(artwork.category)}</strong>
              </div>
            </div>

            {artwork.isAvailable && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="art-contact-button"
              >
                Enquire on WhatsApp <span aria-hidden="true">↗</span>
              </a>
            )}

            {!artwork.isAvailable && (
              <p className="art-detail-note">
                This artwork is currently unavailable. Explore the gallery
                to discover other pieces.
              </p>
            )}

            {artwork.isAvailable && !whatsappUrl && (
              <p className="art-detail-note">
                For pricing or availability enquiries, please use the
                website&apos;s contact page.
              </p>
            )}

            <Link href="/art" className="art-back-link">
              ← Back to the art collection
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

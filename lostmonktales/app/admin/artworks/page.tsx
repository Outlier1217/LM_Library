
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ArtworkImage = {
  id?: string;
  url: string;
  alt?: string | null;
};

type Artwork = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: string | number;
  currency: string;
  dimensions: string | null;
  medium: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  status: "DRAFT" | "PUBLISHED";
  contactNumber: string | null;
  images: ArtworkImage[];
};

type ArtworkForm = {
  title: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  dimensions: string;
  medium: string;
  isAvailable: boolean;
  isFeatured: boolean;
  status: "DRAFT" | "PUBLISHED";
  contactNumber: string;
  images: ArtworkImage[];
};

const blank: ArtworkForm = {
  title: "",
  slug: "",
  description: "",
  category: "PENCIL_PORTRAIT",
  price: "",
  currency: "INR",
  dimensions: "",
  medium: "",
  isAvailable: true,
  isFeatured: false,
  status: "DRAFT",
  contactNumber: "",
  images: [],
};

const categoryLabels: Record<string, string> = {
  PENCIL_PORTRAIT: "Pencil Portrait",
  PAINTING: "Painting",
  OIL_PAINTING: "Oil Painting",
  ACRYLIC: "Acrylic Painting",
  OTHER: "Other Artwork",
};

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [form, setForm] = useState<ArtworkForm>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/artworks", {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load artwork.");

      setArtworks(data.artworks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load artwork.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  function setField<K extends keyof ArtworkForm>(
    key: K,
    value: ArtworkForm[K]
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function editArtwork(artwork: Artwork) {
    setError("");
    setNotice("");
    setEditingId(artwork.id);
    setForm({
      title: artwork.title,
      slug: artwork.slug,
      description: artwork.description,
      category: artwork.category,
      price: String(artwork.price),
      currency: artwork.currency,
      dimensions: artwork.dimensions || "",
      medium: artwork.medium || "",
      isAvailable: artwork.isAvailable,
      isFeatured: artwork.isFeatured,
      status: artwork.status,
      contactNumber: artwork.contactNumber || "",
      images: artwork.images.map((image) => ({
        url: image.url,
        alt: image.alt || artwork.title,
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    setError("");
    setNotice("");
    setUploading(true);

    try {
      const uploaded: ArtworkImage[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/artworks/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Upload failed: ${file.name}`);
        }

        uploaded.push({ url: data.imageUrl, alt: file.name });
      }

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...uploaded].slice(0, 30),
      }));
      setNotice(`${uploaded.length} image(s) uploaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/artworks/${editingId}`
          : "/api/admin/artworks",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not save artwork.");

      setNotice(editingId ? "Artwork updated successfully." : "Artwork created successfully.");
      setForm(blank);
      setEditingId(null);
      await loadArtworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save artwork.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArtwork(artwork: Artwork) {
    if (!window.confirm(`Permanently delete "${artwork.title}"?`)) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/artworks/${artwork.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Delete failed.");

      if (editingId === artwork.id) {
        setEditingId(null);
        setForm(blank);
      }

      setNotice("Artwork deleted.");
      await loadArtworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-brand">
          LostMonkTales
        </Link>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/blogs">Blog management</Link>
          <Link href="/admin/projects">Architecture projects</Link>
          <Link href="/admin/artworks" className="admin-nav-active">
            Art gallery
          </Link>
          <Link href="/admin/quizzes">Quiz management</Link>
          <Link href="/admin/settings">Website settings</Link>
        </nav>
        <Link href="/" className="admin-view-site">View website ↗</Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">ART STUDIO</p>
            <h1>Artwork management</h1>
          </div>
          <Link href="/admin" className="back-link">← Dashboard</Link>
        </header>

        <section className="admin-welcome">
          <p className="eyebrow">YOUR COLLECTION</p>
          <h2>{editingId ? "Edit artwork" : "Add new artwork"}</h2>
          <p>Upload original artwork, manage prices and publish your collection.</p>
        </section>

        {error && <p className="admin-message admin-message-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-message-success" role="status">{notice}</p>}

        <form className="blog-editor-form" onSubmit={submit}>
          <label htmlFor="art-title">Artwork title *</label>
          <input id="art-title" required maxLength={200} value={form.title}
            onChange={(e) => setField("title", e.target.value)} />

          <label htmlFor="art-slug">URL slug (optional)</label>
          <input id="art-slug" value={form.slug} placeholder="portrait-in-charcoal"
            onChange={(e) => setField("slug", e.target.value)} />

          <label htmlFor="art-description">Description *</label>
          <textarea id="art-description" required rows={6} value={form.description}
            onChange={(e) => setField("description", e.target.value)} />

          <label htmlFor="art-category">Category *</label>
          <select id="art-category" value={form.category}
            onChange={(e) => setField("category", e.target.value)}>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <label htmlFor="art-price">Price *</label>
          <div className="project-number-row">
            <select aria-label="Currency" value={form.currency}
              onChange={(e) => setField("currency", e.target.value)}>
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
            </select>
            <input id="art-price" type="number" required min="0" step="0.01"
              value={form.price} onChange={(e) => setField("price", e.target.value)} />
          </div>

          <label htmlFor="art-medium">Medium / material</label>
          <input id="art-medium" value={form.medium}
            placeholder="Graphite on paper, acrylic on canvas..."
            onChange={(e) => setField("medium", e.target.value)} />

          <label htmlFor="art-dimensions">Dimensions</label>
          <input id="art-dimensions" value={form.dimensions}
            placeholder="e.g. 12 × 16 inches"
            onChange={(e) => setField("dimensions", e.target.value)} />

          <label htmlFor="art-contact">Purchase contact number</label>
          <input id="art-contact" type="tel" value={form.contactNumber}
            placeholder="+91..."
            onChange={(e) => setField("contactNumber", e.target.value)} />

          <label htmlFor="art-images">Upload artwork images (up to 30)</label>
          <input id="art-images" type="file" multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading || form.images.length >= 30}
            onChange={(e) => {
              void uploadImages(e.target.files);
              e.currentTarget.value = "";
            }} />
          <p className="art-upload-hint">JPG, PNG, WebP or GIF. Maximum 5 MB per image.</p>

          {uploading && <p>Uploading images...</p>}

          {form.images.length > 0 && (
            <div className="art-admin-image-grid">
              {form.images.map((image, index) => (
                <div className="art-admin-image" key={`${image.url}-${index}`}>
                  <img src={image.url} alt={image.alt || "Artwork preview"} />
                  <input aria-label={`Image ${index + 1} alt text`}
                    value={image.alt || ""}
                    onChange={(e) => setField("images", form.images.map((item, i) =>
                      i === index ? { ...item, alt: e.target.value } : item
                    ))}
                    placeholder="Image description" />
                  <button type="button" className="admin-secondary-button"
                    onClick={() => setField("images", form.images.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="blog-featured-checkbox">
            <input type="checkbox" checked={form.isAvailable}
              onChange={(e) => setField("isAvailable", e.target.checked)} />
            Available for purchase
          </label>

          <label className="blog-featured-checkbox">
            <input type="checkbox" checked={form.isFeatured}
              onChange={(e) => setField("isFeatured", e.target.checked)} />
            Feature this artwork
          </label>

          <label htmlFor="art-status">Publication status</label>
          <select id="art-status" value={form.status}
            onChange={(e) => setField("status", e.target.value as ArtworkForm["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <div className="blog-editor-actions">
            <button type="submit" disabled={saving || uploading}>
              {saving ? "Saving..." : editingId ? "Update artwork" : "Save artwork"}
            </button>
            {editingId && (
              <button type="button" className="admin-secondary-button"
                onClick={() => { setEditingId(null); setForm(blank); setError(""); setNotice(""); }}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="admin-blog-list">
          <div className="section-heading">
            <h2>Existing artwork</h2>
            <button type="button" className="admin-secondary-button"
              onClick={() => void loadArtworks()}>Refresh</button>
          </div>

          {loading ? <p>Loading artwork...</p> : artworks.length === 0 ? (
            <p>No artwork yet. Add your first piece above.</p>
          ) : (
            <div className="admin-blog-table-wrap">
              <table className="admin-blog-table">
                <thead>
                  <tr><th>Artwork</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {artworks.map((artwork) => (
                    <tr key={artwork.id}>
                      <td>
                        <strong>{artwork.title}</strong>
                        <span className="admin-blog-slug">/art/{artwork.slug}</span>
                      </td>
                      <td>{categoryLabels[artwork.category] || artwork.category}</td>
                      <td>{artwork.currency} {Number(artwork.price).toLocaleString("en-IN")}</td>
                      <td>{artwork.status}</td>
                      <td>
                        <div className="admin-blog-row-actions">
                          <button type="button" onClick={() => editArtwork(artwork)}>Edit</button>
                          <button type="button" className="admin-delete-button"
                            onClick={() => void deleteArtwork(artwork)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

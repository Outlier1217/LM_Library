"use client";

import { useCallback, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type GalleryImage = {
  id?: string;
  url: string;
  alt?: string | null;
};

type Artwork = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  images: GalleryImage[];
  categories: { category: Category }[];
};

export default function GalleryArtworksAdminPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gallery/artworks", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load gallery data.");
      }

      setArtworks(data.artworks ?? []);
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load gallery data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function makeSlug(value: string) {
    return value
      .normalize("NFKD")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/gallery/artworks/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("Your admin session has expired.");
    }

    if (!response.ok) {
      throw new Error(data.error || `Could not upload ${file.name}.`);
    }

    return data.imageUrl as string;
  }

  async function saveArtwork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (categoryIds.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    setSaving(true);

    try {
if (files.length === 0) {
  setError("Please select at least one artwork image.");
  setSaving(false);
  return;
}

if (files.length > 30) {
  setError("Maximum 30 images allowed per artwork.");
  setSaving(false);
  return;
}

      const invalidFile = files.find(
        (file) =>
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) ||
          file.size === 0 ||
          file.size > 5 * 1024 * 1024
      );

      if (invalidFile) {
        setError(`${invalidFile.name}: choose a valid JPG, PNG, WebP or GIF under 5 MB.`);
        setSaving(false);
        return;
      }

      const uploadedImages = await Promise.all(
        files.map(async (file) => ({
          url: await uploadImage(file),
          alt: title.trim(),
        }))
      );

      const response = await fetch("/api/admin/gallery/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || makeSlug(title),
          description: description.trim(),
          categoryIds,
          images: uploadedImages,
          status,
          isFeatured,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not save artwork.");
      }

      setTitle("");
      setSlug("");
      setDescription("");
      setCategoryIds([]);
      setFiles([]);
      setStatus("DRAFT");
      setIsFeatured(false);

      const input = document.getElementById("gallery-images") as HTMLInputElement | null;
      if (input) input.value = "";

      setMessage("Artwork saved successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save artwork.");
    } finally {
      setSaving(false);
    }
  }

  async function updateArtwork(
    artwork: Artwork,
    changes: { status?: "DRAFT" | "PUBLISHED"; isFeatured?: boolean }
  ) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/gallery/artworks/${artwork.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not update artwork.");
      }

      setMessage("Artwork updated successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update artwork.");
    }
  }

  async function deleteArtwork(artwork: Artwork) {
    if (!window.confirm(`Delete "${artwork.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/gallery/artworks/${artwork.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not delete artwork.");
      }

      setMessage("Artwork deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete artwork.");
    }
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <a href="/" className="admin-sidebar-brand">LostMonkTales</a>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav className="admin-nav">
          <a href="/admin">Dashboard</a>
          <a href="/admin/blogs">Blog management</a>
          <a href="/admin/projects">Architecture projects</a>
          <a href="/admin/artworks">Art Store</a>
          <a href="/admin/art-gallery">Art Gallery Categories</a>
          <a href="/admin/art-gallery/artworks" className="admin-nav-active">
            Gallery Artworks
          </a>
          <a href="/admin/quizzes">Quiz management</a>
          <a href="/admin/settings">Website settings</a>
        </nav>
        <a href="/art-gallery" className="admin-view-site">View Gallery ↗</a>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="art-eyebrow">PORTFOLIO MANAGEMENT</p>
            <h1>Gallery Artworks</h1>
          </div>
          <a className="admin-secondary-button" href="/admin/art-gallery">
            Manage Categories
          </a>
        </header>

        <section className="admin-welcome">
          <h2>Showcase your artwork</h2>
          <p>Upload images, select categories and publish artwork to your public gallery. This is separate from the Art Store.</p>
        </section>

        <section className="art-category-admin-panel">
          <div className="art-category-admin-heading">
            <div>
              <h2>Add new artwork</h2>
              <p>JPG, PNG, WebP or GIF images up to 5 MB each.</p>
            </div>
          </div>

          <form className="art-category-form" onSubmit={saveArtwork}>
            <div className="gallery-form-grid">
              <div>
                <label htmlFor="gallery-title">Artwork title</label>
                <input
                  id="gallery-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!slug) setSlug(makeSlug(event.target.value));
                  }}
                  maxLength={200}
                  placeholder="e.g. Portrait in Charcoal"
                  required
                />
              </div>

              <div>
                <label htmlFor="gallery-slug">URL slug (optional)</label>
                <input
                  id="gallery-slug"
                  value={slug}
                  onChange={(event) => setSlug(makeSlug(event.target.value))}
                  placeholder="portrait-in-charcoal"
                />
              </div>
            </div>

            <label htmlFor="gallery-description">Description</label>
            <textarea
              id="gallery-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={50000}
              rows={5}
              placeholder="Tell visitors about this artwork..."
              required
            />

            <label htmlFor="gallery-category-select">Categories</label>
            <div id="gallery-category-select" className="gallery-category-checkboxes">
              {categories.length === 0 ? (
                <p>Create categories first from Manage Categories.</p>
              ) : (
                categories.map((category) => (
                  <label key={category.id} className="gallery-category-checkbox">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(category.id)}
                      onChange={(event) => {
                        setCategoryIds((current) =>
                          event.target.checked
                            ? [...current, category.id]
                            : current.filter((id) => id !== category.id)
                        );
                      }}
                    />
                    {category.name}
                  </label>
                ))
              )}
            </div>

            <label htmlFor="gallery-images">Artwork images</label>
            <input
              id="gallery-images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              required
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                setFiles(selected.slice(0, 30));
                if (selected.length > 30) {
                  setError("Maximum 30 images per artwork. Only the first 30 were selected.");
                } else {
                  setError("");
                }
              }}
            />

            <p className="gallery-upload-hint">
              {files.length > 0
                ? `${files.length} image(s) selected: ${files.map((file) => file.name).join(", ")}`
                : "Select up to 30 images. The first image will be used as the cover."}
            </p>

            <label htmlFor="gallery-status">Publication status</label>
            <select
              id="gallery-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED")}
            >
              <option value="DRAFT">Draft — keep private</option>
              <option value="PUBLISHED">Published — ready for public gallery</option>
            </select>

            <label className="gallery-featured-option">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              Mark as featured artwork
            </label>

            {message && <p className="admin-message art-category-success" role="status">{message}</p>}
            {error && <p className="admin-message art-category-error" role="alert">{error}</p>}

            <button
              type="submit"
              className="art-category-primary-button"
              disabled={saving || categories.length === 0}
            >
              {saving ? "Uploading and saving..." : "Save artwork"}
            </button>
          </form>
        </section>

        <section className="art-category-list-panel">
          <div className="art-category-list-heading">
            <div>
              <h2>Saved artworks</h2>
              <p>{artworks.length} artwork(s)</p>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => void loadData()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="art-category-empty">Loading artworks...</p>
          ) : artworks.length === 0 ? (
            <div className="art-category-empty">
              <h3>No artworks yet</h3>
              <p>Use the form above to upload your first artwork.</p>
            </div>
          ) : (
            <div className="gallery-artwork-admin-list">
              {artworks.map((artwork) => (
                <article className="gallery-artwork-admin-card" key={artwork.id}>
                  {artwork.images[0] && (
                    <img
                      src={artwork.images[0].url}
                      alt={artwork.images[0].alt || artwork.title}
                    />
                  )}

                  <div className="gallery-artwork-admin-info">
                    <h3>{artwork.title}</h3>
                    <p>{artwork.description}</p>
                    <p>
                      Categories:{" "}
                      {artwork.categories.map((item) => item.category.name).join(", ")}
                    </p>
                    <p>
                      Status: <strong>{artwork.status}</strong>
                      {" · "}
                      {artwork.isFeatured ? "Featured" : "Not featured"}
                      {" · "}
                      {artwork.images.length} image(s)
                    </p>
                    <code>{artwork.slug}</code>

                    <div className="gallery-artwork-admin-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          void updateArtwork(artwork, {
                            status: artwork.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                          })
                        }
                      >
                        {artwork.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          void updateArtwork(artwork, {
                            isFeatured: !artwork.isFeatured,
                          })
                        }
                      >
                        {artwork.isFeatured ? "Remove featured" : "Make featured"}
                      </button>

                      <button
                        type="button"
                        className="admin-delete-button"
                        onClick={() => void deleteArtwork(artwork)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

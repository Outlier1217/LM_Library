
"use client";

import { useCallback, useEffect, useState } from "react";

type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  _count?: {
    artworks: number;
  };
};

const defaultCategories = [
  "Pencil Portrait",
  "Painting",
  "Oil Painting",
  "Acrylic",
  "Other",
];

export default function AdminArtGalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gallery/categories", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load categories.");
      }

      setCategories(data.categories ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);

    try {
      const editing = Boolean(editingId);
      const url = editing
        ? `/api/admin/gallery/categories/${editingId}`
        : "/api/admin/gallery/categories";

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not save category.");
      }

      setName("");
      setEditingId(null);
      setMessage(data.message || "Category saved successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save category."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(category: GalleryCategory) {
    setEditingId(category.id);
    setName(category.name);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setError("");
    setMessage("");
  }

  async function deleteCategory(category: GalleryCategory) {
    const artworkCount = category._count?.artworks ?? 0;

    if (artworkCount > 0) {
      setError(
        `"${category.name}" is assigned to ${artworkCount} artwork(s). Remove it from those artworks before deleting this category.`
      );
      setMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Delete the category "${category.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/gallery/categories/${category.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not delete category.");
      }

      if (editingId === category.id) {
        cancelEditing();
      }

      setMessage(data.message || "Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete category."
      );
    }
  }

  async function addDefaultCategories() {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const existingNames = new Set(
        categories.map((category) => category.name.toLowerCase())
      );

      const missing = defaultCategories.filter(
        (category) => !existingNames.has(category.toLowerCase())
      );

      if (missing.length === 0) {
        setMessage("All starter categories already exist.");
        return;
      }

      const results = await Promise.all(
        missing.map(async (categoryName) => {
          const response = await fetch("/api/admin/gallery/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName }),
          });

          const data = await response.json();

          if (response.status === 401) {
            window.location.href = "/admin/login";
            throw new Error("Your admin session has expired.");
          }

          if (!response.ok) {
            throw new Error(data.error || `Could not add ${categoryName}.`);
          }

          return data.category;
        })
      );

      void results;
      setMessage("Starter categories added successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add starter categories."
      );
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-dashboard">

<aside className="admin-sidebar">
  <a href="/" className="admin-sidebar-brand">
    LostMonkTales
  </a>

  <p className="admin-sidebar-label">WORKSPACE</p>

  <nav className="admin-nav">
    <a href="/admin">Dashboard</a>
    <a href="/admin/blogs">Blog management</a>
    <a href="/admin/projects">Architecture projects</a>
    <a href="/admin/artworks">Art Store</a>
    <a href="/admin/art-gallery" className="admin-nav-active">
      Art Gallery Categories
    </a>
    <a href="/admin/quizzes">Quiz management</a>
    <a href="/admin/settings">Website settings</a>
  </nav>

  <a href="/" className="admin-view-site">
    View website ↗
  </a>
</aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="art-eyebrow">PORTFOLIO MANAGEMENT</p>
            <h1>Art Gallery Categories</h1>
          </div>
          <a
  className="admin-secondary-button"
  href="/admin/art-gallery/artworks"
>
  Manage Artworks
</a>

          <a
            className="admin-secondary-button"
            href="/art-gallery"
            target="_blank"
            rel="noreferrer"
          >
            View Gallery ↗
          </a>
          
        </header>

        <section className="admin-welcome">
          <h2>Organise your art collection</h2>
          <p>
            Create your own categories and organise showcase artworks.
            These categories belong to the public Art Gallery, not the Art Store.
          </p>
        </section>

        <section className="art-category-admin-panel">
          <div className="art-category-admin-heading">
            <div>
              <h2>{editingId ? "Rename category" : "Create a category"}</h2>
              <p>
                Use names such as Charcoal Art, Watercolour, Digital Art or
                any category you prefer.
              </p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={addDefaultCategories}
              disabled={saving}
            >
              Add starter categories
            </button>
          </div>

          <form className="art-category-form" onSubmit={saveCategory}>
            <label htmlFor="gallery-category-name">Category name</label>

            <div className="art-category-form-row">
              <input
                id="gallery-category-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Charcoal Art"
                maxLength={80}
                required
              />

              <button
                type="submit"
                className="art-category-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <p className="admin-message art-category-success" role="status">
              {message}
            </p>
          )}

          {error && (
            <p className="admin-message art-category-error" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="art-category-list-panel">
          <div className="art-category-list-heading">
            <div>
              <h2>Your categories</h2>
              <p>
                {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"} created
              </p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={loadCategories}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="art-category-empty">Loading categories...</p>
          ) : categories.length === 0 ? (
            <div className="art-category-empty">
              <h3>No categories yet</h3>
              <p>Create a category above or add the starter categories.</p>
            </div>
          ) : (
            <div className="art-category-table-wrap">
              <table className="art-category-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Artworks</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>
                        <code>{category.slug}</code>
                      </td>
                      <td>{category._count?.artworks ?? 0}</td>
                      <td>
                        <div className="art-category-actions">
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => startEditing(category)}
                          >
                            Rename
                          </button>

                          <button
                            type="button"
                            className="admin-delete-button"
                            onClick={() => void deleteCategory(category)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

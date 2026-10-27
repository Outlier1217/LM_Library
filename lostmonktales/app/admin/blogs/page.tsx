
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  youtubeUrl: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
};

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  coverImage: "",
  youtubeUrl: "",
  tags: "",
  status: "DRAFT",
  isFeatured: false,
};



function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    let id = "";

    if (parsed.hostname === "youtu.be") {
      id = parsed.pathname.slice(1);
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(parsed.hostname)
    ) {
      if (parsed.pathname === "/watch") {
        id = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.split("/")[2] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}


export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/blogs", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(data.error || "Could not load blogs.");
      }

      setBlogs(data.blogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load blogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs]);

  function updateField<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function startEdit(blog: Blog) {
    setError("");
    setNotice("");
    setEditingId(blog.id);
    setForm({
      ...emptyForm,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      category: blog.category || "",
      coverImage: (blog as Blog & { coverImage?: string | null }).coverImage || "",
      youtubeUrl: (blog as Blog & { youtubeUrl?: string | null }).youtubeUrl || "",
      status: blog.status,
      isFeatured: blog.isFeatured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(data.error || "Could not save blog.");
      }

      setNotice(editingId ? "Blog updated successfully." : "Blog created successfully.");
      setForm(emptyForm);
      setEditingId(null);
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save blog.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog(blog: Blog) {
    if (!window.confirm(`Delete "${blog.title}" permanently? This cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete blog.");
      }

      if (editingId === blog.id) resetForm();
      setNotice("Blog deleted.");
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete blog.");
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-brand">LostMonkTales</Link>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/blogs" className="admin-nav-active">Blog management</Link>
          <Link href="/admin/projects">Architecture projects</Link>
          <Link href="/admin/artworks">Art gallery</Link>
          <Link href="/admin/quizzes">Quiz management</Link>
          <Link href="/admin/settings">Website settings</Link>
        </nav>
        <Link href="/" className="admin-view-site">View website ↗</Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">CONTENT MANAGEMENT</p>
            <h1>Blog management</h1>
          </div>
          <Link href="/admin" className="back-link">← Dashboard</Link>
        </header>

        <section className="admin-welcome">
          <p className="eyebrow">THE LOST MONK JOURNAL</p>
          <h2>{editingId ? "Edit article" : "Create a new article"}</h2>
          <p>Save a draft to continue later, or publish it to make it visible on the public Journal.</p>
        </section>

        {error && <p className="admin-message admin-message-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-message-success" role="status">{notice}</p>}

        <form className="blog-editor-form" onSubmit={handleSubmit}>
          <label htmlFor="blog-title">Title *</label>
          <input id="blog-title" required maxLength={200} value={form.title}
            onChange={(event) => updateField("title", event.target.value)} />

          <label htmlFor="blog-slug">URL slug (optional)</label>
          <input id="blog-slug" placeholder="my-first-article" value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)} />
          <p className="blog-editor-help">Letters and numbers separated by hyphens work best.</p>

          <label htmlFor="blog-category">Category</label>
          <input id="blog-category" placeholder="Architecture, Ideas, Learning..." value={form.category}
            onChange={(event) => updateField("category", event.target.value)} />

          <label htmlFor="blog-excerpt">Excerpt *</label>
          <textarea id="blog-excerpt" required maxLength={1000} rows={3} value={form.excerpt}
            onChange={(event) => updateField("excerpt", event.target.value)} />

          <label htmlFor="blog-content">Full article content *</label>
          <textarea id="blog-content" required rows={12} maxLength={100000} value={form.content}
            onChange={(event) => updateField("content", event.target.value)} />


<label htmlFor="blog-image-file">Cover image</label>
<input
  id="blog-image-file"
  type="file"
  accept="image/jpeg,image/png,image/webp,image/gif"
  onChange={async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setError("");
    setNotice("Uploading image...");

    try {
      const response = await fetch("/api/admin/blogs/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      updateField("coverImage", data.imageUrl);
      setNotice("Image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
      setNotice("");
    } finally {
      event.target.value = "";
    }
  }}
/>

{form.coverImage && (
  <div style={{ marginTop: 12 }}>
    <p className="blog-editor-help">Selected cover image preview</p>
    <img
      src={form.coverImage}
      alt="Cover image preview"
      style={{
        display: "block",
        width: "100%",
        maxWidth: 420,
        maxHeight: 260,
        objectFit: "contain",
        marginTop: 8,
      }}
    />
    <button
      type="button"
      className="admin-secondary-button"
      onClick={() => updateField("coverImage", "")}
    >
      Remove cover image
    </button>
  </div>
)}

<label htmlFor="blog-youtube">YouTube video URL (optional)</label>
<input
  id="blog-youtube"
  type="url"
  placeholder="https://www.youtube.com/watch?v=..."
  value={form.youtubeUrl}
  onChange={(event) => updateField("youtubeUrl", event.target.value)}
/>

{form.youtubeUrl && getYouTubeId(form.youtubeUrl) && (
  <div style={{ marginTop: 12 }}>
    <p className="blog-editor-help">YouTube thumbnail preview</p>
    <img
      src={`https://img.youtube.com/vi/${getYouTubeId(form.youtubeUrl)}/hqdefault.jpg`}
      alt="YouTube thumbnail preview"
      style={{
        display: "block",
        width: "100%",
        maxWidth: 420,
        marginTop: 8,
      }}
    />
  </div>
)}

{form.youtubeUrl && !getYouTubeId(form.youtubeUrl) && (
  <p className="admin-message admin-message-error">
    Enter a valid YouTube video URL.
  </p>
)}

          <p className="blog-editor-help">This field accepts an existing public image path or HTTP(S) URL. File upload will be added separately.</p>

          <label htmlFor="blog-tags">Tags (comma separated)</label>
          <input id="blog-tags" placeholder="architecture, design, ideas" value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)} />

          <label htmlFor="blog-status">Publication status</label>
          <select id="blog-status" value={form.status}
            onChange={(event) => updateField("status", event.target.value as BlogForm["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <label className="blog-featured-checkbox">
            <input type="checkbox" checked={form.isFeatured}
              onChange={(event) => updateField("isFeatured", event.target.checked)} />
            Feature this article on the Journal page
          </label>

          <div className="blog-editor-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update article" : "Save article"}
            </button>
            {editingId && (
              <button type="button" className="admin-secondary-button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="admin-blog-list">
          <div className="section-heading">
            <h2>Existing articles</h2>
            <button type="button" className="admin-secondary-button" onClick={() => void loadBlogs()}>
              Refresh
            </button>
          </div>

          {loading ? <p>Loading articles...</p> : blogs.length === 0 ? (
            <p>No articles yet. Create your first one above.</p>
          ) : (
            <div className="admin-blog-table-wrap">
              <table className="admin-blog-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog.id}>
                      <td>
                        <strong>{blog.title}</strong>
                        <span className="admin-blog-slug">/blogs/{blog.slug}</span>
                      </td>
                      <td>
                        <span className={blog.status === "PUBLISHED" ? "blog-status-published" : "blog-status-draft"}>
                          {blog.status}
                        </span>
                      </td>
                      <td>{blog.isFeatured ? "Yes" : "No"}</td>
                      <td>
                        <div className="admin-blog-row-actions">
                          <button type="button" onClick={() => startEdit(blog)}>Edit</button>
                          {blog.status === "PUBLISHED" && (
                            <a href={`/blogs/${blog.slug}`} target="_blank" rel="noreferrer">View</a>
                          )}
                          <button type="button" className="admin-delete-button" onClick={() => void deleteBlog(blog)}>
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
      </section>
    </main>
  );
}

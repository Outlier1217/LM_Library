
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ProjectImage = {
  id?: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  clientName: string | null;
  location: string | null;
  siteArea: string | null;
  siteAreaUnit: string | null;
  cost: string | null;
  costCurrency: string;
  builtUpArea: string | null;
  builtUpAreaUnit: string | null;
  completionYear: number | null;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  images: ProjectImage[];
};

type ProjectForm = {
  title: string;
  slug: string;
  description: string;
  category: string;
  clientName: string;
  location: string;
  siteArea: string;
  siteAreaUnit: string;
  cost: string;
  costCurrency: string;
  builtUpArea: string;
  builtUpAreaUnit: string;
  completionYear: string;
  coverImage: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  images: ProjectImage[];
};

const blank: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  category: "ARCHITECTURE",
  clientName: "",
  location: "",
  siteArea: "",
  siteAreaUnit: "sq ft",
  cost: "",
  costCurrency: "INR",
  builtUpArea: "",
  builtUpAreaUnit: "sq ft",
  completionYear: "",
  coverImage: "",
  status: "DRAFT",
  isFeatured: false,
  images: [],
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(data.error || "Could not load projects.");
      }

      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function setField<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function editProject(project: Project) {
    setError("");
    setNotice("");
    setEditingId(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      category: project.category,
      clientName: project.clientName || "",
      location: project.location || "",
      siteArea: project.siteArea || "",
      siteAreaUnit: project.siteAreaUnit || "sq ft",
      cost: project.cost || "",
      costCurrency: project.costCurrency || "INR",
      builtUpArea: project.builtUpArea || "",
      builtUpAreaUnit: project.builtUpAreaUnit || "sq ft",
      completionYear: project.completionYear?.toString() || "",
      coverImage: project.coverImage || "",
      status: project.status,
      isFeatured: project.isFeatured,
      images: project.images.map(({ url, alt, caption }) => ({
        url,
        alt: alt || "",
        caption: caption || "",
      })),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;

    setError("");
    setNotice("");
    setUploading(true);

    try {
      const uploaded: ProjectImage[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/projects/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Upload failed for ${file.name}.`);
        }

        uploaded.push({ url: data.imageUrl, alt: file.name });
      }

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...uploaded].slice(0, 30),
        coverImage: previous.coverImage || uploaded[0]?.url || "",
      }));

      setNotice(`${uploaded.length} image(s) uploaded.`);
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

    const payload = {
      ...form,
      siteArea: form.siteArea || null,
      cost: form.cost || null,
      builtUpArea: form.builtUpArea || null,
      completionYear: form.completionYear || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/projects/${editingId}` : "/api/admin/projects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save project.");
      }

      setNotice(editingId ? "Project updated." : "Project created.");
      setForm(blank);
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Delete failed.");

      if (editingId === project.id) {
        setEditingId(null);
        setForm(blank);
      }

      setNotice("Project deleted.");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-brand">LostMonkTales</Link>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/blogs">Blog management</Link>
          <Link href="/admin/projects" className="admin-nav-active">Architecture projects</Link>
          <Link href="/admin/artworks">Art gallery</Link>
          <Link href="/admin/quizzes">Quiz management</Link>
          <Link href="/admin/settings">Website settings</Link>
        </nav>
        <Link href="/" className="admin-view-site">View website ↗</Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">PORTFOLIO MANAGEMENT</p>
            <h1>Architecture projects</h1>
          </div>
          <Link href="/admin" className="back-link">← Dashboard</Link>
        </header>

        <section className="admin-welcome">
          <p className="eyebrow">PROJECT STUDIO</p>
          <h2>{editingId ? "Edit project" : "Add a new project"}</h2>
          <p>Manage project details, gallery images, categories and publication.</p>
        </section>

        {error && <p className="admin-message admin-message-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-message-success" role="status">{notice}</p>}

        <form className="blog-editor-form" onSubmit={submit}>
          <label htmlFor="project-title">Project title *</label>
          <input id="project-title" required maxLength={200} value={form.title}
            onChange={(e) => setField("title", e.target.value)} />

          <label htmlFor="project-slug">URL slug (optional)</label>
          <input id="project-slug" value={form.slug}
            placeholder="modern-residence" onChange={(e) => setField("slug", e.target.value)} />

          <label htmlFor="project-description">Description *</label>
          <textarea id="project-description" required rows={6} value={form.description}
            onChange={(e) => setField("description", e.target.value)} />

          <label htmlFor="project-category">Category</label>
          <select id="project-category" value={form.category}
            onChange={(e) => setField("category", e.target.value)}>
            <option value="ARCHITECTURE">Architecture</option>
            <option value="INTERIOR">Interior</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RESIDENTIAL">Residential</option>
          </select>

          <label htmlFor="project-client">Client name</label>
          <input id="project-client" value={form.clientName}
            onChange={(e) => setField("clientName", e.target.value)} />

          <label htmlFor="project-location">Project location</label>
          <input id="project-location" value={form.location}
            onChange={(e) => setField("location", e.target.value)} />

          <label htmlFor="project-site-area">Site area</label>
          <div className="project-number-row">
            <input id="project-site-area" type="number" min="0" step="0.01"
              value={form.siteArea} onChange={(e) => setField("siteArea", e.target.value)} />
            <select aria-label="Site area unit" value={form.siteAreaUnit}
              onChange={(e) => setField("siteAreaUnit", e.target.value)}>
              <option>sq ft</option><option>sq m</option><option>acres</option><option>sq yd</option>
            </select>
          </div>

          <label htmlFor="project-cost">Project cost (INR)</label>
          <input id="project-cost" type="number" min="0" step="0.01"
            value={form.cost} onChange={(e) => setField("cost", e.target.value)} />

          <label htmlFor="project-built-area">Built-up area</label>
          <div className="project-number-row">
            <input id="project-built-area" type="number" min="0" step="0.01"
              value={form.builtUpArea} onChange={(e) => setField("builtUpArea", e.target.value)} />
            <select aria-label="Built-up area unit" value={form.builtUpAreaUnit}
              onChange={(e) => setField("builtUpAreaUnit", e.target.value)}>
              <option>sq ft</option><option>sq m</option><option>sq yd</option>
            </select>
          </div>

          <label htmlFor="project-year">Completion year</label>
          <input id="project-year" type="number" min="1900" max="2100"
            value={form.completionYear} onChange={(e) => setField("completionYear", e.target.value)} />

          <label htmlFor="project-cover">Cover image</label>
          <input id="project-cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => void uploadImages(e.target.files)} />
          {form.coverImage && (
            <img src={form.coverImage} alt="Project cover preview"
              style={{ width: "100%", maxWidth: 420, maxHeight: 260, objectFit: "cover" }} />
          )}

          <label htmlFor="project-gallery">Additional gallery images (multiple allowed)</label>
          <input id="project-gallery" type="file" multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => void uploadImages(e.target.files)} />

          {uploading && <p>Uploading images...</p>}

          {form.images.length > 0 && (
            <div className="project-image-preview-grid">
              {form.images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="project-image-preview">
                  <img src={image.url} alt={image.alt || "Project gallery image"} />
                  <input aria-label="Image caption" placeholder="Image caption"
                    value={image.caption || ""}
                    onChange={(e) => setField("images", form.images.map((item, i) =>
                      i === index ? { ...item, caption: e.target.value } : item
                    ))} />
                  <button type="button" className="admin-secondary-button"
                    onClick={() => setForm((previous) => ({
                      ...previous,
                      images: previous.images.filter((_, i) => i !== index),
                      coverImage: previous.coverImage === image.url
                        ? previous.images.find((_, i) => i !== index)?.url || ""
                        : previous.coverImage,
                    }))}>
                    Remove image
                  </button>
                </div>
              ))}
            </div>
          )}

          <label htmlFor="project-status">Status</label>
          <select id="project-status" value={form.status}
            onChange={(e) => setField("status", e.target.value as ProjectForm["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <label className="blog-featured-checkbox">
            <input type="checkbox" checked={form.isFeatured}
              onChange={(e) => setField("isFeatured", e.target.checked)} />
            Feature this project
          </label>

          <div className="blog-editor-actions">
            <button type="submit" disabled={saving || uploading}>
              {saving ? "Saving..." : editingId ? "Update project" : "Save project"}
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
            <h2>Existing projects</h2>
            <button type="button" className="admin-secondary-button"
              onClick={() => void loadProjects()}>Refresh</button>
          </div>

          {loading ? <p>Loading projects...</p> : projects.length === 0 ? (
            <p>No projects yet. Create your first one above.</p>
          ) : (
            <div className="admin-blog-table-wrap">
              <table className="admin-blog-table">
                <thead>
                  <tr><th>Project</th><th>Category</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.title}</strong>
                        <span className="admin-blog-slug">/projects/{project.slug}</span>
                      </td>
                      <td>{project.category}</td>
                      <td>{project.status}</td>
                      <td>
                        <div className="admin-blog-row-actions">
                          <button type="button" onClick={() => editProject(project)}>Edit</button>
                          <button type="button" className="admin-delete-button"
                            onClick={() => void deleteProject(project)}>Delete</button>
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

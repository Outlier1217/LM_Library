
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    const extension = allowedTypes[file.type];

    if (!extension || file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Upload a JPG, PNG, WebP or GIF image under 5 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const directory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "projects"
    );

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}${extension}`;

    await writeFile(path.join(directory, filename), bytes, {
      flag: "wx",
    });

    return NextResponse.json({
      imageUrl: `/uploads/projects/${filename}`,
    });
  } catch (error) {
    console.error("Project image upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 }
    );
  }
}

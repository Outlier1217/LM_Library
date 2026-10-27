
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
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

    if (!extension) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WebP or GIF images." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "blogs"
    );

    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}${extension}`;

    await writeFile(
      path.join(uploadDir, filename),
      bytes,
      { flag: "wx" }
    );

    return NextResponse.json({
      imageUrl: `/uploads/blogs/${filename}`,
    });
  } catch (error) {
    console.error("Blog image upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

    if (!extension || file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Choose a JPG, PNG, WebP or GIF image under 5 MB." },
        { status: 400 }
      );
    }

    const directory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "artworks"
    );

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });

    return NextResponse.json({
      imageUrl: `/uploads/artworks/${filename}`,
    });
  } catch (error) {
    console.error("Artwork image upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 }
    );
  }
}

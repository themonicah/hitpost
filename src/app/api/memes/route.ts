import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { put } from "@vercel/blob";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memes = await db.getMemesByUser(user.id);
  return NextResponse.json({ memes });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate file types
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || file.name}. Only images and videos are allowed.` },
          { status: 400 }
        );
      }
    }

    const uploadedMemes: { id: string; user_id: string; file_url: string; file_type: string; created_at: string }[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `memes/${user.id}/${uuid()}.${ext}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
      });

      const fileType = allowedVideoTypes.includes(file.type) ? "video" : "image";
      const memeId = uuid();

      await db.createMeme({
        id: memeId,
        user_id: user.id,
        file_url: blob.url,
        file_type: fileType,
      });

      uploadedMemes.push({
        id: memeId,
        user_id: user.id,
        file_url: blob.url,
        file_type: fileType,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ memes: uploadedMemes });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

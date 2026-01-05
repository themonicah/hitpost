import { getSession } from "@/lib/auth";
import db, { Meme } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memes = db.getMemesByUser(user.id);
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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedMemes: Meme[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${uuid()}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);

      const fileType = file.type.startsWith("video/") ? "video" : "image";
      const meme: Meme = {
        id: uuid(),
        user_id: user.id,
        file_path: `/uploads/${filename}`,
        file_type: fileType as "image" | "video",
        created_at: new Date().toISOString(),
      };

      db.createMeme(meme);
      uploadedMemes.push(meme);
    }

    return NextResponse.json({ memes: uploadedMemes });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Issues a short-lived upload token so the browser can send the rendered flyer
// straight to Vercel Blob. The file never passes through this function (so there's
// no 4.5 MB body limit), and the resulting public Blob URL becomes the og:image on
// /share, which is what Facebook scrapes to build the feed preview.
//
// Requires the BLOB_READ_WRITE_TOKEN env var (auto-added when you create a Blob
// store in the Vercel dashboard; for local dev run `vercel env pull`).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/png", "image/jpeg"],
        addRandomSuffix: true,
        maximumSizeInBytes: 10 * 1024 * 1024
      }),
      // The browser already has the blob URL it needs, so nothing to persist here.
      onUploadCompleted: async () => {}
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}

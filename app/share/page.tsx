import type { Metadata } from "next";
import Link from "next/link";

// This page exists so Facebook's scraper has a public HTTPS page to read Open Graph
// tags from: its og:image is the uploaded flyer, which is what shows in the feed
// preview when the user shares the link via sharer.php.
//
// Only allow og:image URLs we actually produced (Vercel Blob), so the page can't be
// abused to mint Open Graph cards pointing at arbitrary remote images.
const ALLOWED_IMAGE_HOST = /(^|\.)blob\.vercel-storage\.com$/;

type ShareSearchParams = {
  img?: string | string[];
  t?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeImageUrl(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOST.test(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function flyerTitle(raw: string | undefined): string {
  return firstValue(raw)?.slice(0, 120).trim() || "NCCS Flyer";
}

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<ShareSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const image = safeImageUrl(firstValue(params.img));
  const title = flyerTitle(firstValue(params.t));
  const description = "Made with the NCCS Flyer maker.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, alt: title }] : []
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : []
    }
  };
}

export default async function SharePage({
  searchParams
}: {
  searchParams: Promise<ShareSearchParams>;
}) {
  const params = await searchParams;
  const image = safeImageUrl(firstValue(params.img));
  const title = flyerTitle(firstValue(params.t));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center gap-6 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={title}
          className="w-full max-w-md rounded-xl border border-slate-200 shadow-sm"
        />
      ) : (
        <p className="text-slate-600">This flyer link is invalid or has expired.</p>
      )}
      <Link
        href="/"
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Make your own flyer
      </Link>
    </main>
  );
}

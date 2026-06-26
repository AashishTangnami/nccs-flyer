# NCCS Flyer Maker

A client-side flyer maker built with Next.js. Users pick a template, upload a photo,
remove its background in the browser, add text, then download or share the flyer.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite |

## Sharing a flyer to Facebook

The **Share to Facebook** button works in two ways, because no website is allowed to
push a photo straight into a personal Facebook feed:

- **Mobile** — opens the native share sheet, which hands the real PNG to the Facebook
  app, so the user posts it as an actual photo. No setup required.
- **Desktop** — desktop operating systems don't list Facebook in the share sheet, so
  the flyer is uploaded to public storage and Facebook's **share dialog** opens with
  the flyer as the link preview image. The user adds a caption and posts it.

The desktop path is the only way to get a flyer into a personal feed from a desktop
browser. It posts a **link card with the flyer as the preview image**, not a native
photo upload (Facebook removed timeline photo-posting from its API in 2018).

### Setup (required for the desktop path)

Facebook's link preview is built by a **server-side scraper**. It cannot reach
`localhost` and cannot see an image that only exists in the browser, so two things
must be true:

1. **A Vercel Blob store** must be connected, so the flyer can be uploaded to a public
   HTTPS URL.
   - In the Vercel dashboard: **Storage → Blob → Create**.
   - This automatically adds `BLOB_READ_WRITE_TOKEN` to the project's environment.
2. **The app must be deployed to a public HTTPS domain** (e.g. Vercel). Sharing will
   not produce a preview in local dev.

That's it — no Facebook App, access token, or App Review is needed for this flow.

### Testing the share flow locally

Because Facebook must scrape a public URL, point a tunnel at your dev server and pull
the Blob token first:

```bash
vercel env pull       # fetches BLOB_READ_WRITE_TOKEN into .env.local
npm run dev
ngrok http 3000       # gives you a public https URL to test from
```

If a preview ever looks wrong or stale, refresh it with the
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

### How it works

```
Browser renders flyer (PNG)
   │
   ├─ mobile ──► navigator.share({ files }) ──► Facebook app (real photo)
   │
   └─ desktop ─► upload() ──► /api/upload (issues Vercel Blob token)
                                   │
                                   ▼
                          public Blob image URL
                                   │
                                   ▼
        /share?img=<blobUrl>&t=<title>   (emits Open Graph tags)
                                   │
                                   ▼
   facebook.com/sharer/sharer.php?u=<share-url>  ──► scrapes og:image ──► feed preview
```

- `app/api/upload/route.ts` — issues short-lived Vercel Blob upload tokens.
- `app/share/page.tsx` — the page Facebook scrapes; its `og:image` is the flyer. It
  only accepts image URLs hosted on Vercel Blob.

### Caveats

- The flyer appears as a **link-card preview image**, not a full native photo.
- Portrait flyers may be **cropped** in the link card — Facebook favors ~1.91:1
  landscape previews.

## Environment variables

See [`.env.example`](./.env.example). The two relevant variables:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token used by `/api/upload` for the Facebook share flow. Added automatically when you create a Blob store. |
| `ALLOWED_FRAME_ANCESTOR` | Origin(s) allowed to embed the app in an `<iframe>`. Defaults to deny-all. |

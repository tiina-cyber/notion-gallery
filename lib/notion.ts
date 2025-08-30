import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  link: string | null;
  alt: string | null;
  media: { type: "image" | "video" | "canva"; url: string }[];
  thumb: string | null; // first image or Canva og:image
};

function isVideo(urlOrName: string): boolean {
  const u = urlOrName.toLowerCase().split("?")[0];
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov") || u.endsWith(".m4v");
}

function asCanvaEmbed(url: string): string {
  if (!/canva\.com\/design\//i.test(url)) return url;
  return url.includes("?")
    ? (/\bembed\b/.test(url) ? url : url + "&embed")
    : url + "?embed";
}

function htmlDecode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Server-side: fetch <meta ... og:image ...> (or twitter:image) from a Canva page.
// We strip ?embed for scraping, add a browser-y UA, and cache for 1 day.
async function fetchOgImage(canvaUrl: string): Promise<string | null> {
  try {
    const urlForMeta = canvaUrl.replace(/([?&])embed\b/, "").replace(/\?$/, "");
    const res = await fetch(urlForMeta, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86400 }, // ~1 day cache
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try several meta patterns
    const candidates: (string | undefined)[] = [
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1],
      html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1],
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1],
    ];
    let img = candidates.find(Boolean) || null;
    if (!img) return null;

    img = htmlDecode(img);

    // Resolve protocol-relative //... to https://
    if (img.startsWith("//")) img = "https:" + img;

    // Resolve relative URLs against the page URL
    if (/^\/[^/]/.test(img)) {
      const base = new URL(urlForMeta);
      img = new URL(img, base.origin).toString();
    }

    return img;
  } catch {
    return null;
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: { property: "Visible", checkbox: { equals: true } },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  const items: GalleryItem[] = [];

  for (const page of res.results as any[]) {
    const props = page.properties || {};

    const title =
      props?.Title?.type === "title"
        ? (props.Title.title || []).map((t: any) => t.plain_text).join("") || "Untitled"
        : "Untitled";

    const link = props?.Link?.type === "url" ? props.Link.url : null;

    const alt =
      props?.Alt?.type === "rich_text"
        ? (props.Alt.rich_text || []).map((t: any) => t.plain_text).join("").trim() || null
        : null;

    const media: { type: "image" | "video" | "canva"; url: string }[] = [];
    const m = props?.Media;
    if (m?.type === "files" && Array.isArray(m.files)) {
      for (const f of m.files) {
        const name = f.name || "";
        const url = f?.type === "external" ? f.external?.url : f?.file?.url ?? null;
        if (!url) continue;
        if (/canva\.com\/design\//i.test(url)) {
          media.push({ type: "canva", url: asCanvaEmbed(url) });
        } else {
          media.push({ type: isVideo(name || url) ? "video" : "image", url });
        }
      }
    }

    // Thumbnail: prefer first image in media; otherwise try Canva og:image
    let thumb: string | null = media.find((x) => x.type === "image")?.url ?? null;
    if (!thumb) {
      const canva = media.find((x) => x.type === "canva");
      if (canva) {
        thumb = await fetchOgImage(canva.url);
      }
    }

    items.push({ id: page.id, title, link, alt, media, thumb });
  }

  return items;
}

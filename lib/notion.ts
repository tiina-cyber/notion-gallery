import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  link: string | null;
  alt: string | null;
  media: { type: "image" | "video" | "canva"; url: string }[];
};

function isVideo(urlOrName: string): boolean {
  const u = urlOrName.toLowerCase().split("?")[0];
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov") || u.endsWith(".m4v");
}

function asCanvaEmbed(url: string): string {
  if (!/canva\.com\/design\//i.test(url)) return url;
  // ensure ?embed is present so Canva loads in an iframe-friendly mode
  const hasQuery = url.includes("?");
  return url.includes("embed")
    ? url
    : url + (hasQuery ? "&embed" : "?embed");
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: { property: "Visible", checkbox: { equals: true } },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return (res.results as any[]).map((page) => {
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

    // 1) Files & media: images, videos, or Canva links
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

    // 2) Optional standalone Canva URL column
    const canvaUrl = props?.Canva?.type === "url" ? props.Canva.url : null;
    if (canvaUrl && /canva\.com\/design\//i.test(canvaUrl)) {
      media.push({ type: "canva", url: asCanvaEmbed(canvaUrl) });
    }

    return { id: page.id, title, link, alt, media };
  });
}

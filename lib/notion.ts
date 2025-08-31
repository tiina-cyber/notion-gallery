import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  alt: string | null;
  media: { type: "image" | "video" | "canva"; url: string }[];
  thumb: string | null;      // first image in Media (thumbnail for grid)
  channels: string[];        // from Notion multi-select "Channel"
  views: number | null;      // from Number property "Views"
  engagements: number | null;// from Number property "Engagements"
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

    const alt =
      props?.Alt?.type === "rich_text"
        ? (props.Alt.rich_text || []).map((t: any) => t.plain_text).join("").trim() || null
        : null;

    // Build media list from Files & media
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

    // Thumbnail: first image in Media
    const thumb = media.find((x) => x.type === "image")?.url ?? null;

    // Channels from Notion multi-select "Channel"
    const channels =
      props?.Channel?.type === "multi_select"
        ? (props.Channel.multi_select || [])
            .map((o: any) => (o?.name || "").trim())
            .filter(Boolean)
        : [];

    // Numbers
    const views =
      props?.Views?.type === "number" ? (props.Views.number ?? null) : null;

    const engagements =
      props?.Engagements?.type === "number" ? (props.Engagements.number ?? null) : null;

    items.push({ id: page.id, title, alt, media, thumb, channels, views, engagements });
  }

  return items;
}

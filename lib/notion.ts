import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  link: string | null;
  alt: string | null;
  media: { type: "image" | "video"; url: string }[];
};

// naive extension check for videos
function isVideo(urlOrName: string): boolean {
  const u = urlOrName.toLowerCase().split("?")[0];
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov") || u.endsWith(".m4v");
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

    const media: { type: "image" | "video"; url: string }[] = [];
    const m = props?.Media;
    if (m?.type === "files" && Array.isArray(m.files)) {
      for (const f of m.files) {
        const name = f.name || "";
        const url = f?.type === "external" ? f.external?.url : f?.file?.url ?? null;
        if (!url) continue;
        media.push({ type: isVideo(name || url) ? "video" : "image", url });
      }
    }

    return { id: page.id, title, link, alt, media };
  });
}

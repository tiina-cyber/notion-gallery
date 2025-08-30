import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  link: string | null;
  images: string[];   // all images from Media
  alt: string | null; // caption from Alt
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Visible",
      checkbox: { equals: true },
    },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return (res.results as any[]).map((page) => {
    const props = page.properties || {};

    const title =
      props?.Title?.title?.[0]?.plain_text ??
      (Array.isArray(props?.Title?.title)
        ? props.Title.title.map((t: any) => t.plain_text).join("")
        : "Untitled");

    const link = props?.Link?.url ?? null;

    // ALL images
    const images: string[] = [];
    const media = props?.Media;
    if (media?.type === "files" && Array.isArray(media.files)) {
      for (const f of media.files) {
        const url = f?.type === "external" ? f.external?.url : f?.file?.url ?? null;
        if (url) images.push(url);
      }
    }

    // Alt (caption) — join all rich_text segments
    const alt =
      props?.Alt?.type === "rich_text"
        ? (props.Alt.rich_text || [])
            .map((t: any) => t.plain_text)
            .join("")
            .trim() || null
        : null;

    return { id: page.id, title, link, images, alt };
  });
}



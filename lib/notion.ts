import { Client } from "@notionhq/client";

/**
 * Public post shape consumed by the UI
 */
export type Post = {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  media: Array<{
    type: "image" | "video" | "canva";
    url: string;
    /** Optional manual thumbnail (especially for Canva) */
    thumb?: string | null;
  }>;
  alt?: string | null;
  channel: string[]; // multi-select (e.g., ["Instagram","Tiktok"])
  views?: number; // from Notion "Views" (number)
  engagements?: number; // from Notion "Engagements" (number)
};

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Fetch visible posts, sorted by "Order" ascending by default.
 * The UI can re-sort client-side (views/engagements) as needed.
 */
export async function getPosts(): Promise<Post[]> {
  const dbId = process.env.NOTION_DATABASE_ID!;
  if (!dbId) throw new Error("Missing NOTION_DATABASE_ID");
  if (!process.env.NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");

  const results = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "Visible",
      checkbox: { equals: true },
    },
    sorts: [
      // Keep your canonical sort; client can re-sort later
      { property: "Order", direction: "ascending" },
    ],
  });

  return Promise.all(
    results.results.map(async (page: any) => {
      const props = page.properties;

      const title =
        props?.Title?.title?.[0]?.plain_text ??
        props?.Name?.title?.[0]?.plain_text ?? // fallback if someone named it Name
        "Untitled";

      const visible = !!props?.Visible?.checkbox;

      const order =
        typeof props?.Order?.number === "number" ? props.Order.number : 0;

      const alt = props?.Alt?.rich_text?.[0]?.plain_text ?? null;

      const channel = Array.isArray(props?.Channel?.multi_select)
        ? props.Channel.multi_select.map((t: any) => t?.name).filter(Boolean)
        : [];

      // New number fields (coerce missing to 0 so sorting is stable)
      const views =
        typeof props?.Views?.number === "number" ? props.Views.number : 0;

      const engagements =
        typeof props?.Engagements?.number === "number"
          ? props.Engagements.number
          : 0;

      // ---- Media extraction ----
      // Your "Media" is a Files & media property and may contain:
      // - uploaded images/videos (type: "file")
      // - external links (type: "external") such as Canva
      // - manual thumbnails (first image to use as grid thumb)
      const media: Post["media"] = [];
      const files = props?.Media?.files ?? [];

      for (const f of files) {
        // Resolve the public/signed URL
        const url: string | undefined =
          f?.type === "file" ? f?.file?.url : f?.external?.url;

        if (!url) continue;

        // Identify Canva by host
        const isCanva =
          typeof url === "string" &&
          url.toLowerCase().includes("canva.com");

        if (isCanva) {
          media.push({
            type: "canva",
            url,
            thumb: null, // you provide a manual image before this for grid
          });
          continue;
        }

        // Try to infer image vs video
        const name = (f?.name as string) || "";
        const mime = f?.file?.mime_type as string | undefined;

        const looksLikeVideo =
          (mime && mime.startsWith("video/")) ||
          /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(name) ||
          /\.(mp4|mov|webm|m4v|avi|mkv)(\?.*)?$/i.test(url);

        if (looksLikeVideo) {
          media.push({ type: "video", url });
          continue;
        }

        // Default to image
        media.push({ type: "image", url });
      }

      return {
        id: page.id,
        title,
        visible,
        order,
        media,
        alt,
        channel,
        views,
        engagements,
      } as Post;
    })
  );
}

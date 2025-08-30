import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type GalleryItem = {
  id: string;
  title: string;
  image: string | null;
  link: string | null;
  pin: boolean;
  order: number | null;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Visible",
      checkbox: { equals: true },
    },
    // no API sorts — we will sort in JS below
  });

  const items: GalleryItem[] = (res.results as any[]).map((page) => {
    const props = page.properties || {};
    const title =
      props?.Title?.title?.[0]?.plain_text ??
      (Array.isArray(props?.Title?.title)
        ? props.Title.title.map((t: any) => t.plain_text).join("")
        : "Untitled");

    // Media
    let image: string | null = null;
    const media = props?.Media;
    if (media?.type === "files" && Array.isArray(media.files) && media.files.length > 0) {
      const f = media.files[0];
      image = f?.type === "external" ? f.external.url : f?.file?.url ?? null;
    }

    const link = props?.Link?.url ?? null;
    const pin: boolean = props?.Pin?.type === "checkbox" ? !!props.Pin.checkbox : false;
    const order: number | null = props?.Order?.type === "number" ? (props.Order.number as number | null) : null;

    return { id: page.id, title, image, link, pin, order };
  });

  // ✅ Enforce: pinned first, then highest Order → lowest, then created time desc as final tie-breaker
  items.sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1;
    const ao = a.order ?? -Infinity;
    const bo = b.order ?? -Infinity;
    if (bo !== ao) return bo - ao;
    return 0; // you can add a timestamp tie-break if you want
  });

  return items;
}


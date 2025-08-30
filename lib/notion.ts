import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function getGalleryItems() {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  // Keep the Visible filter; we'll do the sorting ourselves after fetch
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Visible",
      checkbox: { equals: true },
    },
    // (Optional) you can remove sorts entirely; we'll sort in JS below
    // sorts: [
    //   { property: "Pin", direction: "descending" },
    //   { property: "Order", direction: "descending" },
    // ],
  });

  // Normalize properties; pull out pin/order explicitly
  const items = (res.results as any[]).map((page) => {
    const props = page.properties || {};
    const title =
      props?.Title?.title?.[0]?.plain_text ??
      (Array.isArray(props?.Title?.title)
        ? props.Title.title.map((t: any) => t.plain_text).join("")
        : "Untitled");

    const media = props?.Media;
    let image: string | null = null;
    if (media?.type === "files" && Array.isArray(media.files) && media.files.length > 0) {
      const f = media.files[0];
      image = f?.type === "external" ? f.external.url : f?.file?.url ?? null;
    }

    const link = props?.Link?.url ?? null;

    const pin: boolean = props?.Pin?.type === "checkbox" ? !!props.Pin.checkbox : false;
    const order: number | null = props?.Order?.type === "number" ? (props.Order.number as number | null) : null;

    return { id: page.id, title, image, link, pin, order };
  });

  // ✅ Force the intended order: Pin first, then highest Order → lowest
  items.sort((a, b) => {
    // pin: true should come first
    if (a.pin !== b.pin) return a.pin ? -1 : 1;
    // order: higher first; treat null/undefined as very small
    const ao = a.order ?? -Infinity;
    const bo = b.order ?? -Infinity;
    return bo - ao;
  });

  // If you don't want to expose pin/order to the UI, strip them here:
  return items.map(({ id, title, image, link }) => ({ id, title, image, link }));
}


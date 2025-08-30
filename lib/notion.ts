import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getGalleryItems() {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Visible",
      checkbox: { equals: true },
    },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return res.results.map((page: any) => {
    const title =
      page.properties?.Title?.title?.[0]?.plain_text ?? "Untitled";
    const image =
      page.properties?.Media?.files?.[0]?.file?.url ||
      page.properties?.Media?.files?.[0]?.external?.url ||
      null;
    const link = page.properties?.Link?.url || null;
    return { id: page.id, title, image, link };
  });
}

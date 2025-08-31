import { getGalleryItems } from "../../lib/notion";
import Gallery from "./Gallery";

export const dynamic = "force-dynamic";

export default async function Embed() {
  const items = await getGalleryItems();
  return (
    <main style={{ padding: 0, margin: 0 }}>
      <Gallery items={items} />
    </main>
  );
}

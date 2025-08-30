import { getGalleryItems } from "../../lib/notion";

export const dynamic = "force-dynamic";

export default async function Embed() {
  const items = await getGalleryItems();

  return (
    <main style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", padding: "1rem" }}>
      {items.map((item) => (
        <a key={item.id} href={item.link ?? "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
          <figure style={{ margin: 0 }}>
            {item.image ? (
              <img src={item.image} alt={item.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
            ) : (
              <div style={{ width: "100%", height: "200px", background: "#eee" }} />
            )}
            <figcaption style={{ padding: "4px 0" }}>{item.title}</figcaption>
          </figure>
        </a>
      ))}
    </main>
  );
}

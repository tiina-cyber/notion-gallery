import { getGalleryItems } from "../../lib/notion";
export const dynamic = "force-dynamic";

export default async function Embed() {
  const items = await getGalleryItems();

  return (
    <main style={{ padding: 0, margin: 0 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
        padding: "12px",
      }}>
        {items.map((item) => (
          <figure key={item.id} style={{ margin: 0, border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden" }}>
              {item.image ? (
                <img src={item.image} alt={item.title || "Gallery image"}
                     style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : <div style={{ position: "absolute", inset: 0, background: "#eee" }} /> }
            </div>
            <figcaption style={{ padding: "8px 10px", fontSize: 14, background: "white" }}>
              {item.pin ? "📌 " : ""}{item.title} {typeof item.order === "number" ? `(Order ${item.order})` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}


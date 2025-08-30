import { getGalleryItems } from "../../lib/notion";

// always fetch fresh data
export const dynamic = "force-dynamic";

export default async function Embed() {
  const items = await getGalleryItems();

  return (
    <main style={{ padding: 0, margin: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "2px",                 // tiny spacing between photos
          padding: "2px",             // tiny outer padding
        }}
      >
        {items.map((item: any) => {
          const tile = (
            <div
              key={item.id}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",  // 4:5 like Instagram
                overflow: "hidden",    // straight edges (no rounding)
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title || "Gallery image"}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", // fill without distortion
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#eee",
                  }}
                />
              )}
            </div>
          );

          return item.link ? (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {tile}
            </a>
          ) : (
            tile
          );
        })}
      </div>
    </main>
  );
}


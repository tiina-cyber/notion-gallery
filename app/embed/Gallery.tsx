"use client";

import { useEffect, useState, useCallback } from "react";

type Item = {
  id: string;
  title: string;
  link: string | null;
  images: string[];
  alt: string | null; // <-- new
};

export default function Gallery({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [postIdx, setPostIdx] = useState<number>(0);
  const [slideIdx, setSlideIdx] = useState<number>(0);

  const openModal = (i: number) => {
    setPostIdx(i);
    setSlideIdx(0);
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const nextSlide = useCallback(() => {
    const imgs = items[postIdx]?.images ?? [];
    if (!imgs.length) return;
    setSlideIdx((s) => (s + 1) % imgs.length);
  }, [items, postIdx]);

  const prevSlide = useCallback(() => {
    const imgs = items[postIdx]?.images ?? [];
    if (!imgs.length) return;
    setSlideIdx((s) => (s - 1 + imgs.length) % imgs.length);
  }, [items, postIdx]);

  // keyboard: ESC / arrows
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, nextSlide, prevSlide]);

  return (
    <>
      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "2px",
          padding: "2px",
        }}
      >
        {items.map((item, i) => {
          const thumb = item.images[0] || null;
          const tile = (
            <div
              key={item.id}
              onClick={() => openModal(i)}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                overflow: "hidden",
                cursor: "pointer",
                background: "#eee",
              }}
              title={item.title}
              aria-label={item.title}
            >
              {thumb && (
                <img
                  src={thumb}
                  alt={item.title || "Gallery image"}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
              {/* tiny carousel indicator */}
              {item.images.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    fontSize: 12,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {item.images.length} ▶
                </div>
              )}
            </div>
          );
          return <span key={item.id} style={{ display: "block" }}>{tile}</span>;
        })}
      </div>

      {/* Modal / Lightbox */}
      {open && (
        <div
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          {/* Content column: image area (flex:1) + caption area below */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(90vw, 900px)",
              height: "min(90vh, 90vw * 1.25)",
              background: "black",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image area */}
            <div style={{ position: "relative", flex: 1 }}>
              <img
                src={items[postIdx].images[slideIdx]}
                alt={items[postIdx].title || "Image"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "black",
                }}
              />

              {/* Left arrow */}
              {items[postIdx].images.length > 1 && (
                <button
                  onClick={prevSlide}
                  aria-label="Previous image"
                  style={arrowStyle("left")}
                >
                  ‹
                </button>
              )}

              {/* Right arrow */}
              {items[postIdx].images.length > 1 && (
                <button
                  onClick={nextSlide}
                  aria-label="Next image"
                  style={arrowStyle("right")}
                >
                  ›
                </button>
              )}

              {/* Close */}
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  border: "none",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ✕
              </button>

              {/* Dots */}
              {items[postIdx].images.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {items[postIdx].images.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setSlideIdx(idx)}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background:
                          idx === slideIdx ? "white" : "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Caption area (IG-like, minimal) */}
            {(items[postIdx].title || items[postIdx].alt || items[postIdx].link) && (
              <div
                style={{
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.5,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {items[postIdx].title && (
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {items[postIdx].title}
                  </div>
                )}
                {items[postIdx].alt && <div>{items[postIdx].alt}</div>}
                {items[postIdx].link && (
                  <div style={{ marginTop: 6 }}>
                    <a
                      href={items[postIdx].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#93c5fd", textDecoration: "underline" }}
                    >
                      Open link
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 10,
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    width: 40,
    height: 40,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 28,
    lineHeight: 0.8 as any,
  };
}

}

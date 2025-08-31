"use client";

import React, { useEffect, useState, useCallback } from "react";

type Media = { type: "image" | "video" | "canva"; url: string };
type Item = {
  id: string;
  title: string;
  link: string | null;
  alt: string | null;
  media: Media[];
  thumb: string | null; // first image in Media (thumbnail for grid)
};

export default function Gallery({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [postIdx, setPostIdx] = useState<number>(0);
  const [slideIdx, setSlideIdx] = useState<number>(0);

  // Slides rule: if a post contains any Canva media, show ONLY Canva slides in the modal.
  // Otherwise, show all media (images/videos).
  const slidesFor = useCallback(
    (i: number): Media[] => {
      const m = items[i]?.media ?? [];
      const hasCanva = m.some((x) => x.type === "canva");
      return hasCanva ? m.filter((x) => x.type === "canva") : m;
    },
    [items]
  );

  const openModal = (i: number) => {
    setPostIdx(i);
    setSlideIdx(0);
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const nextSlide = useCallback(() => {
    const slides = slidesFor(postIdx);
    if (!slides.length) return;
    setSlideIdx((s) => (s + 1) % slides.length);
  }, [slidesFor, postIdx]);

  const prevSlide = useCallback(() => {
    const slides = slidesFor(postIdx);
    if (!slides.length) return;
    setSlideIdx((s) => (s - 1 + slides.length) % slides.length);
  }, [slidesFor, postIdx]);

  // Keyboard: Esc to close, arrows to navigate
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
          const first = item.media[0];
          const hasThumb = !!item.thumb;

          // For the little counter badge on the tile, reflect how many slides the modal will show
          const tileSlides = (() => {
            const hasCanva = item.media.some((m) => m.type === "canva");
            return hasCanva ? item.media.filter((m) => m.type === "canva") : item.media;
          })();

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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={item.title}
              aria-label={item.title}
            >
              {/* Prefer the explicit thumbnail (first image in Media) */}
              {hasThumb ? (
                <img
                  src={item.thumb as string}
                  alt={item.title || "Gallery thumbnail"}
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
              ) : first ? (
                first.type === "image" ? (
                  <img
                    src={first.url}
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
                ) : first.type === "video" ? (
                  <>
                    <video
                      src={first.url}
                      muted
                      playsInline
                      preload="metadata"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        background: "black",
                      }}
                    />
                    <Badge>▶ video</Badge>
                  </>
                ) : (
                  // Canva (no thumb image available): neutral placeholder
                  <>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "#111",
                      }}
                    />
                    <Badge>Canva</Badge>
                  </>
                )
              ) : null}

              {/* Tiny indicator: how many slides the modal will show */}
              {tileSlides.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 6,
                    fontSize: 12,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {tileSlides.length} ▶
                </div>
              )}
            </div>
          );

          return (
            <span key={item.id} style={{ display: "block" }}>
              {tile}
            </span>
          );
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
            {/* Media area */}
            <ModalSlides
              items={items}
              postIdx={postIdx}
              slideIdx={slideIdx}
              setSlideIdx={setSlideIdx}
              nextSlide={nextSlide}
              prevSlide={prevSlide}
              slidesFor={slidesFor}
            />

            {/* Alt caption only */}
            {items[postIdx].alt && (
              <div
                style={{
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.5,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {items[postIdx].alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ModalSlides({
  items,
  postIdx,
  slideIdx,
  setSlideIdx,
  nextSlide,
  prevSlide,
  slidesFor,
}: {
  items: Item[];
  postIdx: number;
  slideIdx: number;
  setSlideIdx: (n: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  slidesFor: (i: number) => Media[];
}) {
  const slides = slidesFor(postIdx);
  const cur = slides[slideIdx];

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {cur?.type === "video" ? (
        <video
          key={cur.url} // reset playback when slide changes
          src={cur.url}
          controls
          autoPlay
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            background: "black",
          }}
        />
      ) : cur?.type === "canva" ? (
        <iframe
          src={cur.url}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            background: "black",
          }}
          allow="fullscreen; clipboard-write"
          loading="lazy"
        />
      ) : (
        <img
          src={cur?.url}
          alt={"Image"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            background: "black",
          }}
        />
      )}

      {/* Arrows (only if multiple slides) */}
      {slides.length > 1 && (
        <>
          <button onClick={prevSlide} aria-label="Previous" style={arrowStyle("left")}>
            ‹
          </button>
          <button onClick={nextSlide} aria-label="Next" style={arrowStyle("right")}>
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
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
          {slides.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setSlideIdx(idx)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: idx === slideIdx ? "white" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
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

"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";

type Media = { type: "image" | "video" | "canva"; url: string };
type Item = {
  id: string;
  title: string;
  link: string | null;
  alt: string | null;
  media: Media[];
  thumb: string | null;     // first image in Media (thumbnail for grid)
  channels: string[];       // e.g., ["Instagram", "Tiktok"]
};

export default function Gallery({ items }: { items: Item[] }) {
  // Selected channel ("" = All)
  const [channel, setChannel] = useState<string>("");

  // Build unique channel list from data
  const allChannels = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) for (const c of it.channels || []) s.add(c);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Visible items based on selected channel
  const visible = useMemo(() => {
    if (!channel) return items;
    const wanted = channel.toLowerCase();
    return items.filter((it) => (it.channels || []).some((c) => c.toLowerCase() === wanted));
  }, [items, channel]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [postIdx, setPostIdx] = useState<number>(0);
  const [slideIdx, setSlideIdx] = useState<number>(0);

  // Slides rule: if a post contains any Canva, show ONLY Canva slides in the modal.
  const slidesFor = useCallback(
    (i: number): Media[] => {
      const m = visible[i]?.media ?? [];
      const hasCanva = m.some((x) => x.type === "canva");
      return hasCanva ? m.filter((x) => x.type === "canva") : m;
    },
    [visible]
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

  // Keyboard navigation within modal
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
    <main style={{ padding: 0, margin: 0 }}>
      {/* Channel filter bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "8px 8px 0",
        }}
      >
        <label style={{ fontSize: 14, opacity: 0.8 }}>Channel:</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          style={{
            fontSize: 14,
            padding: "6px 10px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "white",
            borderRadius: 6,
            outline: "none",
          }}
        >
          <option value="">All</option>
          {allChannels.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          {channel ? `${visible.length} post${visible.length === 1 ? "" : "s"}`
                   : `${items.length} post${items.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "2px",
          padding: "8px 2px 2px",
        }}
      >
        {visible.length === 0 && (
          <div style={{ padding: 12, color: "rgba(0,0,0,0.6)", gridColumn: "1/-1", fontSize: 14 }}>
            No posts for this channel yet.
          </div>
        )}

        {visible.map((item, i) => {
          const first = item.media[0];
          const hasThumb = !!item.thumb;

          // What modal will show for this tile (to compute counter badge)
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
              {/* Prefer thumbnail (first image in Media) */}
              {hasThumb ? (
                <img
                  src={item.thumb as string}
                  alt={item.title || "Gallery thumbnail"}
                  loading="lazy"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : first ? (
                first.type === "image" ? (
                  <img
                    src={first.url}
                    alt={item.title || "Gallery image"}
                    loading="lazy"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : first.type === "video" ? (
                  <>
                    <video
                      src={first.url}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", background: "black" }}
                    />
                    <Badge>▶ video</Badge>
                  </>
                ) : (
                  <>
                    <div style={{ position: "absolute", inset: 0, background: "#111" }} />
                    <Badge>Canva</Badge>
                  </>
                )
              ) : null}

              {/* Mini counter for how many slides the modal will have */}
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
            <ModalSlides
              items={visible}
              postIdx={postIdx}
              slideIdx={slideIdx}
              setSlideIdx={setSlideIdx}
              nextSlide={nextSlide}
              prevSlide={prevSlide}
              slidesFor={slidesFor}
            />

            {/* Alt caption only */}
            {visible[postIdx]?.alt && (
              <div
                style={{
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.5,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {visible[postIdx].alt}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
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
          key={cur.url}
          src={cur.url}
          controls
          autoPlay
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "black" }}
        />
      ) : cur?.type === "canva" ? (
        <iframe
          src={cur.url}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "black" }}
          allow="fullscreen; clipboard-write"
          loading="lazy"
        />
      ) : (
        <img
          src={cur?.url}
          alt={"Image"}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "black" }}
        />
      )}

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

      {slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {slides.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setSlideIdx(idx)}
              style={{ width: 8, height: 8, borderRadius: 999, background: idx === slideIdx ? "white" : "rgba(255,255,255,0.4)", cursor: "pointer" }}
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

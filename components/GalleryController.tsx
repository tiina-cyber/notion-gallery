"use client";

import * as React from "react";
import FiltersBar, { SortBy } from "./FiltersBar";
import type { Post } from "@/lib/notion";

type Props = { posts: Post[] };

export default function GalleryController({ posts }: Props) {
  const [selectedChannel, setSelectedChannel] = React.useState<string>("All");
  const [sortBy, setSortBy] = React.useState<SortBy>("order");

  const channels = React.useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.channel?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = React.useMemo(() => {
    if (selectedChannel === "All") return posts;
    return posts.filter((p) => p.channel?.includes(selectedChannel));
  }, [posts, selectedChannel]);

  const sorted = React.useMemo(() => {
    const arr = filtered.slice();
    switch (sortBy) {
      case "views_desc":
        arr.sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || (a.order ?? 0) - (b.order ?? 0));
        break;
      case "engagements_desc":
        arr.sort(
          (a, b) =>
            (b.engagements ?? 0) - (a.engagements ?? 0) || (a.order ?? 0) - (b.order ?? 0)
        );
        break;
      default:
        arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return arr;
  }, [filtered, sortBy]);

  return (
    <div>
      <FiltersBar
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* 👇 Replace this with your existing grid JSX from page.tsx */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
        {sorted.map((p) => {
          const first = p.media[0];
          return (
            <article key={p.id} className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
              {first?.type === "image" && (
                <img
                  src={first.url}
                  alt={p.alt ?? p.title}
                  className="w-full h-full object-cover"
                />
              )}
              {first?.type === "video" && (
                <video
                  className="w-full h-full object-cover"
                  src={first.url}
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export type SortBy = "order" | "views_desc" | "engagements_desc";

type Props = {
  channels: string[];
  selectedChannel: string;
  onChannelChange: (v: string) => void;
  sortBy: SortBy;
  onSortByChange: (v: SortBy) => void;
};

export default function FiltersBar({
  channels,
  selectedChannel,
  onChannelChange,
  sortBy,
  onSortByChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
      {/* Channel */}
      <label className="flex items-center gap-2">
        <span className="text-sm font-medium">Channel</span>
        <div className="relative">
          <select
            className="appearance-none pr-8 pl-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white
                       focus:outline-none focus:ring-2 focus:ring-black/10"
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
          >
            <option value="All">All</option>
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        </div>
      </label>

      {/* Sort by */}
      <label className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort by</span>
        <div className="relative">
          <select
            className="appearance-none pr-8 pl-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white
                       focus:outline-none focus:ring-2 focus:ring-black/10"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortBy)}
          >
            <option value="order">Default (Order)</option>
            <option value="views_desc">Views ↓</option>
            <option value="engagements_desc">Engagements ↓</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        </div>
      </label>
    </div>
  );
}


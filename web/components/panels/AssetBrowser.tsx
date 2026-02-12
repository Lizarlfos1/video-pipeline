"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";

type Tab = "broll" | "graphs" | "sfx";

export default function AssetBrowser() {
  const assets = useEditorStore((s) => s.assets);
  const [activeTab, setActiveTab] = useState<Tab>("broll");

  if (!assets) {
    return (
      <div
        className="p-4 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        No assets loaded
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    {
      key: "broll",
      label: "B-Roll",
      count: assets.broll.length,
      color: "var(--broll)",
    },
    {
      key: "graphs",
      label: "Graphs",
      count: assets.graphs.length,
      color: "var(--graph)",
    },
    {
      key: "sfx",
      label: "SFX",
      count: assets.sfx.length,
      color: "var(--sfx)",
    },
  ];

  const items = assets[activeTab];

  const handleDragStart = (
    e: React.DragEvent,
    item: { label: string; path: string }
  ) => {
    const type =
      activeTab === "broll"
        ? "broll"
        : activeTab === "graphs"
          ? "graph"
          : "sfx";

    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type, label: item.label, path: item.path })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="text-xs font-semibold uppercase tracking-wider px-3 py-2"
        style={{ color: "var(--text-muted)" }}
      >
        Assets
      </div>

      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-1.5 text-xs font-medium transition-colors"
            style={{
              color:
                activeTab === tab.key
                  ? tab.color
                  : "var(--text-muted)",
              borderBottom:
                activeTab === tab.key
                  ? `2px solid ${tab.color}`
                  : "2px solid transparent",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div
            className="text-xs text-center py-4"
            style={{ color: "var(--text-muted)" }}
          >
            No {activeTab} assets
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="flex items-center gap-2 px-2 py-2 rounded-md cursor-grab active:cursor-grabbing transition-colors"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background:
                      activeTab === "broll"
                        ? "var(--broll)"
                        : activeTab === "graphs"
                          ? "var(--graph)"
                          : "var(--sfx)",
                  }}
                />
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="px-3 py-2 text-xs"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Drag assets onto the timeline
      </div>
    </div>
  );
}

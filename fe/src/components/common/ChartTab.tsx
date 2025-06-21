"use client";

import React, { useState } from "react";
import clsx from "clsx";

export type Range = "daily" | "monthly" | "quarterly" | "annually";

interface ChartTabProps {
  /** Controlled selected key (jika parent ingin kontrol) */
  selected?: Range;
  /** Callback ketika user pilih tab baru */
  onChange?: (range: Range) => void;
}

const ALL_TABS: { key: Range; label: string }[] = [
  { key: "daily",     label: "Harian"     },
  { key: "monthly",   label: "Bulanan"   },
  { key: "quarterly", label: "Kuartal" },
  { key: "annually",  label: "Tahunan"  },
];

export default function ChartTab({ selected: selProp, onChange }: ChartTabProps) {
  const [internal, setInternal] = useState<Range>("daily");
  const selected = selProp ?? internal;

  function handleClick(key: Range) {
    if (onChange) return onChange(key);
    setInternal(key);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {ALL_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={clsx(
            "px-3 py-2 font-medium w-full rounded-md text-sm transition",
            selected === tab.key
              ? "bg-white text-gray-900 dark:bg-gray-800 dark:text-white shadow-theme-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

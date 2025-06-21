"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import ChartTab, { Range } from "../common/ChartTab";
import { format } from "date-fns";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Activity = { date: string; total_calories: number };

interface StatisticsChartProps {
  activities: Activity[];
  tee: number;
}

export default function StatisticsChart({
  activities,
  tee,
}: StatisticsChartProps) {
  const [range, setRange] = useState<Range>("daily");

  // Group & aggregate, now with proper sorting
  const { categories, data } = useMemo(() => {
    const buckets: Record<string, number[]> = {};

    // 1. Bucket by an ISO-style key
    activities.forEach(({ date, total_calories }) => {
  const d = new Date(date)
  let key: string
  // tentukan key berdasarkan range...
  if (range === "daily") {
    key = date
  } else if (range === "monthly") {
    key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  } else if (range === "quarterly") {
    const q = Math.floor(d.getMonth() / 3) + 1
    key = `${d.getFullYear()}-Q${q}`
  } else {
    key = String(d.getFullYear())
  }

  // **cast ke Number sebelum push**
  const kcal = Number(total_calories) || 0
  ;(buckets[key] ||= []).push(kcal)
})
    // 2. Sort the bucket keys
    const sortedKeys = Object.keys(buckets);
    if (range === "daily") {
      sortedKeys.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    } else if (range === "monthly") {
      // "2025-01", "2025-02", ... sorts lex OK
      sortedKeys.sort();
    } else if (range === "quarterly") {
      sortedKeys.sort((a, b) => {
        const [yA, qA] = a.split("-Q").map(Number);
        const [yB, qB] = b.split("-Q").map(Number);
        return yA !== yB ? yA - yB : qA - qB;
      });
    } else {
      sortedKeys.sort((a, b) => Number(a) - Number(b));
    }

    // 3. Build the display labels and final data array
    const cats = sortedKeys.map((k) => {
      const d = new Date(
        range === "daily"
          ? k
          : range === "monthly"
            ? `${k}-01`
            : range === "quarterly"
              ? // pick start of quarter just for formatting
              `${k.split("-Q")[0]}-${String((+k.split("-Q")[1] - 1) * 3 + 1).padStart(
                2,
                "0"
              )}-01`
              : `${k}-01-01`
      );
      if (range === "daily") return format(d, "dd MMM");
      if (range === "monthly") return format(d, "MMM");
      if (range === "quarterly") return k; // already "2025-Q1"
      return k;
    });

    const vals = sortedKeys.map((k) => {
      const arr = buckets[k];
      return range === "daily"
        ? arr[0] || 0                    // untuk daily, ambil nilai tunggal
        :                    // selain daily, hitung rata-rata:
          arr.reduce((sum, v) => sum + v, 0)  // jumlahkan seluruh elemen
          / arr.length                        // bagi dengan banyaknya elemen
        ;
        
    });

    return { categories: cats, data: vals };
  }, [activities, range]);


  // Baseline series
  const teeSeries = Array(data.length).fill(tee);

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 310,
      toolbar: { show: false },
    },
    colors: ["#12B76A", "#A6F4C5"],
    stroke: {
      curve: "straight",
      width: [2, 2],   // both series get a 2px line
    },
    markers: {
      size: 0,         // hide markers completely
      hover: { size: 6 },
    },
    fill: {
      type: "solid",
      opacity: 1,      // no area gradient
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: {
        format:
          range === "daily"
            ? "dd MMM yyyy"
            : range === "monthly"
              ? "MMM yyyy"
              : range === "quarterly"
                ? "'Q'q yyyy"
                : "yyyy",
      },
      y: { formatter: (v) => `${Math.round(v)} kcal` },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Kalori (kcal)" },
      
      labels: { 
        formatter: (v) => `${Math.round(v)}`,
        style: { colors: ["#6B7280"] } },
    },
  };

  const series = [
    { name: "Kalori Harian", data },
    { name: "TEE (Target Kalori)", data: teeSeries },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistik Kalori Harian
          </h3>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            {range === "daily"
              ? "Kalori per hari"
              : range === "monthly"
                ? "Rata-rata per bulan"
                : range === "quarterly"
                  ? "Rata-rata per kuartal"
                  : "Rata-rata per tahun"}{" "}
            vs TEE (Target Kalori)
          </p>
        </div>
        <ChartTab selected={range} onChange={setRange} />
      </div>

      {/* Chart */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="line"           // <— ensure line type
            height={310}
          />
        </div>
      </div>
    </div>
  );
}

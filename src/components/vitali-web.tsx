"use client";

// Le misure di velocita' dei visitatori veri (src/lib/vitali.ts), con lo strumento ufficiale di Next.

import { useReportWebVitals } from "next/web-vitals";
import { registraVitale } from "@/lib/vitali";

export function VitaliWeb() {
  useReportWebVitals(registraVitale);
  return null;
}

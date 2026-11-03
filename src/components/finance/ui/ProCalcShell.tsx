"use client";

import { cn } from "@/lib/utils";
import { IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

const plex = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function ProCalcShell(props: { children: ReactNode }) {
  return (
    <div
      data-llp-pro="on"
      className={cn(plex.className, "llp-pro-shell min-w-0")}
    >
      {props.children}
    </div>
  );
}

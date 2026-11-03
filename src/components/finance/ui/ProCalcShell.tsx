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
      className={cn(
        plex.className,
        "llp-pro-shell mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-3 rounded-2xl bg-[#F8FAFC] p-3 text-[#020617] ring-1 ring-[#E2E8F0] md:p-4 [&>*]:min-w-0",
      )}
    >
      {props.children}
    </div>
  );
}

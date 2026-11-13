"use client";

import { createContext, useContext, type ReactNode } from "react";

const ReportAuthorContext = createContext("");

export function ReportAuthorProvider(props: {
  name: string;
  children: ReactNode;
}) {
  return (
    <ReportAuthorContext.Provider value={props.name}>
      {props.children}
    </ReportAuthorContext.Provider>
  );
}

export function useReportPreparedBy(): string {
  return useContext(ReportAuthorContext);
}

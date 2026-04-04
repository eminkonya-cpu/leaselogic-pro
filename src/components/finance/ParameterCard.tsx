"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  step?: string;
  options?: readonly string[];
};

export default function ParameterCard(props: {
  title: string;
  icon: LucideIcon;
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string | number) => void;
  className?: string;
}) {
  const Icon = props.icon;
  const fieldListIdBase = useId();
  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-[#2f5f83] bg-gradient-to-b from-white to-slate-50/90 shadow-xl shadow-slate-300/30 backdrop-blur",
        props.className,
      )}
    >
      <CardHeader className="border-t-4 border-[#f7c948] bg-[#113a5a] px-2.5 pb-2.5 pt-3 text-white lg:px-3 lg:pb-3.5 lg:pt-4">
        <CardTitle className="flex w-full items-center justify-start gap-2 text-left text-[13px] font-extrabold tracking-tight text-white lg:flex-col lg:justify-center lg:gap-2 lg:text-center lg:text-[15px]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2f49] text-[#f7c948] ring-1 ring-[#255679] shadow-sm lg:h-9 lg:w-9">
            <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
          </span>
          <span className="max-w-[16rem] leading-snug">{props.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-2.5 pt-2.5 lg:space-y-3 lg:px-6 lg:pt-4">
        {props.fields.map((f) => {
          const type = f.type ?? "number";
          const raw = props.values[f.key];
          const listId =
            type === "text" && f.options?.length
              ? `${fieldListIdBase}-${f.key}`
              : undefined;
          const value =
            type === "text"
              ? String(raw ?? "")
              : raw === null || raw === undefined
                ? ""
                : String(raw);
          return (
            <div key={f.key} className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-600 lg:text-xs">{f.label}</Label>
              <Input
                value={value}
                type={type}
                list={listId}
                inputMode={type === "number" ? "decimal" : undefined}
                step={f.step}
                placeholder={f.placeholder}
                onChange={(e) => {
                  const next =
                    type === "text"
                      ? e.target.value
                      : e.target.value === ""
                        ? 0
                        : Number(e.target.value.replace(",", "."));
                  props.onChange(f.key, next);
                }}
              />
              {listId ? (
                <datalist id={listId}>
                  {f.options?.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

"use client";

import CatalogOptionChips from "@/components/finance/CatalogOptionChips";
import {
  PlanToggleButton,
  PlanToggleGroup,
} from "@/components/finance/ui/CalcFormChrome";
import type { CatalogCategoryId, CatalogSelection } from "@/lib/catalogPrices";
import type { ExtraCostPaymentMode } from "@/lib/leasingPaymentPlan";

export default function GraceBalloonOptionChips(props: {
  selection: CatalogSelection;
  onToggle: (categoryId: CatalogCategoryId, itemId: string) => void;
  paymentMode: ExtraCostPaymentMode;
  onPaymentModeChange: (mode: ExtraCostPaymentMode) => void;
  reverseExtras?: boolean;
  onClearAll?: () => void;
}) {
  return (
    <CatalogOptionChips
      className="mt-3 border-t border-[#E2E8F0] pt-3"
      selection={props.selection}
      onToggle={props.onToggle}
      onClearAll={props.onClearAll}
      description="Ataşman, bakım, donanım ve nakliye — seçilenler özette ayrı satır olur"
      headerRight={
        <PlanToggleGroup
          aria-label="Opsiyon ödeme şekli"
          className="w-auto max-w-full shrink-0"
        >
          <PlanToggleButton
            active={props.paymentMode === "cash"}
            onClick={() => props.onPaymentModeChange("cash")}
          >
            {props.reverseExtras ? "Peşin (MAATS)" : "Peşin"}
          </PlanToggleButton>
          <PlanToggleButton
            active={props.paymentMode === "financed"}
            onClick={() => props.onPaymentModeChange("financed")}
          >
            Plana
          </PlanToggleButton>
        </PlanToggleGroup>
      }
    />
  );
}

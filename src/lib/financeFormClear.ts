export function clearForwardMachineFinance(
  handleParamChange: (key: string, value: string | number) => void,
  financeFieldKeys: readonly string[],
) {
  handleParamChange("firma", "");
  handleParamChange("makine", "");
  handleParamChange("machinePriceEuro", 0);

  for (const key of financeFieldKeys) {
    handleParamChange(key, 0);
  }
}

export function clearReverseParameters(
  handleParamChange: (key: string, value: string | number) => void,
) {
  handleParamChange("firma", "");
  handleParamChange("makine", "");
  handleParamChange("allInTotalEuro", 0);
  handleParamChange("downPaymentEuro", 0);
  handleParamChange("term", 0);
  handleParamChange("euroInterest", 0);
  handleParamChange("tlInterest", 0);
}

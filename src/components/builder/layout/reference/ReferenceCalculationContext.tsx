import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { FormCalculation } from "@/types/form";

const ReferenceCalculationContext = createContext<FormCalculation[]>([]);

type Props = {
  calculations: FormCalculation[];
  children: ReactNode;
};

export function ReferenceCalculationProvider({
  calculations,
  children,
}: Props) {
  return (
    <ReferenceCalculationContext.Provider value={calculations}>
      {children}
    </ReferenceCalculationContext.Provider>
  );
}

export function useReferenceCalculations() {
  return useContext(ReferenceCalculationContext);
}

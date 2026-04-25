import type { FormCalculation, FormSection } from "@/types/form";

export function getFormCalculationsFromSections(
  sections: FormSection[],
): FormCalculation[] {
  for (const section of sections) {
    const calculations = section.settings?.calculations;
    if (Array.isArray(calculations)) {
      return calculations as FormCalculation[];
    }
  }

  return [];
}

export function setFormCalculationsInSections(
  sections: FormSection[],
  calculations: FormCalculation[],
): FormSection[] {
  if (sections.length === 0) return sections;

  return sections.map((section, index) => {
    const nextSettings = { ...(section.settings ?? {}) };
    const hadCalculations = Array.isArray(nextSettings.calculations);

    delete nextSettings.calculations;

    if (index === 0 && calculations.length > 0) {
      nextSettings.calculations = calculations;
    }

    const hasSettings = Object.keys(nextSettings).length > 0;

    if (index === 0 || hadCalculations) {
      return {
        ...section,
        settings: hasSettings ? nextSettings : undefined,
      };
    }

    return section;
  });
}

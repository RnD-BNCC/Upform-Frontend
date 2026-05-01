import { useMemo } from "react";
import IndividualTab from "./IndividualTab";
import { toDatabaseProgressResponse } from "./resultsResponseUtils";
import type { FormField, FormResponseProgress } from "@/types/form";

type ProgressTabProps = {
  allFields: FormField[];
  progressResponses: FormResponseProgress[];
};

export default function ProgressTab({
  allFields,
  progressResponses,
}: ProgressTabProps) {
  const responses = useMemo(
    () => progressResponses.map(toDatabaseProgressResponse),
    [progressResponses],
  );

  return (
    <IndividualTab
      allFields={allFields}
      emptyLabel="No in-progress submissions"
      responses={responses}
    />
  );
}

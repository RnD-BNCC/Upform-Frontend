import { motion } from "framer-motion";
import type { FormField, FormResponse } from "@/types/form";
import { FileResponseList } from "./charts";
import {
  cleanResultLabel,
  getResponseTimestamp,
  getResultFields,
} from "./resultsResponseUtils";

interface IndividualResponseCardProps {
  response: FormResponse;
  allFields: FormField[];
}

export default function IndividualResponseCard({
  response,
  allFields,
}: IndividualResponseCardProps) {
  const questionFields = getResultFields(allFields);
  const responseTime = getResponseTimestamp(response);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="px-5 py-3">
        <p className="text-xs text-gray-400">
          {response.status === "in_progress" ? "Last saved on" : "Submitted on"}{" "}
          {new Date(responseTime).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          at{" "}
          {new Date(responseTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {questionFields.map((field) => {
        const value = response.answers[field.id];

        return (
          <div key={field.id} className="px-5 py-3.5">
            <p className="mb-1 text-xs font-medium text-gray-400">
              {cleanResultLabel(field.label)}
            </p>
            {field.type === "file_upload" && value ? (
              <FileResponseList values={Array.isArray(value) ? value : [value]} />
            ) : (
              <p className="text-sm text-gray-800">
                {Array.isArray(value) ? value.join(", ") : value || "-"}
              </p>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

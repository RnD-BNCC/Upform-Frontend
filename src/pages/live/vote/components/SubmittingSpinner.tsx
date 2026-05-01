import { Spinner } from "@/components/ui";

export default function SubmittingSpinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <Spinner size={16} /> Submitting...
    </span>
  );
}

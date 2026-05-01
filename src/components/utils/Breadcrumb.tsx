import { CaretRight } from "@phosphor-icons/react";

export type FolderView =
  | { level: "root" }
  | { level: "event"; eventId: string; eventName: string }
  | {
      level: "respondent";
      eventId: string;
      eventName: string;
      responseId: string;
      respondentLabel: string;
    };

export function Breadcrumb({
  view,
  onNavigate,
}: {
  view: FolderView;
  onNavigate: (v: FolderView) => void;
}) {
  const segments: { label: string; view: FolderView }[] = [
    { label: "Files", view: { level: "root" } },
  ];

  if (view.level === "event" || view.level === "respondent") {
    segments.push({
      label: view.eventName,
      view: {
        level: "event",
        eventId: view.eventId,
        eventName: view.eventName,
      },
    });
  }

  if (view.level === "respondent") {
    segments.push({ label: view.respondentLabel, view });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1 text-sm">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;

        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <CaretRight size={13} weight="bold" className="text-gray-400" />
            )}
            <button
              onClick={() => !isLast && onNavigate(seg.view)}
              className={`font-semibold transition-colors ${
                isLast
                  ? "cursor-default text-gray-800"
                  : "cursor-pointer text-primary-500 hover:text-primary-700"
              }`}
            >
              {seg.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}

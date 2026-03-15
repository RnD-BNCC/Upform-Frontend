import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { FormSection } from "@/types/form";
import {
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import PreviewField from "./section/PreviewField";

type FormState = {
  sections: FormSection[];
  formTitle: string;
  formDescription: string;
  bannerColor?: string;
  bannerImage?: string | null;
};

export default function EventPreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as FormState | null;

  const sections = state?.sections ?? [];
  const formTitle = state?.formTitle ?? "Untitled Form";
  const formDescription = state?.formDescription ?? "";
  const bannerColor = state?.bannerColor ?? "#0054a5";
  const bannerImage = state?.bannerImage ?? null;

  const [sectionHistory, setSectionHistory] = useState<number[]>([0]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentSection = sectionHistory[sectionHistory.length - 1];
  const section = sections[currentSection];

  const getBranchNext = (): number | "end" => {
    for (const field of section?.fields ?? []) {
      if (!field.branches) continue;
      const answer = answers[field.id];
      if (!answer) continue;
      const val = Array.isArray(answer) ? answer[0] : answer;
      const target = field.branches[val];
      if (!target) continue;
      if (target === "end") return "end";
      const idx = sections.findIndex((s) => s.id === target);
      if (idx !== -1) return idx;
    }
    return currentSection + 1;
  };

  const nextIdx = getBranchNext();
  const isTerminalSection =
    section?.fields.some(
      (f) => f.branches && Object.values(f.branches).every((v) => v === "end"),
    ) ?? false;
  const isLast =
    nextIdx === "end" || nextIdx >= sections.length || isTerminalSection;

  const setAnswer = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setShakeIds((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
  };

  const validate = (sec: FormSection) => {
    const errs: Record<string, string> = {};
    sec.fields.forEach((f) => {
      if (f.type === "title_block" || f.type === "image_block") return;
      const val = answers[f.id];
      if (
        f.required &&
        (!val || (Array.isArray(val) && val.length === 0) || val === "")
      ) {
        errs[f.id] = "This question is required.";
      }
    });
    return errs;
  };

  const handleNext = () => {
    const errs = validate(section);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShakeIds(new Set(Object.keys(errs)));
      const firstId = Object.keys(errs)[0];
      fieldRefs.current[firstId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setErrors({});
    setDirection(1);
    const next = getBranchNext();
    if (next === "end" || next >= sections.length) {
      setSubmitted(true);
    } else {
      setSectionHistory((prev) => [...prev, next as number]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErrors({});
    setDirection(-1);
    setSectionHistory((prev) => prev.slice(0, -1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    const errs = validate(section);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShakeIds(new Set(Object.keys(errs)));
      const firstId = Object.keys(errs)[0];
      fieldRefs.current[firstId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-10 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckIcon size={24} weight="bold" color="#16a34a" />
          </motion.div>
          <h2 className="text-lg font-bold text-gray-900">
            Response recorded!
          </h2>
          <p className="text-sm text-gray-400 mt-1.5">
            Your response has been submitted successfully.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
          >
            ← Back to builder
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <header className="bg-primary-800 sticky top-0 z-60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm shrink-0 font-medium cursor-pointer"
          >
            <ArrowLeftIcon size={15} weight="bold" />
            <span className="hidden sm:inline">Back to editor</span>
          </button>
          <div className="h-5 w-px bg-white/20 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-white/60 truncate">
            Preview mode responses won't be saved
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-3">
        {bannerImage && (
          <div
            className="h-40 relative overflow-hidden rounded-xl"
            style={{
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div
            className="h-14 relative overflow-hidden"
            style={{ backgroundColor: bannerColor }}
          >
            {!bannerImage && (
              <>
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20" />
              </>
            )}
          </div>
          <div
            className="p-6 border-l-4"
            style={{ borderLeftColor: bannerColor }}
          >
            <h1 className="text-xl font-bold text-gray-900">{formTitle}</h1>
            {formDescription && (
              <div
                className="text-sm text-gray-900 mt-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal"
                dangerouslySetInnerHTML={{ __html: formDescription }}
              />
            )}
            {sections.some((s) => s.fields.some((f) => f.required)) && (
              <>
                <div className="-mx-6 mt-3 border-t border-gray-100" />
                <p className="text-xs text-red-500 mt-3">
                  * Menunjukkan pertanyaan yang wajib diisi
                </p>
              </>
            )}
          </div>
        </div>

        {section?.title && (
          <p className="text-sm font-semibold text-gray-600">{section.title}</p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-3"
          >
            {section?.fields.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
                No questions in this section yet.
              </div>
            )}
            {section?.fields.map((field) => (
              <PreviewField
                key={field.id}
                field={field}
                value={answers[field.id]}
                otherText={otherTexts[field.id] ?? ""}
                hasError={!!errors[field.id]}
                errorMessage={errors[field.id]}
                isShaking={shakeIds.has(field.id)}
                onAnswer={(value) => setAnswer(field.id, value)}
                onOtherTextChange={(text) =>
                  setOtherTexts((prev) => ({ ...prev, [field.id]: text }))
                }
                onAnimationComplete={() =>
                  setShakeIds((prev) => {
                    const next = new Set(prev);
                    next.delete(field.id);
                    return next;
                  })
                }
                setRef={(el) => {
                  fieldRefs.current[field.id] = el;
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2 gap-4">
          <button
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-2 px-1 cursor-pointer ${
              sectionHistory.length <= 1 ? "invisible" : ""
            }`}
          >
            <ArrowLeftIcon size={15} weight="bold" />
            Back
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={isLast ? handleSubmit : handleNext}
            className="flex items-center gap-1.5 bg-primary-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors duration-150 rounded cursor-pointer"
          >
            {isLast ? (
              "Submit"
            ) : (
              <>
                Next <ArrowRightIcon size={15} weight="bold" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

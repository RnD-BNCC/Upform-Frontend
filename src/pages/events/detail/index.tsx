import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
  QuestionCard,
  BuilderHeader,
  ShareDialog,
  FieldCategoryPanel,
  ThemeSidebar,
  PageTabBar,
  FieldPropertiesPanel,
  LogicModal,
  ThemePickerModal,
  RenameFormModal,
  CoverSettingsPanel,
  EndingSettingsPanel,
} from "@/components/builder";
import type { ThemeKey } from "@/components/builder";
import { THEMES } from "@/components/builder";
import { ConfirmModal, LoadingModal, StatusModal } from "@/components/ui";
import { useGetEventDetail, useUpdateEvent } from "@/hooks/events";
import { useUpdateSection, useCreateSection } from "@/hooks/sections";
import { useGetResponses } from "@/hooks/responses";
import { useMutationUploadImage } from "@/api/upload/queries";
import type { FormField, FormSection, FieldType } from "@/types/form";
import { ResponsesPanel } from "@/components/responses";
import {
  SpinnerGapIcon,
  FloppyDiskIcon,
  PencilSimpleIcon,
  DotsNineIcon,
  GearSixIcon,
} from "@phosphor-icons/react";
import RichInput from "@/components/builder/utils/RichInput";

type Tab = "questions" | "responses";
type LeftPanelMode = "fields" | "theme";

type SavedSnapshot = {
  title: string;
  color: string;
  image: string | null;
  sections: FormSection[];
};

// ─── Ending header sortable card ─────────────────────────────────────────────

type EndingHeaderCardProps = {
  endingTitle: string
  endingSubtitle: string
  themeConfig: (typeof THEMES)[number]
  onChangeTitle: (v: string) => void
  onChangeSubtitle: (v: string) => void
  isSelected: boolean
  onSelect: () => void
  endingShowDivider: boolean
  endingShowFillAgain: boolean
  endingShowUrlBtn: boolean
  endingUrlBtnText: string
  endingUrlBtnHref: string
  onChangeUrlBtnHref: (v: string) => void
  onChangeUrlBtnText: (v: string) => void
}

function EndingHeaderCard({
  endingTitle, endingSubtitle, themeConfig,
  onChangeTitle, onChangeSubtitle,
  isSelected, onSelect,
  endingShowDivider, endingShowFillAgain, endingShowUrlBtn,
  endingUrlBtnText, endingUrlBtnHref,
  onChangeUrlBtnHref, onChangeUrlBtnText,
}: EndingHeaderCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: '__ending_header__' })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group relative scheme-light">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className={`rounded-2xl w-full border transition-all duration-150 cursor-pointer ${
          isSelected ? 'ring-2 ring-primary-400' : 'hover:ring-2 hover:ring-primary-200'
        }`}
        style={{ background: themeConfig.bg, borderColor: `${themeConfig.textColor}18` }}
      >
        <div className="flex items-stretch">
          {/* Drag handle */}
          <div
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="w-6 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity touch-none self-stretch"
          >
            <DotsNineIcon size={14} weight="bold" />
          </div>

          {/* Content */}
          <div className="flex-1 px-12 py-10 flex flex-col items-center gap-4 text-center">
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: themeConfig.textColor }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5 9-9" stroke={themeConfig.textColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ color: themeConfig.textColor }} className="w-full">
              <RichInput value={endingTitle} onChange={onChangeTitle} placeholder="Thank you"
                className="text-2xl font-bold text-center bg-transparent outline-none border-b-2 border-transparent hover:border-gray-200 focus:border-primary-400 transition-colors w-full"
                stopPropagation noLists />
            </div>
            <div style={{ color: themeConfig.textColor, opacity: 0.65 }} className="w-full">
              <RichInput value={endingSubtitle} onChange={onChangeSubtitle} placeholder="Your response has been submitted."
                className="text-sm text-center bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-primary-400 transition-colors w-full"
                stopPropagation noLists />
            </div>
            <button
              className="rounded-full px-4 py-1.5 text-sm cursor-default select-none transition-colors"
              style={{ border: `1px solid ${themeConfig.textColor}30`, color: `${themeConfig.textColor}80` }}
            >
              Made with <strong style={{ color: themeConfig.textColor }}>UpForm</strong>
            </button>
            {(endingShowDivider || endingShowFillAgain || endingShowUrlBtn) && (
              <div className="flex flex-col items-center gap-3 mt-2 w-full" onClick={(e) => e.stopPropagation()}>
                {endingShowDivider && <hr className="w-full" style={{ borderColor: `${themeConfig.textColor}20` }} />}
                {endingShowFillAgain && (
                  <button className="px-5 py-2 text-sm font-medium border rounded-lg cursor-default select-none transition-colors"
                    style={{ color: `${themeConfig.textColor}90`, borderColor: `${themeConfig.textColor}30` }}>
                    Submit another response
                  </button>
                )}
                {endingShowUrlBtn && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                    <button className="w-full px-5 py-2 text-sm font-semibold text-primary-600 border border-primary-200 bg-primary-50 rounded-lg cursor-default select-none">
                      {endingUrlBtnText || 'Visit our website'}
                    </button>
                    <input type="url" value={endingUrlBtnHref}
                      onChange={(e) => onChangeUrlBtnHref(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 text-gray-600"
                      onClick={(e) => e.stopPropagation()} />
                    <input type="text" value={endingUrlBtnText}
                      onChange={(e) => onChangeUrlBtnText(e.target.value)}
                      placeholder="Button text"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 text-gray-600"
                      onClick={(e) => e.stopPropagation()} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating actions: settings only, no delete */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+36px)] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-primary-600 hover:border-primary-200 transition-colors"
          title="Settings"
        >
          <GearSixIcon size={13} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: existing, isLoading } = useGetEventDetail(id ?? "");
  const { data: responses = [] } = useGetResponses(id ?? "");
  const updateEvent = useUpdateEvent();
  const updateSection = useUpdateSection(id ?? "");
  const createSection = useCreateSection(id ?? "");
  const uploadImage = useMutationUploadImage();

  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [bannerColor, setBannerColor] = useState("#0054a5");
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("light");
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("fields");
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("questions");

  // Welcome flow
  const [welcomeThemePicker, setWelcomeThemePicker] = useState(false);
  const [welcomeRename, setWelcomeRename] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<ThemeKey>("light");
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);

  const questionsEndRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<{
    stack: FormSection[][];
    index: number;
  }>({
    stack: [[{ id: crypto.randomUUID(), title: "", fields: [] }]],
    index: 0,
  });
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(
    null,
  );
  const [eventStatus, setEventStatus] = useState<"draft" | "active" | "closed">(
    "draft",
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "unpublish" | "close" | "publish" | null
  >(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<
    "unpublish" | "close" | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [endingTitle, setEndingTitle] = useState("Thank you");
  const [endingSubtitle, setEndingSubtitle] = useState(
    "Your response has been submitted.",
  );
  const [endingShowDivider, setEndingShowDivider] = useState(false);
  const [endingShowFillAgain, setEndingShowFillAgain] = useState(false);
  const [endingShowUrlBtn, setEndingShowUrlBtn] = useState(false);
  const [endingUrlBtnText, setEndingUrlBtnText] = useState("Visit our website");
  const [endingUrlBtnHref, setEndingUrlBtnHref] = useState("");
  const savedStateRef = useRef<string>("");
  const [startButtonText, setStartButtonText] = useState("Start");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [coverHeroImage, setCoverHeroImage] = useState<string | null>(null);
  const [coverLayout, setCoverLayout] = useState(0);
  const [, setActiveId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const showToast = useCallback((msg = "Saved successfully") => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (initialized) return;

    const nav = location.state as {
      sections?: FormSection[];
      formTitle?: string;
      bannerColor?: string;
      bannerImage?: string | null;
      theme?: ThemeKey;
      isNew?: boolean;
    } | null;

    if (nav?.sections) {
      setFormTitle(nav.formTitle ?? "Untitled Form");
      setBannerColor(nav.bannerColor ?? "#0054a5");
      setBannerImage(nav.bannerImage ?? null);
      if (nav.theme) setActiveTheme(nav.theme);
      setHistory({ stack: [nav.sections], index: 0 });
      if (existing) {
        setSavedSnapshot({
          title: existing.name || "Untitled Form",
          color: existing.color || "#0054a5",
          image: existing.image ?? null,
          sections: existing.sections ?? [],
        });
        setEventStatus(existing.status);
      }
      savedStateRef.current = JSON.stringify({
        title: nav.formTitle ?? "Untitled Form",
        color: nav.bannerColor ?? "#0054a5",
        image: nav.bannerImage ?? null,
        sections: nav.sections,
      });
      setInitialized(true);
      window.history.replaceState({}, "");
      return;
    }

    if (isLoading) return;
    if (existing) {
      const title = existing.name || "Untitled Form";
      const color = existing.color || "#0054a5";
      const secs = existing.sections?.length
        ? existing.sections
        : [{ id: crypto.randomUUID(), title: "", fields: [] }];
      const img = existing.image ?? null;
      const theme = (existing.theme as ThemeKey) || "light";
      setFormTitle(title);
      setBannerColor(color);
      setBannerImage(img);
      setActiveTheme(theme);
      setHistory({ stack: [secs], index: 0 });
      setSavedSnapshot({ title, color, image: img, sections: secs });
      setEventStatus(existing.status);
      const coverSec = secs.find((s) => s.pageType === "cover");
      const endingSec = secs.find((s) => s.pageType === "ending");
      if (coverSec?.settings?.startButtonText)
        setStartButtonText(coverSec.settings.startButtonText as string);
      if (coverSec?.settings?.coverHeroImage)
        setCoverHeroImage(coverSec.settings.coverHeroImage as string);
      if (coverSec?.settings?.coverLayout != null)
        setCoverLayout(coverSec.settings.coverLayout as number);
      if (endingSec?.settings?.endingTitle)
        setEndingTitle(endingSec.settings.endingTitle as string);
      if (endingSec?.settings?.endingSubtitle)
        setEndingSubtitle(endingSec.settings.endingSubtitle as string);
      if (endingSec?.settings?.endingShowDivider) setEndingShowDivider(true);
      if (endingSec?.settings?.endingShowFillAgain)
        setEndingShowFillAgain(true);
      if (endingSec?.settings?.endingShowUrlBtn) setEndingShowUrlBtn(true);
      if (endingSec?.settings?.endingUrlBtnText)
        setEndingUrlBtnText(endingSec.settings.endingUrlBtnText as string);
      if (endingSec?.settings?.endingUrlBtnHref)
        setEndingUrlBtnHref(endingSec.settings.endingUrlBtnHref as string);
      savedStateRef.current = JSON.stringify({
        title,
        color,
        image: img,
        sections: secs,
      });
      setInitialized(true);
      // Show welcome flow for new forms
      if (nav?.isNew) {
        setWelcomeThemePicker(true);
        window.history.replaceState({}, "");
      }
    } else {
      navigate("/", { replace: true });
    }
  }, [existing, isLoading, initialized, navigate, location.state]);

  useEffect(() => {
    if (initialized && existing) {
      setEventStatus(existing.status);
    }
  }, [initialized, existing?.status]);

  const sections = history.stack[history.index];
  const setSections = (
    updater: FormSection[] | ((prev: FormSection[]) => FormSection[]),
  ) => {
    setHistory((prev) => {
      const current = prev.stack[prev.index];
      const next = typeof updater === "function" ? updater(current) : updater;
      const newStack = prev.stack.slice(0, prev.index + 1);
      newStack.push(next);
      return { stack: newStack, index: prev.index + 1 };
    });
  };

  const isDirty = useMemo(() => {
    if (!savedStateRef.current) return false;
    return (
      JSON.stringify({
        title: formTitle,
        color: bannerColor,
        image: bannerImage,
        sections,
      }) !== savedStateRef.current
    );
  }, [formTitle, bannerColor, bannerImage, sections]);

  const uploadBlobUrl = useCallback(
    async (blobUrl: string) => {
      try {
        const res = await fetch(blobUrl);
        const blob = await res.blob();
        const file = new File(
          [blob],
          `image-${Date.now()}.${blob.type.split("/")[1] || "png"}`,
          { type: blob.type },
        );
        const { url } = await uploadImage.mutateAsync(file);
        URL.revokeObjectURL(blobUrl);
        return url;
      } catch (err) {
        console.error("[uploadBlobUrl]:", err);
        return blobUrl;
      }
    },
    [uploadImage],
  );

  const handleSave = useCallback(async () => {
    if (!id || isSaving) return;
    setIsSaving(true);
    try {
      const resolvedBannerImage = bannerImage?.startsWith("blob:")
        ? await uploadBlobUrl(bannerImage)
        : bannerImage;
      if (resolvedBannerImage !== bannerImage)
        setBannerImage(resolvedBannerImage);

      await updateEvent.mutateAsync({
        eventId: id,
        name: formTitle,
        color: bannerColor,
        image: resolvedBannerImage,
        theme: activeTheme,
      });

      const resolvedSections = await Promise.all(
        sections.map(async (s) => {
          const settings = { ...(s.settings ?? {}) };
          if (
            typeof settings.coverHeroImage === "string" &&
            settings.coverHeroImage.startsWith("blob:")
          ) {
            settings.coverHeroImage = await uploadBlobUrl(
              settings.coverHeroImage as string,
            );
            if (s.pageType === "cover")
              setCoverHeroImage(settings.coverHeroImage as string);
          }
          const fields = await Promise.all(
            s.fields.map(async (f) => {
              const updates: Partial<FormField> = {};
              if (f.headerImage?.startsWith("blob:")) {
                updates.headerImage = await uploadBlobUrl(f.headerImage);
              }
              if (f.optionImages) {
                const imgs = { ...f.optionImages };
                let changed = false;
                for (const [key, url] of Object.entries(imgs)) {
                  if (url.startsWith("blob:")) {
                    imgs[key] = await uploadBlobUrl(url);
                    changed = true;
                  }
                }
                if (changed) updates.optionImages = imgs;
              }
              return Object.keys(updates).length ? { ...f, ...updates } : f;
            }),
          );
          return { ...s, settings, fields };
        }),
      );

      await Promise.all(
        resolvedSections.map((s) =>
          updateSection.mutateAsync({
            sectionId: s.id,
            title: s.title,
            description: s.description,
            fields: s.fields,
            pageType: s.pageType,
            settings: s.settings,
            logicX: s.logicX,
            logicY: s.logicY,
          }),
        ),
      );

      setSections(resolvedSections);
      setSavedSnapshot({
        title: formTitle,
        color: bannerColor,
        image: resolvedBannerImage,
        sections: JSON.parse(JSON.stringify(resolvedSections)),
      });
      savedStateRef.current = JSON.stringify({
        title: formTitle,
        color: bannerColor,
        image: resolvedBannerImage,
        sections: resolvedSections,
      });
      showToast();
    } catch (err) {
      console.error("[handleSave]:", err);
    } finally {
      setIsSaving(false);
    }
  }, [
    id,
    isSaving,
    formTitle,
    bannerColor,
    bannerImage,
    activeTheme,
    sections,
    updateEvent,
    updateSection,
    uploadBlobUrl,
    showToast,
  ]);

  const handlePublish = useCallback(async () => {
    if (!id || isPublishing) return;
    setConfirmAction(null);
    if (isDirty) await handleSave();
    setIsPublishing(true);
    try {
      await updateEvent.mutateAsync({ eventId: id, status: "active" });
      setEventStatus("active");
      setShowShareDialog(true);
    } catch (err) {
      console.error("[handlePublish]", err);
    } finally {
      setIsPublishing(false);
    }
  }, [id, isPublishing, isDirty, handleSave, updateEvent]);

  const handleStatusChange = useCallback(
    async (action: "unpublish" | "close") => {
      if (!id || isChangingStatus) return;
      setConfirmAction(null);
      setIsChangingStatus(true);
      try {
        const status = action === "unpublish" ? "draft" : "closed";
        await updateEvent.mutateAsync({ eventId: id, status });
        setEventStatus(status);
        setStatusResult(action);
      } catch (err) {
        console.error("[handleStatusChange]", err);
      } finally {
        setIsChangingStatus(false);
      }
    },
    [id, isChangingStatus, updateEvent],
  );

  const handleNodeMove = useCallback((nodeId: string, x: number, y: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === nodeId ? { ...s, logicX: x, logicY: y } : s)),
    );
  }, []);

  const handleThemeChange = useCallback(
    async (theme: ThemeKey) => {
      setActiveTheme(theme);
      if (!id) return;
      try {
        await updateEvent.mutateAsync({ eventId: id, theme });
      } catch (err) {
        console.error("[handleThemeChange]", err);
      }
    },
    [id, updateEvent],
  );

  const addPage = useCallback(
    async (type: "page" | "cover" | "ending") => {
      if (!id) return;
      setIsAddingPage(true);
      try {
        const label =
          type === "cover" ? "Cover" : type === "ending" ? "Ending" : "Page";
        const order = sections.length;
        const result = await createSection.mutateAsync({
          title: label,
          pageType: type,
          order,
        });
        const newSection: FormSection = {
          id: result.id,
          title: label,
          description: "",
          fields: [],
          pageType: type,
        };
        setSections((prev) => [...prev, newSection]);
        setActivePageIdx(sections.length);
      } catch (err) {
        console.error("[addPage]", err);
      } finally {
        setIsAddingPage(false);
      }
    },
    [id, sections.length, createSection],
  );

  const publicFormUrl = `${window.location.origin}/forms/${id}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistory((prev) =>
          prev.index <= 0 ? prev : { ...prev, index: prev.index - 1 },
        );
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        setHistory((prev) =>
          prev.index >= prev.stack.length - 1
            ? prev
            : { ...prev, index: prev.index + 1 },
        );
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const activePage = sections[activePageIdx] ?? sections[0];
  const activePageType = activePage?.pageType ?? "page";
  const themeConfig = THEMES.find((t) => t.key === activeTheme) ?? THEMES[0];

  const FIELD_LABEL: Partial<Record<FieldType, string>> = {
    short_text: "Short text",
    paragraph: "Paragraph",
    email: "Email",
    number: "Number",
    phone: "Phone",
    rich_text: "Rich text",
    checkbox: "Checkbox",
    multiple_choice: "Multiple choice",
    dropdown: "Dropdown",
    ranking: "Ranking",
    currency: "Currency",
    date: "Date",
    time: "Time",
    rating: "Rating",
    linear_scale: "Linear scale",
    file_upload: "File upload",
    opinion_scale: "Opinion scale",
    address: "Address",
  };

  const toggleEndingDivider = () => {
    const v = !endingShowDivider;
    setEndingShowDivider(v);
    setSections((prev) =>
      prev.map((s) =>
        s.pageType === "ending"
          ? { ...s, settings: { ...s.settings, endingShowDivider: v } }
          : s,
      ),
    );
  };
  const toggleEndingFillAgain = () => {
    const v = !endingShowFillAgain;
    setEndingShowFillAgain(v);
    setSections((prev) =>
      prev.map((s) =>
        s.pageType === "ending"
          ? { ...s, settings: { ...s.settings, endingShowFillAgain: v } }
          : s,
      ),
    );
  };
  const toggleEndingUrlBtn = () => {
    const v = !endingShowUrlBtn;
    setEndingShowUrlBtn(v);
    setSections((prev) =>
      prev.map((s) =>
        s.pageType === "ending"
          ? { ...s, settings: { ...s.settings, endingShowUrlBtn: v } }
          : s,
      ),
    );
  };

  const addField = (
    type: FieldType,
    sectionId: string,
    initialImageUrl?: string,
  ) => {
    const hasOptions = ["multiple_choice", "checkbox", "dropdown"].includes(
      type,
    );
    const isTitleBlock = type === "title_block";
    const isMedia = type === "image_block";
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: isTitleBlock || isMedia ? "" : (FIELD_LABEL[type] ?? "Question"),
      required: false,
      options: hasOptions ? ["Option 1", "Option 2"] : undefined,
      ...(initialImageUrl
        ? {
            headerImage: initialImageUrl,
            imageWidth: 100,
            imageAlign: "left" as const,
          }
        : {}),
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s,
      ),
    );
    setSelectedId(newField.id);
    setIsRightPanelOpen(true);
    setTimeout(
      () =>
        questionsEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      80,
    );
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f,
              ),
            },
      ),
    );
  };

  const deleteField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) },
      ),
    );
    if (selectedId === fieldId) setSelectedId(null);
  };

  const duplicateField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const field = s.fields.find((f) => f.id === fieldId);
        if (!field) return s;
        const newField: FormField = { ...field, id: crypto.randomUUID() };
        const idx = s.fields.findIndex((f) => f.id === fieldId);
        const updated = [...s.fields];
        updated.splice(idx + 1, 0, newField);
        return { ...s, fields: updated };
      }),
    );
  };

  const findFieldInfo = (fieldId: string) => {
    for (const section of sections) {
      const idx = section.fields.findIndex((f) => f.id === fieldId);
      if (idx !== -1) return { sectionId: section.id, fieldIdx: idx };
    }
    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeInfo = findFieldInfo(active.id as string);
    const overInfo = findFieldInfo(over.id as string);
    if (!activeInfo || !overInfo || activeInfo.sectionId === overInfo.sectionId)
      return;
    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
      const src = next.find((s) => s.id === activeInfo.sectionId)!;
      const dst = next.find((s) => s.id === overInfo.sectionId)!;
      const [moved] = src.fields.splice(activeInfo.fieldIdx, 1);
      const dstIdx = dst.fields.findIndex((f) => f.id === over.id);
      dst.fields.splice(dstIdx >= 0 ? dstIdx : dst.fields.length, 0, moved);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeInfo = findFieldInfo(active.id as string);
    const overInfo = findFieldInfo(over.id as string);
    if (!activeInfo || !overInfo || activeInfo.sectionId !== overInfo.sectionId)
      return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== activeInfo.sectionId) return s;
        return {
          ...s,
          fields: arrayMove(s.fields, activeInfo.fieldIdx, overInfo.fieldIdx),
        };
      }),
    );
  };

  const handleEndingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id || !activePage) return;
    const allIds = ["__ending_header__", ...activePage.fields.map((f) => f.id)];
    const oldIdx = allIds.indexOf(active.id as string);
    const newIdx = allIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(allIds, oldIdx, newIdx);
    const headerIdx = reordered.indexOf("__ending_header__");
    const newFields = reordered
      .filter((fid) => fid !== "__ending_header__")
      .map((fid) => activePage.fields.find((f) => f.id === fid)!);
    setSections((prev) =>
      prev.map((s) =>
        s.id === activePage.id
          ? { ...s, fields: newFields, settings: { ...s.settings, endingHeaderIdx: headerIdx } }
          : s,
      ),
    );
  };

  const selectedField = useMemo(() => {
    for (const s of sections) {
      const f = s.fields.find((f) => f.id === selectedId);
      if (f) return { field: f, sectionId: s.id };
    }
    return null;
  }, [sections, selectedId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <SpinnerGapIcon size={32} className="text-primary-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  const isCoverPage = activePageType === "cover";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BuilderHeader
        formTitle={formTitle}
        onTitleChange={setFormTitle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => (isDirty ? setShowLeaveDialog(true) : navigate("/"))}
        onPreview={() =>
          navigate(`/forms/${id}/preview`, {
            state: { sections, formTitle, bannerColor, bannerImage },
          })
        }
        isSaving={isSaving}
        isDirty={isDirty}
        eventStatus={eventStatus}
        onPublish={() => setConfirmAction("publish")}
        isPublishing={isPublishing}
        onShare={() => setShowShareDialog(true)}
        onUnpublish={() => setConfirmAction("unpublish")}
        onClose={() => setConfirmAction("close")}
      />

      {activeTab === "questions" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          {leftPanelMode === "theme" ? (
            <ThemeSidebar
              activeTheme={activeTheme}
              onThemeChange={handleThemeChange}
              onClose={() => setLeftPanelMode("fields")}
            />
          ) : activePageType === "cover" ? (
            <CoverSettingsPanel
              startText={startButtonText}
              onStartTextChange={(text) => {
                setStartButtonText(text);
                setSections((prev) =>
                  prev.map((s) =>
                    s.pageType === "cover"
                      ? {
                          ...s,
                          settings: { ...s.settings, startButtonText: text },
                        }
                      : s,
                  ),
                );
              }}
              coverImage={coverHeroImage}
              onAddImage={async (file) => {
                try {
                  const { url } = await uploadImage.mutateAsync(file);
                  setCoverHeroImage(url);
                  setSections((prev) =>
                    prev.map((s) =>
                      s.pageType === "cover"
                        ? {
                            ...s,
                            settings: { ...s.settings, coverHeroImage: url },
                          }
                        : s,
                    ),
                  );
                } catch (err) {
                  console.error("[cover onAddImage]", err);
                }
              }}
              onRemoveImage={() => {
                setCoverHeroImage(null);
                setSections((prev) =>
                  prev.map((s) =>
                    s.pageType === "cover"
                      ? {
                          ...s,
                          settings: { ...s.settings, coverHeroImage: null },
                        }
                      : s,
                  ),
                );
              }}
              coverLayout={coverLayout}
              onLayoutChange={(i) => {
                setCoverLayout(i);
                setSections((prev) =>
                  prev.map((s) =>
                    s.pageType === "cover"
                      ? { ...s, settings: { ...s.settings, coverLayout: i } }
                      : s,
                  ),
                );
              }}
            />
          ) : activePageType === "ending" ? (
            <EndingSettingsPanel
              onAddField={(type) => {
                if (activePage) addField(type, activePage.id);
              }}
              showDivider={endingShowDivider}
              showFillAgain={endingShowFillAgain}
              showUrlBtn={endingShowUrlBtn}
              onToggleDivider={toggleEndingDivider}
              onToggleFillAgain={toggleEndingFillAgain}
              onToggleUrlBtn={toggleEndingUrlBtn}
            />
          ) : (
            <FieldCategoryPanel
              onAddField={(type) => {
                if (activePage) addField(type, activePage.id);
              }}
              onAddImageBlock={async (file) => {
                try {
                  const { url } = await uploadImage.mutateAsync(file);
                  if (activePage) addField("image_block", activePage.id, url);
                } catch (err) {
                  console.error("[onAddImageBlock]", err);
                }
              }}
            />
          )}

          {/* Canvas + PageTabBar column */}
          <div className="flex-1 flex flex-col overflow-hidden relative mx-4 mt-4">
            {/* Theme toggle button — sticky (outside scrollable canvas) */}
            <div className="absolute top-4 left-3 z-10 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftPanelMode((m) => (m === "theme" ? "fields" : "theme"));
                }}
                className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  leftPanelMode === "theme"
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <PencilSimpleIcon size={13} />
                Theme
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto border-x border-gray-200 rounded-2xl"
              style={{ background: themeConfig.canvasBg }}
              onClick={() => setSelectedId(null)}
            >
              {/* Cover page */}
              {isCoverPage && (
                <div
                  className="flex items-center justify-center min-h-full px-8 py-16"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Layout 1: image left, text right */}
                  {coverLayout === 1 ? (
                    <div className="w-full max-w-2xl flex gap-8 items-center">
                      <div className="w-1/2 shrink-0">
                        {coverHeroImage ? (
                          <img
                            src={coverHeroImage}
                            alt="Cover"
                            className="w-full h-56 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-56 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <span
                              className="text-xs opacity-40"
                              style={{ color: themeConfig.textColor }}
                            >
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-4">
                        <div style={{ color: themeConfig.textColor }}>
                          <RichInput
                            value={
                              (activePage.settings?.coverTitle as string) ?? ""
                            }
                            onChange={(v) =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === activePage.id
                                    ? {
                                        ...s,
                                        settings: {
                                          ...s.settings,
                                          coverTitle: v,
                                        },
                                      }
                                    : s,
                                ),
                              )
                            }
                            placeholder="Type your title..."
                            placeholderClassName="text-3xl font-bold italic text-gray-300"
                            className="w-full text-3xl font-bold italic bg-transparent outline-none border-none"
                            stopPropagation
                            noLists
                          />
                        </div>
                        <div
                          style={{
                            color: themeConfig.textColor,
                            opacity: 0.65,
                          }}
                        >
                          <RichInput
                            value={
                              (activePage.settings
                                ?.coverDescription as string) ?? ""
                            }
                            onChange={(v) =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === activePage.id
                                    ? {
                                        ...s,
                                        settings: {
                                          ...s.settings,
                                          coverDescription: v,
                                        },
                                      }
                                    : s,
                                ),
                              )
                            }
                            placeholder="Add a description..."
                            className="w-full text-base bg-transparent outline-none border-none"
                            stopPropagation
                            noLists
                          />
                        </div>
                        <button
                          className="w-fit px-6 py-2.5 text-white font-semibold text-sm rounded-lg cursor-default select-none"
                          style={{ background: themeConfig.btnBg }}
                        >
                          {startButtonText || "Start"}
                        </button>
                      </div>
                    </div>
                  ) : coverLayout === 2 ? (
                    /* Layout 2: text left, image right */
                    <div className="w-full max-w-2xl flex gap-8 items-center">
                      <div className="flex-1 flex flex-col gap-4">
                        <div style={{ color: themeConfig.textColor }}>
                          <RichInput
                            value={
                              (activePage.settings?.coverTitle as string) ?? ""
                            }
                            onChange={(v) =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === activePage.id
                                    ? {
                                        ...s,
                                        settings: {
                                          ...s.settings,
                                          coverTitle: v,
                                        },
                                      }
                                    : s,
                                ),
                              )
                            }
                            placeholder="Type your title..."
                            placeholderClassName="text-3xl font-bold italic text-gray-300"
                            className="w-full text-3xl font-bold italic bg-transparent outline-none border-none"
                            stopPropagation
                            noLists
                          />
                        </div>
                        <div
                          style={{
                            color: themeConfig.textColor,
                            opacity: 0.65,
                          }}
                        >
                          <RichInput
                            value={
                              (activePage.settings
                                ?.coverDescription as string) ?? ""
                            }
                            onChange={(v) =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === activePage.id
                                    ? {
                                        ...s,
                                        settings: {
                                          ...s.settings,
                                          coverDescription: v,
                                        },
                                      }
                                    : s,
                                ),
                              )
                            }
                            placeholder="Add a description..."
                            className="w-full text-base bg-transparent outline-none border-none"
                            stopPropagation
                            noLists
                          />
                        </div>
                        <button
                          className="w-fit px-6 py-2.5 text-white font-semibold text-sm rounded-lg cursor-default select-none"
                          style={{ background: themeConfig.btnBg }}
                        >
                          {startButtonText || "Start"}
                        </button>
                      </div>
                      <div className="w-1/2 shrink-0">
                        {coverHeroImage ? (
                          <img
                            src={coverHeroImage}
                            alt="Cover"
                            className="w-full h-56 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-56 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <span
                              className="text-xs opacity-40"
                              style={{ color: themeConfig.textColor }}
                            >
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : coverLayout === 3 ? (
                    /* Layout 3: image top, text bottom */
                    <div className="w-full max-w-lg flex flex-col items-center gap-6">
                      {coverHeroImage ? (
                        <img
                          src={coverHeroImage}
                          alt="Cover"
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-48 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                          <span
                            className="text-xs opacity-40"
                            style={{ color: themeConfig.textColor }}
                          >
                            No image
                          </span>
                        </div>
                      )}
                      <div
                        style={{ color: themeConfig.textColor }}
                        className="w-full text-center"
                      >
                        <RichInput
                          value={
                            (activePage.settings?.coverTitle as string) ?? ""
                          }
                          onChange={(v) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === activePage.id
                                  ? {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        coverTitle: v,
                                      },
                                    }
                                  : s,
                              ),
                            )
                          }
                          placeholder="Type your title..."
                          placeholderClassName="text-center text-4xl font-bold italic text-gray-300"
                          className="w-full text-center text-4xl font-bold italic bg-transparent outline-none border-none"
                          stopPropagation
                          noLists
                        />
                      </div>
                      <div
                        style={{ color: themeConfig.textColor, opacity: 0.65 }}
                        className="w-full text-center"
                      >
                        <RichInput
                          value={
                            (activePage.settings?.coverDescription as string) ??
                            ""
                          }
                          onChange={(v) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === activePage.id
                                  ? {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        coverDescription: v,
                                      },
                                    }
                                  : s,
                              ),
                            )
                          }
                          placeholder="Add a description..."
                          className="w-full text-center text-base bg-transparent outline-none border-none"
                          stopPropagation
                          noLists
                        />
                      </div>
                      <button
                        className="mt-1 px-8 py-3 text-white font-semibold text-sm rounded-lg cursor-default select-none"
                        style={{ background: themeConfig.btnBg }}
                      >
                        {startButtonText || "Start"}
                      </button>
                    </div>
                  ) : (
                    /* Layout 0 (default): centered, image above title */
                    <div className="w-full max-w-lg text-center flex flex-col items-center gap-5">
                      {coverHeroImage && (
                        <img
                          src={coverHeroImage}
                          alt="Cover"
                          className="w-24 h-24 object-cover rounded-xl mb-1"
                        />
                      )}
                      <div
                        style={{ color: themeConfig.textColor }}
                        className="w-full"
                      >
                        <RichInput
                          value={
                            (activePage.settings?.coverTitle as string) ?? ""
                          }
                          onChange={(v) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === activePage.id
                                  ? {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        coverTitle: v,
                                      },
                                    }
                                  : s,
                              ),
                            )
                          }
                          placeholder="Type your title..."
                          placeholderClassName="text-center text-4xl font-bold italic text-gray-300"
                          className="w-full text-center text-4xl font-bold italic bg-transparent outline-none border-none"
                          stopPropagation
                          noLists
                        />
                      </div>
                      <div
                        style={{ color: themeConfig.textColor, opacity: 0.65 }}
                        className="w-full"
                      >
                        <RichInput
                          value={
                            (activePage.settings?.coverDescription as string) ??
                            ""
                          }
                          onChange={(v) =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === activePage.id
                                  ? {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        coverDescription: v,
                                      },
                                    }
                                  : s,
                              ),
                            )
                          }
                          placeholder="Add a description..."
                          className="w-full text-center text-base bg-transparent outline-none border-none"
                          stopPropagation
                          noLists
                        />
                      </div>
                      <button
                        className="mt-2 px-8 py-3 text-white font-semibold text-sm rounded-lg cursor-default select-none"
                        style={{ background: themeConfig.btnBg }}
                      >
                        {startButtonText || "Start"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Page (fields) */}
              {activePageType === "page" && activePage && (
                <div
                  className="max-w-2xl mx-auto py-8 px-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(e.active.id as string)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className={`bg-white rounded-xl p-6 flex flex-wrap gap-4 scheme-light ${themeConfig.key !== "light" ? "shadow-sm border border-gray-600" : ""}`}
                    >
                      <SortableContext
                        items={activePage.fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <AnimatePresence>
                          {activePage.fields.map((field) => (
                            <div
                              key={field.id}
                              className={field.fieldWidth === "half" ? "basis-[calc(50%-8px)] min-w-0 shrink-0" : "w-full"}
                            >
                            <QuestionCard
                              field={field}
                              sections={sections}
                              isSelected={selectedId === field.id}
                              onSelect={() => {
                                setSelectedId(field.id);
                                setIsRightPanelOpen(true);
                              }}
                              onOpenSettings={() => {
                                setSelectedId(field.id);
                                setIsRightPanelOpen(true);
                              }}
                              onChange={(updates) =>
                                updateField(activePage.id, field.id, updates)
                              }
                              onDelete={() =>
                                deleteField(activePage.id, field.id)
                              }
                              onDuplicate={() =>
                                duplicateField(activePage.id, field.id)
                              }
                              accentColor={bannerColor}
                            />
                            </div>
                          ))}
                        </AnimatePresence>
                      </SortableContext>

                      {activePage.fields.length === 0 && (
                        <div className="py-8 text-center text-sm text-gray-400">
                          Click a field type on the left to add a question
                        </div>
                      )}

                      {activePage.fields.length > 0 && (
                        <div className="pt-2">
                          <button
                            className="px-6 py-2.5 text-white font-semibold text-sm rounded-lg cursor-default select-none"
                            style={{ background: themeConfig.btnBg }}
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>

                    <div ref={questionsEndRef} />
                  </DndContext>
                </div>
              )}

              {/* Ending page */}
              {activePageType === "ending" && activePage && (
                <div
                  className="max-w-2xl mx-auto py-8 px-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(e.active.id as string)}
                    onDragEnd={handleEndingDragEnd}
                  >
                    {(() => {
                      const endingHeaderIdx = (activePage.settings?.endingHeaderIdx as number) ?? 0
                      const fieldIds = activePage.fields.map((f) => f.id)
                      const allEndingIds = [...fieldIds]
                      allEndingIds.splice(Math.min(endingHeaderIdx, allEndingIds.length), 0, "__ending_header__")
                      return (
                        <SortableContext items={allEndingIds} strategy={verticalListSortingStrategy}>
                          <div className="flex flex-col gap-4">
                            <AnimatePresence>
                              {allEndingIds.map((eid) => {
                                if (eid === "__ending_header__") {
                                  return (
                                    <EndingHeaderCard
                                      key="__ending_header__"
                                      endingTitle={endingTitle}
                                      endingSubtitle={endingSubtitle}
                                      themeConfig={themeConfig}
                                      onChangeTitle={(v) => {
                                        setEndingTitle(v)
                                        setSections((prev) => prev.map((s) => s.pageType === "ending" ? { ...s, settings: { ...s.settings, endingTitle: v } } : s))
                                      }}
                                      onChangeSubtitle={(v) => {
                                        setEndingSubtitle(v)
                                        setSections((prev) => prev.map((s) => s.pageType === "ending" ? { ...s, settings: { ...s.settings, endingSubtitle: v } } : s))
                                      }}
                                      isSelected={selectedId === "__ending_header__"}
                                      onSelect={() => { setSelectedId("__ending_header__"); setIsRightPanelOpen(true) }}
                                      endingShowDivider={endingShowDivider}
                                      endingShowFillAgain={endingShowFillAgain}
                                      endingShowUrlBtn={endingShowUrlBtn}
                                      endingUrlBtnText={endingUrlBtnText}
                                      endingUrlBtnHref={endingUrlBtnHref}
                                      onChangeUrlBtnHref={(v) => {
                                        setEndingUrlBtnHref(v)
                                        setSections((prev) => prev.map((s) => s.pageType === "ending" ? { ...s, settings: { ...s.settings, endingUrlBtnHref: v } } : s))
                                      }}
                                      onChangeUrlBtnText={(v) => {
                                        setEndingUrlBtnText(v)
                                        setSections((prev) => prev.map((s) => s.pageType === "ending" ? { ...s, settings: { ...s.settings, endingUrlBtnText: v } } : s))
                                      }}
                                    />
                                  )
                                }
                                const field = activePage.fields.find((f) => f.id === eid)!
                                return (
                                  <QuestionCard
                                    key={field.id}
                                    field={field}
                                    sections={sections}
                                    isSelected={selectedId === field.id}
                                    onSelect={() => { setSelectedId(field.id); setIsRightPanelOpen(true) }}
                                    onOpenSettings={() => { setSelectedId(field.id); setIsRightPanelOpen(true) }}
                                    onChange={(updates) => updateField(activePage.id, field.id, updates)}
                                    onDelete={() => deleteField(activePage.id, field.id)}
                                    onDuplicate={() => duplicateField(activePage.id, field.id)}
                                    accentColor={bannerColor}
                                  />
                                )
                              })}
                            </AnimatePresence>
                          </div>
                        </SortableContext>
                      )
                    })()}
                    <div ref={questionsEndRef} />
                  </DndContext>
                </div>
              )}
            </div>

            <PageTabBar
              pages={sections}
              activePageIdx={activePageIdx}
              isAddingPage={isAddingPage}
              onPageSelect={(idx) => {
                setActivePageIdx(idx);
                setSelectedId(null);
              }}
              onAddPage={addPage}
              onLogicOpen={() => setIsLogicOpen(true)}
              onRenamePage={(idx, title) =>
                setSections((prev) =>
                  prev.map((s, i) => (i === idx ? { ...s, title } : s)),
                )
              }
              onDeletePage={(idx) => {
                setSections((prev) => prev.filter((_, i) => i !== idx));
                setActivePageIdx((p) => Math.max(0, p >= idx ? p - 1 : p));
                setSelectedId(null);
              }}
              onDuplicatePage={(idx) => {
                const src = sections[idx];
                if (!src) return;
                const dup = {
                  ...src,
                  id: crypto.randomUUID(),
                  fields: src.fields.map((f) => ({
                    ...f,
                    id: crypto.randomUUID(),
                  })),
                };
                setSections((prev) => [
                  ...prev.slice(0, idx + 1),
                  dup,
                  ...prev.slice(idx + 1),
                ]);
              }}
              onReorderPage={(from, to) =>
                setSections((prev) => arrayMove(prev, from, to))
              }
              onSetFirstPage={(idx) => {
                setSections((prev) => arrayMove(prev, idx, 0));
                setActivePageIdx(0);
              }}
            />
          </div>
          {/* end canvas+tabbar column */}

          {/* Right panel — controlled */}
          <FieldPropertiesPanel
            isOpen={isRightPanelOpen}
            field={selectedField?.field}
            sections={sections}
            onChange={(updates) => {
              if (selectedField)
                updateField(
                  selectedField.sectionId,
                  selectedField.field.id,
                  updates,
                );
            }}
            onClose={() => {
              setIsRightPanelOpen(false);
              setSelectedId(null);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ResponsesPanel
            responses={responses}
            allFields={sections.flatMap((s) => s.fields)}
            eventId={id ?? ""}
            spreadsheetUrl={existing?.spreadsheetUrl}
          />
        </div>
      )}

      {/* Logic modal */}
      <LogicModal
        isOpen={isLogicOpen}
        onClose={() => setIsLogicOpen(false)}
        pages={sections}
        id={id}
        onSave={handleSave}
        onNodeMove={handleNodeMove}
        onRenamePage={(pageId, title) =>
          setSections((prev) =>
            prev.map((s) => (s.id === pageId ? { ...s, title } : s)),
          )
        }
        onDeletePage={(pageId) => {
          const idx = sections.findIndex((s) => s.id === pageId);
          setSections((prev) => prev.filter((s) => s.id !== pageId));
          if (idx >= 0)
            setActivePageIdx((p) => Math.max(0, p >= idx ? p - 1 : p));
        }}
        onDuplicatePage={(pageId) => {
          const src = sections.find((s) => s.id === pageId);
          if (!src) return;
          const dup = {
            ...src,
            id: crypto.randomUUID(),
            fields: src.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
          };
          const idx = sections.findIndex((s) => s.id === pageId);
          setSections((prev) => [
            ...prev.slice(0, idx + 1),
            dup,
            ...prev.slice(idx + 1),
          ]);
        }}
        onSetFirstPage={(pageId) => {
          const idx = sections.findIndex((s) => s.id === pageId);
          if (idx > 0) {
            setSections((prev) => arrayMove(prev, idx, 0));
            setActivePageIdx(0);
          }
        }}
      />

      {/* Welcome flow modals */}
      <ThemePickerModal
        isOpen={welcomeThemePicker}
        required
        onClose={() => {}}
        onContinue={(theme) => {
          setPendingTheme(theme);
          setWelcomeThemePicker(false);
          setWelcomeRename(true);
        }}
      />
      <RenameFormModal
        isOpen={welcomeRename}
        required
        onClose={() => {}}
        isLoading={isUpdatingMeta}
        onCreate={async (name) => {
          if (!id) return;
          setIsUpdatingMeta(true);
          try {
            await updateEvent.mutateAsync({
              eventId: id,
              name,
              theme: pendingTheme,
            });
            setFormTitle(name);
            setActiveTheme(pendingTheme);
            setWelcomeRename(false);
          } finally {
            setIsUpdatingMeta(false);
          }
        }}
      />

      {/* Leave dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLeaveDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-sm shadow-2xl p-6 max-w-sm mx-4 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-gray-900">
                Unsaved Changes
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                You have unsaved changes that will be lost if you leave this
                page.
              </p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowLeaveDialog(false);
                    navigate("/");
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Leave
                </button>
                <button
                  onClick={() => setShowLeaveDialog(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareDialog && (
          <ShareDialog
            url={publicFormUrl}
            onClose={() => setShowShareDialog(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "publish") handlePublish();
          else if (confirmAction) handleStatusChange(confirmAction);
        }}
        variant="warning"
        title={
          confirmAction === "publish"
            ? eventStatus === "closed"
              ? "Reopen Form?"
              : "Publish Form?"
            : confirmAction === "unpublish"
              ? "Unpublish Form?"
              : "Close Form?"
        }
        description={
          confirmAction === "publish"
            ? eventStatus === "closed"
              ? "This will reopen your form and make it live again."
              : "This will make your form live. Anyone with the link can submit responses."
            : confirmAction === "unpublish"
              ? "This will take your form offline."
              : "This will permanently close your form."
        }
        confirmText={
          confirmAction === "publish"
            ? eventStatus === "closed"
              ? "Reopen"
              : "Publish"
            : confirmAction === "unpublish"
              ? "Unpublish"
              : "Close Form"
        }
      />

      <LoadingModal isOpen={isChangingStatus || isPublishing} />

      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type="success"
        title={
          statusResult === "unpublish" ? "Form Unpublished!" : "Form Closed!"
        }
        description={
          statusResult === "unpublish"
            ? "Your form has been unpublished."
            : "Your form has been closed and will no longer accept responses."
        }
        buttonText="Continue"
        onButtonClick={() => setStatusResult(null)}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
          >
            <FloppyDiskIcon
              size={12}
              weight="bold"
              className="text-emerald-400"
            />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

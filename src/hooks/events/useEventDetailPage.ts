import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ThemeKey } from "@/components/builder";
import { useCreateEvent, useGetEventDetail, useUpdateEvent } from "@/hooks/events";
import {
  useCreateSection,
  useDeleteSection,
  useUpdateSection,
} from "@/hooks/sections";
import { useGetResponses } from "@/hooks/responses";
import { useMutationUploadImage } from "@/api/upload";
import {
  OPEN_LOGIC_MODAL_EVENT,
  type LogicModalRequestedTab,
  type OpenLogicModalDetail,
} from "@/utils/form/logicModalEvents";
import {
  applyRuntimePageLogicToSections,
  buildRuntimePageLogicBranches,
  reorderSectionsByPageLogic,
  type RuntimePageLogicBranch,
} from "@/utils/form/pageLogic";
import {
  ensureNextButton,
  getVerticalInsertIndex,
  normalizeBuilderSections,
} from "@/utils/form/formBuilder";
import { resolveTheme, serializeCustomTheme } from "@/utils/form/themeConfig";
import {
  createDefaultField,
  createPageTypeDefaultFields,
} from "@/components/builder/section/fieldRegistry";
import type { FieldType, FormField, FormSection } from "@/types/form";

type Tab = "questions" | "share" | "responses";
type LeftPanelMode = "fields" | "theme";
type BuilderRouteState = {
  sections?: FormSection[];
  formTitle?: string;
  bannerColor?: string;
  bannerImage?: string | null;
  theme?: string;
  isNewDraft?: boolean;
};

function createDefaultBuilderSections() {
  const pageId = crypto.randomUUID();
  const defaultThankYou: FormField = {
    id: crypto.randomUUID(),
    type: "thank_you_block",
    label: "Thank You!",
    subtitle: "Thank you for your response!",
    required: false,
  };

  return ensureNextButton([
    {
      id: pageId,
      title: "Page 1",
      fields: createPageTypeDefaultFields("page", { sectionId: pageId }),
      pageType: "page",
    },
    {
      id: crypto.randomUUID(),
      title: "Ending",
      fields: [defaultThankYou],
      pageType: "ending",
    },
  ]);
}

export function useEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isLocalNewForm = id === "new";
  const persistedEventId = isLocalNewForm ? "" : (id ?? "");
  const routeState = useMemo(
    () => location.state as BuilderRouteState | null,
    [location.state],
  );
  const hasBuilderRouteState =
    !isLocalNewForm && Array.isArray(routeState?.sections);

  const { data: existing, isLoading } = useGetEventDetail(persistedEventId);
  const { data: responses = [] } = useGetResponses(persistedEventId);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const updateSection = useUpdateSection(persistedEventId);
  const createSection = useCreateSection(persistedEventId);
  const deleteSection = useDeleteSection(persistedEventId);
  const uploadImage = useMutationUploadImage();

  const deletedSectionIdsRef = useRef<string[]>([]);
  const questionsEndRef = useRef<HTMLDivElement>(null);
  const activeSectionIdRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const savedStateRef = useRef<string>("");
  const bgImgRef = useRef<HTMLInputElement>(null);
  const routeIdRef = useRef(id);

  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [bannerColor, setBannerColor] = useState("#0054a5");
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>("light");
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [leftPanelMode, setLeftPanelMode] =
    useState<LeftPanelMode>("fields");
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  const [logicInitialTab, setLogicInitialTab] =
    useState<LogicModalRequestedTab>("pageLogic");
  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [welcomeThemePicker, setWelcomeThemePicker] = useState(false);
  const [welcomeRename, setWelcomeRename] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<ThemeKey>("light");
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [history, setHistory] = useState<{
    stack: FormSection[][];
    index: number;
  }>({
    stack: [[{ id: crypto.randomUUID(), title: "", fields: [] }]],
    index: 0,
  });
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [eventStatus, setEventStatus] = useState<"draft" | "active" | "closed">(
    "draft",
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "unpublish" | "close" | "publish" | null
  >(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<
    "unpublish" | "close" | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [startButtonText, setStartButtonText] = useState("Start");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [coverHeroImage, setCoverHeroImage] = useState<string | null>(null);
  const [coverLayout, setCoverLayout] = useState(0);
  const [coverBgImage, setCoverBgImage] = useState<string | null>(null);
  const [showBgImageModal, setShowBgImageModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paletteDragType, setPaletteDragType] = useState<string | null>(null);
  const [paletteInsertIdx, setPaletteInsertIdx] = useState<number | null>(
    null,
  );
  const [dragInsertIdx, setDragInsertIdx] = useState<number | null>(null);
  const [confirmDeletePageIdx, setConfirmDeletePageIdx] = useState<
    number | null
  >(null);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success",
  );

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const sections = history.stack[history.index];

  const setSections = useCallback(
    (
      updater: FormSection[] | ((prev: FormSection[]) => FormSection[]),
    ) => {
      setHistory((prev) => {
        const current = prev.stack[prev.index];
        const next = typeof updater === "function" ? updater(current) : updater;
        const newStack = prev.stack.slice(0, prev.index + 1);
        newStack.push(next);
        return { stack: newStack, index: prev.index + 1 };
      });
    },
    [],
  );

  const syncCoverStateFromSections = useCallback(
    (sourceSections: FormSection[]) => {
      const coverSection = sourceSections.find(
        (section) => section.pageType === "cover",
      );

      setStartButtonText(
        typeof coverSection?.settings?.startButtonText === "string"
          ? (coverSection.settings.startButtonText as string)
          : "Start",
      );
      setCoverHeroImage(
        typeof coverSection?.settings?.coverHeroImage === "string"
          ? (coverSection.settings.coverHeroImage as string)
          : null,
      );
      setCoverLayout(
        typeof coverSection?.settings?.coverLayout === "number"
          ? (coverSection.settings.coverLayout as number)
          : 0,
      );
      setCoverBgImage(
        typeof coverSection?.settings?.coverBgImage === "string"
          ? (coverSection.settings.coverBgImage as string)
          : null,
      );
    },
    [],
  );

  const showToast = useCallback(
    (
      msg = "Saved successfully",
      type: "success" | "error" | "info" = "success",
      duration = 2500,
    ) => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      setToastType(type);
      setToast(msg);
      if (duration > 0) {
        toastTimeoutRef.current = window.setTimeout(() => {
          setToast(null);
          toastTimeoutRef.current = null;
        }, duration);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (routeIdRef.current === id) return;

    routeIdRef.current = id;
    setInitialized(false);
    if (id !== "new") {
      setWelcomeThemePicker(false);
      setWelcomeRename(false);
    }
  }, [id]);

  useEffect(() => {
    const handleOpenLogicModal = (event: Event) => {
      const customEvent = event as CustomEvent<OpenLogicModalDetail>;
      const nextTab =
        customEvent.detail?.tab === "calculations"
          ? "calculations"
          : "pageLogic";

      setLogicInitialTab(nextTab);
      setIsLogicOpen(true);
    };

    window.addEventListener(
      OPEN_LOGIC_MODAL_EVENT,
      handleOpenLogicModal as EventListener,
    );

    return () => {
      window.removeEventListener(
        OPEN_LOGIC_MODAL_EVENT,
        handleOpenLogicModal as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (initialized) return;

    const nav = routeState;

    if (isLocalNewForm) {
      const initialSections = createDefaultBuilderSections();
      const title = "Untitled Form";
      const color = "#0054a5";
      const theme = "light";

      setFormTitle(title);
      setBannerColor(color);
      setBannerImage(null);
      setActiveTheme(theme);
      setEventStatus("draft");
      setHistory({ stack: [initialSections], index: 0 });
      syncCoverStateFromSections(initialSections);
      savedStateRef.current = JSON.stringify({
        title,
        color,
        image: null,
        theme,
        sections: initialSections,
      });
      setInitialized(true);
      setWelcomeThemePicker(true);
      if (nav?.isNewDraft) {
        window.history.replaceState({}, "");
      }
      return;
    }

    if (nav?.sections) {
      const normalizedSections = ensureNextButton(
        normalizeBuilderSections(nav.sections),
      );

      setFormTitle(nav.formTitle ?? "Untitled Form");
      setBannerColor(nav.bannerColor ?? "#0054a5");
      setBannerImage(nav.bannerImage ?? null);
      syncCoverStateFromSections(normalizedSections);
      if (nav.theme) setActiveTheme(nav.theme);
      setHistory({ stack: [normalizedSections], index: 0 });
      if (existing) {
        setEventStatus(existing.status);
      }
      setWelcomeThemePicker(false);
      setWelcomeRename(false);
      savedStateRef.current = JSON.stringify({
        title: nav.formTitle ?? "Untitled Form",
        color: nav.bannerColor ?? "#0054a5",
        image: nav.bannerImage ?? null,
        theme: nav.theme ?? "light",
        sections: normalizedSections,
      });
      setInitialized(true);
      window.history.replaceState({}, "");
      return;
    }

    if (isLoading) return;

    if (existing) {
      const title = existing.name || "Untitled Form";
      const color = existing.color || "#0054a5";
      const rawSections: FormSection[] = existing.sections?.length
        ? normalizeBuilderSections(
            [...existing.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          )
        : createDefaultBuilderSections();
      const nextSections = ensureNextButton(rawSections);

      const image = existing.image ?? null;
      const theme = existing.theme || "light";
      setFormTitle(title);
      setBannerColor(color);
      setBannerImage(image);
      setActiveTheme(theme);
      setHistory({ stack: [nextSections], index: 0 });
      setEventStatus(existing.status);
      syncCoverStateFromSections(nextSections);
      setWelcomeThemePicker(false);
      setWelcomeRename(false);

      savedStateRef.current = JSON.stringify({
        title,
        color,
        image,
        theme,
        sections: nextSections,
      });
      setInitialized(true);
    } else {
      navigate("/", { replace: true });
    }
  }, [
    existing,
    initialized,
    isLocalNewForm,
    isLoading,
    navigate,
    routeState,
    syncCoverStateFromSections,
  ]);

  useEffect(() => {
    if (initialized && existing) {
      setEventStatus(existing.status);
    }
  }, [existing, initialized]);

  useEffect(() => {
    activeSectionIdRef.current =
      sections[activePageIdx]?.id ?? sections[0]?.id ?? null;
  }, [activePageIdx, sections]);

  const isDirty = useMemo(() => {
    if (!savedStateRef.current) return false;
    return (
      JSON.stringify({
        title: formTitle,
        color: bannerColor,
        image: bannerImage,
        theme: activeTheme,
        sections,
      }) !== savedStateRef.current
    );
  }, [activeTheme, bannerColor, bannerImage, formTitle, sections]);

  const uploadImageWithToast = useCallback(
    async (
      file: File,
      options?: {
        showFeedback?: boolean;
        successMessage?: string;
        errorMessage?: string;
      },
    ) => {
      const {
        showFeedback = true,
        successMessage = "Image uploaded",
        errorMessage = "Failed to upload image",
      } = options ?? {};

      if (showFeedback) {
        showToast("Uploading image...", "info", 0);
      }

      try {
        const result = await uploadImage.mutateAsync(file);
        if (showFeedback) {
          showToast(successMessage);
        }
        return result;
      } catch (error) {
        if (showFeedback) {
          showToast(errorMessage, "error");
        }
        throw error;
      }
    },
    [showToast, uploadImage],
  );

  const uploadBlobUrl = useCallback(
    async (blobUrl: string) => {
      try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const file = new File(
          [blob],
          `image-${Date.now()}.${blob.type.split("/")[1] || "png"}`,
          { type: blob.type },
        );
        const { url } = await uploadImageWithToast(file, {
          showFeedback: false,
        });
        URL.revokeObjectURL(blobUrl);
        return url;
      } catch (error) {
        console.error("[uploadBlobUrl]:", error);
        return blobUrl;
      }
    },
    [uploadImageWithToast],
  );

  const resolveThemeValueForSave = useCallback(
    async (themeValue: string) => {
      const resolvedTheme = resolveTheme(themeValue);
      if (!resolvedTheme.isCustom) {
        return themeValue;
      }

      const resolvedLogoUrl = resolvedTheme.config.logoUrl?.startsWith("blob:")
        ? await uploadBlobUrl(resolvedTheme.config.logoUrl)
        : resolvedTheme.config.logoUrl;
      const resolvedFormImageUrl = resolvedTheme.config.formImageUrl?.startsWith("blob:")
        ? await uploadBlobUrl(resolvedTheme.config.formImageUrl)
        : resolvedTheme.config.formImageUrl;

      return serializeCustomTheme(resolvedTheme.sourceKey, {
        backButtonPosition: resolvedTheme.config.backButtonPosition,
        bg: resolvedTheme.config.bg,
        boldLabels: resolvedTheme.config.boldLabels,
        buttonAnimation: resolvedTheme.config.buttonAnimation,
        buttonRounding: resolvedTheme.config.buttonRounding,
        btnBg: resolvedTheme.config.btnBg,
        canvasBg: resolvedTheme.config.canvasBg,
        fieldSpacing: resolvedTheme.config.fieldSpacing,
        formAlignment: resolvedTheme.config.formAlignment,
        formImagePositionX: resolvedTheme.config.formImagePositionX,
        formImagePositionY: resolvedTheme.config.formImagePositionY,
        formImageUrl: resolvedFormImageUrl,
        formPosition: resolvedTheme.config.formPosition,
        formWidth: resolvedTheme.config.formWidth,
        fontCategory: resolvedTheme.config.fontCategory,
        fontKey: resolvedTheme.config.fontKey,
        inputBg: resolvedTheme.config.inputBg,
        inputBorder: resolvedTheme.config.inputBorder,
        inputStyle: resolvedTheme.config.inputStyle,
        inputText: resolvedTheme.config.inputText,
        logoEnabled: resolvedTheme.config.logoEnabled,
        logoUrl: resolvedLogoUrl,
        questionSize: resolvedTheme.config.questionSize,
        textColor: resolvedTheme.config.textColor,
      });
    },
    [uploadBlobUrl],
  );

  const buildSectionsForPageLogic = useCallback(
    (
      sourceSections: FormSection[] = sections,
      branches: RuntimePageLogicBranch[] = buildRuntimePageLogicBranches(
        sourceSections,
      ),
    ) =>
      reorderSectionsByPageLogic(
        applyRuntimePageLogicToSections(sourceSections, branches),
        branches,
      ),
    [sections],
  );

  const handleSave = useCallback(
    async (options?: { showFeedback?: boolean; sectionsOverride?: FormSection[] }) => {
      const showFeedback = options?.showFeedback ?? true;
      if (!persistedEventId || isSaving) return false;

      setIsSaving(true);
      if (showFeedback) {
        showToast("Saving...", "info", 0);
      }

      try {
        if (deletedSectionIdsRef.current.length > 0) {
          await Promise.all(
            deletedSectionIdsRef.current.map((sectionId) =>
              deleteSection.mutateAsync(sectionId).catch(console.error),
            ),
          );
          deletedSectionIdsRef.current = [];
        }

        const resolvedBannerImage = bannerImage?.startsWith("blob:")
          ? await uploadBlobUrl(bannerImage)
          : bannerImage;

        if (resolvedBannerImage !== bannerImage) {
          setBannerImage(resolvedBannerImage);
        }

        const resolvedThemeValue = await resolveThemeValueForSave(activeTheme);

        if (resolvedThemeValue !== activeTheme) {
          setActiveTheme(resolvedThemeValue);
        }

        await updateEvent.mutateAsync({
          eventId: persistedEventId,
          name: formTitle,
          color: bannerColor,
          image: resolvedBannerImage,
          theme: resolvedThemeValue,
        });

        const sectionsToPersist =
          options?.sectionsOverride ?? buildSectionsForPageLogic();

        const resolvedSections = await Promise.all(
          sectionsToPersist.map(async (section) => {
            const settings = { ...(section.settings ?? {}) };

            if (
              typeof settings.coverHeroImage === "string" &&
              settings.coverHeroImage.startsWith("blob:")
            ) {
              settings.coverHeroImage = await uploadBlobUrl(
                settings.coverHeroImage as string,
              );
              if (section.pageType === "cover") {
                setCoverHeroImage(settings.coverHeroImage as string);
              }
            }

            if (
              typeof settings.coverBgImage === "string" &&
              settings.coverBgImage.startsWith("blob:")
            ) {
              settings.coverBgImage = await uploadBlobUrl(
                settings.coverBgImage as string,
              );
              if (section.pageType === "cover") {
                setCoverBgImage(settings.coverBgImage as string);
              }
            }

            const fields = await Promise.all(
              section.fields.map(async (field) => {
                const updates: Partial<FormField> = {};

                if (field.headerImage?.startsWith("blob:")) {
                  updates.headerImage = await uploadBlobUrl(field.headerImage);
                }

                if (field.optionImages) {
                  const images = { ...field.optionImages };
                  let changed = false;

                  for (const [key, url] of Object.entries(images)) {
                    if (url.startsWith("blob:")) {
                      images[key] = await uploadBlobUrl(url);
                      changed = true;
                    }
                  }

                  if (changed) {
                    updates.optionImages = images;
                  }
                }

                return Object.keys(updates).length ? { ...field, ...updates } : field;
              }),
            );

            return { ...section, settings, fields };
          }),
        );

        await Promise.all(
          resolvedSections.map((section, index) =>
            updateSection.mutateAsync({
              sectionId: section.id,
              title: section.title,
              description: section.description,
              fields: section.fields,
              pageType: section.pageType,
              settings: section.settings,
              logicX: section.logicX,
              logicY: section.logicY,
              order: index,
            }),
          ),
        );

        setSections(resolvedSections);
        savedStateRef.current = JSON.stringify({
          title: formTitle,
          color: bannerColor,
          image: resolvedBannerImage,
          theme: resolvedThemeValue,
          sections: resolvedSections,
        });

        if (showFeedback) {
          showToast("Saved successfully");
        }

        return true;
      } catch (error) {
        console.error("[handleSave]:", error);
        if (showFeedback) {
          showToast("Save failed", "error");
        }
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      activeTheme,
      bannerColor,
      bannerImage,
      buildSectionsForPageLogic,
      deleteSection,
      formTitle,
      isSaving,
      persistedEventId,
      setSections,
      showToast,
      updateEvent,
      updateSection,
      resolveThemeValueForSave,
      uploadBlobUrl,
    ],
  );

  const handlePublish = useCallback(async () => {
    if (!persistedEventId || isPublishing) return;
    setConfirmAction(null);
    if (isDirty) await handleSave({ showFeedback: false });
    setIsPublishing(true);
    try {
      await updateEvent.mutateAsync({ eventId: persistedEventId, status: "active" });
      setEventStatus("active");
      setActiveTab("share");
      setShowShareToast(false);
    } catch (error) {
      console.error("[handlePublish]", error);
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, isDirty, isPublishing, persistedEventId, updateEvent]);

  const handleStatusChange = useCallback(
    async (action: "unpublish" | "close") => {
      if (!persistedEventId || isChangingStatus) return;
      setConfirmAction(null);
      setIsChangingStatus(true);
      try {
        const status = action === "unpublish" ? "draft" : "closed";
        await updateEvent.mutateAsync({ eventId: persistedEventId, status });
        setEventStatus(status);
        setStatusResult(action);
      } catch (error) {
        console.error("[handleStatusChange]", error);
      } finally {
        setIsChangingStatus(false);
      }
    },
    [isChangingStatus, persistedEventId, updateEvent],
  );

  const handleNodeMove = useCallback(
    (nodeId: string, x: number, y: number) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === nodeId ? { ...section, logicX: x, logicY: y } : section,
        ),
      );
    },
    [setSections],
  );

  const handleThemeChange = useCallback((theme: string) => {
    setActiveTheme(theme);
  }, []);

  const getPageToastLabel = useCallback((type: "page" | "cover" | "ending") => {
    if (type === "cover") return "cover page";
    if (type === "ending") return "ending page";
    return "page";
  }, []);

  const addPage = useCallback(
    async (type: "page" | "cover" | "ending") => {
      if (!persistedEventId) return;

      const pageLabel = getPageToastLabel(type);
      setIsAddingPage(true);
      showToast(`Adding ${pageLabel}...`, "info", 0);

      try {
        const label =
          type === "cover" ? "Cover" : type === "ending" ? "Ending" : "Page";
        const order = sections.length;
        const result = await createSection.mutateAsync({
          title: label,
          pageType: type,
          order,
        });
        const defaultFields: FormField[] = createPageTypeDefaultFields(type, {
          sectionId: result.id,
        });
        const newSection: FormSection = {
          id: result.id,
          title: label,
          description: "",
          fields: defaultFields,
          pageType: type,
        };
        setSections((prev) => [...prev, newSection]);
        setActivePageIdx(sections.length);
        showToast(
          `${pageLabel.charAt(0).toUpperCase()}${pageLabel.slice(1)} added`,
        );
        return result.id;
      } catch (error) {
        console.error("[addPage]", error);
        showToast(`Failed to add ${pageLabel}`, "error");
        return undefined;
      } finally {
        setIsAddingPage(false);
      }
    },
    [createSection, getPageToastLabel, persistedEventId, sections.length, setSections, showToast],
  );

  const handleLogicFlowChange = useCallback(
    (branches: RuntimePageLogicBranch[]) => {
      const activeSectionId = activeSectionIdRef.current;
      let nextActiveIdx = 0;

      setSections((prev) => {
        const nextSections = buildSectionsForPageLogic(prev, branches);

        if (activeSectionId) {
          const resolvedIdx = nextSections.findIndex(
            (section) => section.id === activeSectionId,
          );
          nextActiveIdx = resolvedIdx >= 0 ? resolvedIdx : 0;
        }

        return nextSections;
      });

      setActivePageIdx(nextActiveIdx);
    },
    [buildSectionsForPageLogic, setSections],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setHistory((prev) =>
          prev.index <= 0 ? prev : { ...prev, index: prev.index - 1 },
        );
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
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

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const activePage = sections[activePageIdx] ?? sections[0];
  const activePageType = activePage?.pageType ?? "page";
  const themeConfig = resolveTheme(activeTheme).config;

  const addField = useCallback(
    (
      type: FieldType,
      sectionId: string,
      initialImageUrl?: string,
      insertAtIdx?: number,
    ) => {
      const shouldScrollToEnd = insertAtIdx === undefined;
      const newField = createDefaultField(type, { initialImageUrl });

      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;
          const fields = [...section.fields];
          if (insertAtIdx !== undefined) {
            fields.splice(insertAtIdx, 0, newField);
          } else {
            const nextButtonIdx = fields.findIndex(
              (field) => field.type === "next_button",
            );
            if (nextButtonIdx >= 0) {
              fields.splice(nextButtonIdx, 0, newField);
            } else {
              fields.push(newField);
            }
          }
          return { ...section, fields };
        }),
      );

      setSelectedId(newField.id);
      setIsRightPanelOpen(true);

      if (shouldScrollToEnd) {
        setTimeout(() => {
          questionsEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 80);
      }
    },
    [setSections],
  );

  const updateField = useCallback(
    (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;

          const fields = section.fields.map((field) => {
            if (field.id !== fieldId) {
              if (
                "fieldWidth" in updates &&
                updates.fieldWidth !== "half" &&
                field.rowId &&
                field.rowId === section.fields.find((item) => item.id === fieldId)?.rowId
              ) {
                return { ...field, rowId: undefined };
              }
              return field;
            }

            const updatedField = { ...field, ...updates };
            if ("fieldWidth" in updates && updates.fieldWidth !== "half") {
              updatedField.rowId = undefined;
            }
            return updatedField;
          });

          return { ...section, fields };
        }),
      );
    },
    [setSections],
  );

  const deleteField = useCallback(
    (sectionId: string, fieldId: string) => {
      const section = sections.find((item) => item.id === sectionId);
      if (section?.fields.find((field) => field.id === fieldId)?.type === "next_button") {
        return;
      }

      setSections((prev) =>
        prev.map((item) =>
          item.id !== sectionId
            ? item
            : { ...item, fields: item.fields.filter((field) => field.id !== fieldId) },
        ),
      );

      if (selectedId === fieldId) {
        setSelectedId(null);
        setIsRightPanelOpen(false);
      }
    },
    [sections, selectedId, setSections],
  );

  const duplicateField = useCallback(
    (sectionId: string, fieldId: string) => {
      const duplicatedId = crypto.randomUUID();

      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;
          const field = section.fields.find((item) => item.id === fieldId);
          if (!field) return section;
          const newField: FormField = { ...field, id: duplicatedId };
          const index = section.fields.findIndex((item) => item.id === fieldId);
          const updatedFields = [...section.fields];
          updatedFields.splice(index + 1, 0, newField);
          return { ...section, fields: updatedFields };
        }),
      );

      setSelectedId(duplicatedId);
      setIsRightPanelOpen(true);
    },
    [setSections],
  );

  const findFieldInfo = useCallback(
    (fieldId: string) => {
      for (const section of sections) {
        const fieldIdx = section.fields.findIndex((field) => field.id === fieldId);
        if (fieldIdx !== -1) {
          return { sectionId: section.id, fieldIdx };
        }
      }
      return null;
    },
    [sections],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragId = event.active.id as string;
    setDragInsertIdx(null);
    if (dragId.startsWith("palette:")) {
      setPaletteDragType(
        (event.active.data.current?.fieldType as string | undefined) ?? null,
      );
    } else {
      setActiveId(dragId);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if ((active.id as string).startsWith("palette:")) {
        setDragInsertIdx(null);

        if (
          over &&
          activePage &&
          !String(over.id).startsWith("palette:") &&
          !String(over.id).startsWith("side-")
        ) {
          const overInfo = findFieldInfo(over.id as string);

          if (overInfo && overInfo.sectionId === activePage.id) {
            let nextIndex = getVerticalInsertIndex(
              overInfo.fieldIdx,
              over.rect,
              active.rect.current?.translated,
            );
            const nextButtonIdx = activePage.fields.findIndex(
              (field) => field.type === "next_button",
            );
            if (nextButtonIdx >= 0 && nextIndex > nextButtonIdx) {
              nextIndex = nextButtonIdx;
            }
            setPaletteInsertIdx(nextIndex);
          } else {
            setPaletteInsertIdx(null);
          }
        } else {
          setPaletteInsertIdx(null);
        }

        return;
      }

      setPaletteInsertIdx(null);

      if (!over || active.id === over.id || String(over.id).startsWith("side-")) {
        setDragInsertIdx(null);
        return;
      }

      const activeInfo = findFieldInfo(active.id as string);
      const overInfo = findFieldInfo(over.id as string);

      if (!activeInfo || !overInfo) {
        setDragInsertIdx(null);
        return;
      }

      if (activeInfo.sectionId === overInfo.sectionId) {
        setDragInsertIdx(
          getVerticalInsertIndex(
            overInfo.fieldIdx,
            over.rect,
            active.rect.current?.translated,
          ),
        );
        return;
      }

      setDragInsertIdx(null);
      setSections((prev) => {
        const next = prev.map((section) => ({
          ...section,
          fields: [...section.fields],
        }));
        const source = next.find((section) => section.id === activeInfo.sectionId)!;
        const destination = next.find((section) => section.id === overInfo.sectionId)!;
        const [moved] = source.fields.splice(activeInfo.fieldIdx, 1);
        const destinationIdx = destination.fields.findIndex(
          (field) => field.id === over.id,
        );
        destination.fields.splice(
          destinationIdx >= 0 ? destinationIdx : destination.fields.length,
          0,
          moved,
        );
        return next;
      });
    },
    [activePage, findFieldInfo, setSections],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if ((active.id as string).startsWith("palette:")) {
        setPaletteDragType(null);
        setPaletteInsertIdx(null);
        setDragInsertIdx(null);

        const fieldType = active.data.current?.fieldType as FieldType | undefined;
        if (!fieldType || !activePage) return;

        let insertAtIdx: number | undefined;
        if (
          over &&
          !String(over.id).startsWith("palette:") &&
          !String(over.id).startsWith("side-")
        ) {
          const overInfo = findFieldInfo(over.id as string);
          if (overInfo && overInfo.sectionId === activePage.id) {
            insertAtIdx = getVerticalInsertIndex(
              overInfo.fieldIdx,
              over.rect,
              active.rect.current?.translated,
            );
          }
        }

        const nextButtonIdx = activePage.fields.findIndex(
          (field) => field.type === "next_button",
        );
        if (
          nextButtonIdx >= 0 &&
          insertAtIdx !== undefined &&
          insertAtIdx > nextButtonIdx
        ) {
          insertAtIdx = nextButtonIdx;
        }

        addField(fieldType, activePage.id, undefined, insertAtIdx);
        return;
      }

      setActiveId(null);
      const reorderTargetIdx = dragInsertIdx;
      setDragInsertIdx(null);

      if (!over || active.id === over.id) return;

      if ((over.id as string).startsWith("side-")) {
        const targetFieldId = (over.id as string).slice(5);
        const activeInfo = findFieldInfo(active.id as string);
        const targetInfo = findFieldInfo(targetFieldId);

        if (
          !activeInfo ||
          !targetInfo ||
          activeInfo.sectionId !== targetInfo.sectionId
        ) {
          return;
        }

        if (active.id === targetFieldId) return;

        const newRowId = crypto.randomUUID();
        setSections((prev) =>
          prev.map((section) => {
            if (section.id !== activeInfo.sectionId) return section;
            const fields = section.fields.map((field) => ({ ...field }));
            const activeIdx = fields.findIndex((field) => field.id === active.id);
            const [moved] = fields.splice(activeIdx, 1);
            moved.fieldWidth = "half";
            moved.rowId = newRowId;
            const newTargetIdx = fields.findIndex(
              (field) => field.id === targetFieldId,
            );
            fields[newTargetIdx] = {
              ...fields[newTargetIdx],
              fieldWidth: "half",
              rowId: newRowId,
            };
            fields.splice(newTargetIdx + 1, 0, moved);
            return { ...section, fields };
          }),
        );
        return;
      }

      const activeInfo = findFieldInfo(active.id as string);
      const overInfo = findFieldInfo(over.id as string);

      if (!activeInfo || !overInfo || activeInfo.sectionId !== overInfo.sectionId) {
        return;
      }

      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== activeInfo.sectionId) return section;
          const fields = [...section.fields];
          const [moved] = fields.splice(activeInfo.fieldIdx, 1);
          let insertIdx = reorderTargetIdx ?? overInfo.fieldIdx;
          if (activeInfo.fieldIdx < insertIdx) {
            insertIdx -= 1;
          }
          insertIdx = Math.max(0, Math.min(insertIdx, fields.length));
          fields.splice(insertIdx, 0, moved);
          return { ...section, fields };
        }),
      );
    },
    [activePage, addField, dragInsertIdx, findFieldInfo, setSections],
  );

  const handleDragCancel = useCallback(() => {
    setPaletteDragType(null);
    setPaletteInsertIdx(null);
    setDragInsertIdx(null);
    setActiveId(null);
  }, []);

  const selectedField = useMemo(() => {
    for (const section of sections) {
      const field = section.fields.find((item) => item.id === selectedId);
      if (field) return { field, sectionId: section.id };
    }
    return null;
  }, [sections, selectedId]);

  const publicFormUrl = `${window.location.origin}/forms/${id}`;
  const isCoverPage = activePageType === "cover";

  return {
    activeId,
    activePage,
    activePageIdx,
    activePageType,
    activeTab,
    activeTheme,
    addField,
    addPage,
    bannerColor,
    bannerImage,
    bgImgRef,
    buildSectionsForPageLogic,
    confirmAction,
    confirmDeletePageIdx,
    coverBgImage,
    coverHeroImage,
    coverLayout,
    createEvent,
    createSection,
    deleteErrorOpen,
    deleteField,
    deleteSection,
    deletedSectionIdsRef,
    dndSensors,
    dragInsertIdx,
    duplicateField,
    eventStatus,
    existing,
    formTitle,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleLogicFlowChange,
    handleNodeMove,
    handlePublish,
    handleSave,
    handleStatusChange,
    handleThemeChange,
    history,
    id,
    initialized,
    isAddingPage,
    isChangingStatus,
    isCoverPage,
    isDirty,
    isLoading: isLoading && !hasBuilderRouteState,
    isLogicOpen,
    isPublishing,
    isRightPanelOpen,
    isSaving,
    isUpdatingMeta,
    leftPanelMode,
    location,
    logicInitialTab,
    navigate,
    paletteDragType,
    paletteInsertIdx,
    pendingTheme,
    publicFormUrl,
    questionsEndRef,
    responses,
    sections,
    selectedField,
    selectedId,
    setActivePageIdx,
    setActiveTheme,
    setActiveTab,
    setBannerColor,
    setBannerImage,
    setConfirmAction,
    setConfirmDeletePageIdx,
    setCoverBgImage,
    setCoverHeroImage,
    setCoverLayout,
    setDeleteErrorOpen,
    setFormTitle,
    setHistory,
    setInitialized,
    setIsLogicOpen,
    setIsRightPanelOpen,
    setIsUpdatingMeta,
    setLeftPanelMode,
    setLogicInitialTab,
    setPendingTheme,
    setSections,
    setSelectedId,
    setShowBgImageModal,
    setShowLeaveDialog,
    setShowShareToast,
    setStartButtonText,
    setStatusResult,
    setToast,
    setToastType,
    setWelcomeRename,
    setWelcomeThemePicker,
    showBgImageModal,
    showLeaveDialog,
    showShareToast,
    showToast,
    startButtonText,
    statusResult,
    themeConfig,
    toast,
    toastType,
    updateEvent,
    updateField,
    updateSection,
    uploadImageWithToast,
    welcomeRename,
    welcomeThemePicker,
  };
}

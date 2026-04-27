import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  CheckIcon,
  EnvelopeSimpleIcon,
  HashIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { useMutationSaveSubmitFormSettings, useQuerySubmitFormSettings } from "@/api/email-blasts";
import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import { ImagePickerModal } from "@/components/modal";
import { Toggle } from "@/components/ui";
import {
  AddBlockDropdown,
  BlockInsertControl,
  ImageSettingsPanel,
  SortableBlock,
  SpacerSettingsPanel,
  TextSettingsPanel,
} from "../email-composer/components";
import {
  DEFAULT_EMAIL_IMAGE_URL,
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
} from "../email-composer/constants";
import { generateHtml, uid } from "../email-composer/utils";
import {
  THEMES,
  resolveTheme,
  type ResolvedTheme,
  type ThemeConfig,
} from "@/utils/form/themeConfig";
import type { FormField, FormSection } from "@/types/form";
import type {
  EmailBlock,
  EmailBlockPatch,
  ShareToast,
  SubmitSettingsEditorState,
} from "@/types/builderShare";
import type { SubmitFormSettings as ApiSubmitFormSettings } from "@/types/api";
import { stripHtmlToText } from "@/utils/form/referenceTokens";

type SubmitEmailField = {
  id: string;
  label: string;
  pageTitle: string;
  type: FormField["type"];
};

type SubmitFormSettings = {
  blocks: EmailBlock[];
  body: string;
  enabled: boolean;
  emailThemeValue: string | null;
  raffleEnabled: boolean;
  rafflePadding: number;
  rafflePrefix: string;
  raffleStart: number;
  raffleSuffix: string;
  recipientFieldId: string;
  subject: string;
};

type SubmitFormPanelProps = {
  activeTheme?: string;
  eventId: string;
  formTitle: string;
  isActive: boolean;
  onStateChange?: (state: SubmitSettingsEditorState) => void;
  sections: FormSection[];
  showToast?: ShareToast;
};

const DEFAULT_BODY =
  "Hi there,<br /><br />Thank you for submitting {{form_title}}.<br /><br />Your lottery number is {{raffle_number}}.";

function ThemeSelectIcon({ theme }: { theme: ThemeConfig }) {
  return (
    <span
      className="flex h-7 w-11 items-center justify-center rounded border text-xs font-semibold shadow-sm"
      style={{
        background: theme.inputBg,
        borderColor: theme.inputBorder,
        color: theme.textColor,
      }}
    >
      <span
        className="mr-1 h-1.5 w-1.5 rounded-full"
        style={{ background: theme.btnBg }}
      />
      Aa
    </span>
  );
}

function getThemeSelectValue(theme: ResolvedTheme) {
  return theme.isCustom ? theme.value : theme.sourceKey;
}

function createDefaultMessageBlocks(): EmailBlock[] {
  return [{ id: uid(), type: "text", content: DEFAULT_BODY }];
}

function getDefaultSettings(formTitle: string): SubmitFormSettings {
  return {
    blocks: createDefaultMessageBlocks(),
    body: DEFAULT_BODY,
    emailThemeValue: null,
    enabled: false,
    raffleEnabled: true,
    rafflePadding: 4,
    rafflePrefix: "UF-",
    raffleStart: 1,
    raffleSuffix: "",
    recipientFieldId: "",
    subject: `Submission received: ${formTitle || "Form"}`,
  };
}

function buildSubmitEmailFields(sections: FormSection[]): SubmitEmailField[] {
  return sections.flatMap((section) =>
    section.fields
      .filter(
        (field) =>
          field.type === "email" || field.validationPattern === "email",
      )
      .map((field) => ({
        id: field.id,
        label: stripHtmlToText(field.label) || "Untitled email field",
        pageTitle: section.title?.trim() || "Untitled page",
        type: field.type,
      })),
  );
}

function normalizePadding(value: number) {
  return Math.max(1, Math.min(10, Math.round(value) || 1));
}

function getRafflePreview(settings: SubmitFormSettings) {
  const start = Math.max(0, Math.round(settings.raffleStart) || 0);
  const number = String(start).padStart(normalizePadding(settings.rafflePadding), "0");
  return `${settings.rafflePrefix}${number}${settings.raffleSuffix}`;
}

function normalizeMessageBody(value: string) {
  return value.includes("\n") ? value.replace(/\r?\n/g, "<br />") : value;
}

function isEmailBlock(value: unknown): value is EmailBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<EmailBlock>;
  if (typeof block.id !== "string") return false;
  if (block.type === "text") return typeof block.content === "string";
  if (block.type === "image") return typeof block.url === "string";
  if (block.type === "spacer") return typeof block.height === "number";
  return false;
}

function normalizeMessageBlocks(value: unknown, fallbackBody: string): EmailBlock[] {
  const blocks = Array.isArray(value) ? value.filter(isEmailBlock) : [];
  if (blocks.length > 0) return blocks;
  return [{ id: uid(), type: "text", content: normalizeMessageBody(fallbackBody) }];
}

function normalizeSettings(settings: SubmitFormSettings): SubmitFormSettings {
  return {
    ...settings,
    blocks: normalizeMessageBlocks(settings.blocks, settings.body),
    body: normalizeMessageBody(settings.body),
    rafflePadding: normalizePadding(settings.rafflePadding),
    raffleStart: Math.max(0, Math.round(settings.raffleStart) || 0),
  };
}

function getSettingsFromApi(
  settings: ApiSubmitFormSettings | null | undefined,
  formTitle: string,
): SubmitFormSettings {
  const defaults = getDefaultSettings(formTitle);
  if (!settings) return defaults;

  return normalizeSettings({
    blocks: normalizeMessageBlocks(settings.blocks, settings.body || defaults.body),
    body: settings.body || defaults.body,
    emailThemeValue: settings.emailThemeValue ?? defaults.emailThemeValue,
    enabled: settings.enabled,
    raffleEnabled: settings.raffleEnabled,
    rafflePadding: settings.rafflePadding,
    rafflePrefix: settings.rafflePrefix,
    raffleStart: settings.raffleStart,
    raffleSuffix: settings.raffleSuffix,
    recipientFieldId: settings.recipientFieldId,
    subject: settings.subject || defaults.subject,
  });
}

function serializeSettings(settings: SubmitFormSettings) {
  const normalized = normalizeSettings(settings);
  return JSON.stringify({
    ...normalized,
    blocks: normalized.blocks.map((block) => {
      if (block.type === "text") {
        return { content: block.content, type: block.type };
      }
      if (block.type === "image") {
        return {
          align: block.align,
          linkUrl: block.linkUrl,
          maxHeight: block.maxHeight,
          openLink: block.openLink,
          type: block.type,
          url: block.url,
          width: block.width,
        };
      }
      return { height: block.height, type: block.type };
    }),
  });
}

export default function SubmitFormPanel({
  activeTheme,
  eventId,
  formTitle,
  isActive,
  onStateChange,
  sections,
  showToast,
}: SubmitFormPanelProps) {
  const emailFields = useMemo(() => buildSubmitEmailFields(sections), [sections]);
  const settingsQuery = useQuerySubmitFormSettings(eventId, !!eventId);
  const saveSubmitSettings = useMutationSaveSubmitFormSettings();
  const currentFormTheme = useMemo(
    () => resolveTheme(activeTheme ?? "light"),
    [activeTheme],
  );
  const [settings, setSettings] = useState<SubmitFormSettings>(() =>
    getDefaultSettings(formTitle),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeSettings(getDefaultSettings(formTitle)),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null);
  const emailTheme = useMemo(
    () => resolveTheme(settings.emailThemeValue ?? activeTheme ?? "light"),
    [activeTheme, settings.emailThemeValue],
  );
  const themeOptions = useMemo<ConditionSelectOption[]>(
    () => [
      ...(currentFormTheme.isCustom
        ? [
            {
              icon: <ThemeSelectIcon theme={currentFormTheme.config} />,
              label: "Current form theme",
              subtitle: `${currentFormTheme.config.label} custom settings`,
              value: currentFormTheme.value,
            },
          ]
        : []),
      ...THEMES.map((theme) => ({
        icon: <ThemeSelectIcon theme={theme} />,
        label: theme.label,
        value: theme.key,
      })),
    ],
    [currentFormTheme],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (settingsQuery.isLoading) return;

    const nextSettings = getSettingsFromApi(settingsQuery.data, formTitle);
    setSettings(nextSettings);
    setSavedSnapshot(serializeSettings(nextSettings));
  }, [formTitle, settingsQuery.data, settingsQuery.isLoading]);

  useEffect(() => {
    setSettings((current) => {
      const next =
        current.recipientFieldId || emailFields.length === 0
          ? current
          : { ...current, recipientFieldId: emailFields[0].id };
      return next;
    });
  }, [emailFields]);

  const updateSettings = (patch: Partial<SubmitFormSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  };

  const isSettingsDirty = useMemo(
    () => serializeSettings(settings) !== savedSnapshot,
    [savedSnapshot, settings],
  );

  const saveSettings = useCallback(async () => {
    if (!eventId) {
      showToast?.("Form belum tersimpan. Save form dulu ya.", "error");
      return false;
    }

    if (settings.enabled && !settings.recipientFieldId) {
      showToast?.("Choose an email field first", "error");
      return false;
    }

    const blocksToSave =
      settings.blocks.length > 0 ? settings.blocks : createDefaultMessageBlocks();
    const normalizedSettings = normalizeSettings({
      ...settings,
      blocks: blocksToSave,
      body: generateHtml(blocksToSave, "basic", emailTheme.config),
    });

    try {
      const saved = await saveSubmitSettings.mutateAsync({
        eventId,
        ...normalizedSettings,
      });
      const nextSettings = getSettingsFromApi(saved, formTitle);
      setSettings(nextSettings);
      setSavedSnapshot(serializeSettings(nextSettings));
      showToast?.("Submit form settings saved");
      return true;
    } catch (error) {
      console.error("[SubmitFormPanel] save settings failed:", error);
      showToast?.("Failed to save submit form settings", "error");
      return false;
    }
  }, [emailTheme.config, eventId, formTitle, saveSubmitSettings, settings, showToast]);

  useEffect(() => {
    onStateChange?.({
      dirty: isSettingsDirty,
      saving: saveSubmitSettings.isPending,
    });
  }, [isSettingsDirty, onStateChange, saveSubmitSettings.isPending]);

  useEffect(() => {
    return () => {
      onStateChange?.({ dirty: false, saving: false });
    };
  }, [onStateChange]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void saveSettings();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isActive, saveSettings]);

  useEffect(() => {
    if (!isSettingsDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSettingsDirty]);

  const rafflePreview = getRafflePreview(settings);
  const selectedBlock =
    settings.blocks.find((block) => block.id === selectedBlockId) ?? null;

  const updateBlocks = useCallback(
    (updater: EmailBlock[] | ((blocks: EmailBlock[]) => EmailBlock[])) => {
      setSettings((current) => ({
        ...current,
        blocks:
          typeof updater === "function"
            ? updater(current.blocks)
            : updater,
      }));
    },
    [],
  );

  const addBlock = useCallback(
    (type: EmailBlock["type"], afterId?: string | null) => {
      const newBlock: EmailBlock =
        type === "text"
          ? { id: uid(), type: "text", content: "" }
          : type === "image"
            ? {
                align: "center",
                id: uid(),
                maxHeight: DEFAULT_IMAGE_MAX_HEIGHT,
                type: "image",
                url: DEFAULT_EMAIL_IMAGE_URL,
                width: DEFAULT_IMAGE_WIDTH,
              }
            : { id: uid(), type: "spacer", height: 16 };

      updateBlocks((previous) => {
        if (afterId === null) return [newBlock, ...previous];
        if (!afterId) return [...previous, newBlock];
        const index = previous.findIndex((block) => block.id === afterId);
        if (index < 0) return [...previous, newBlock];
        const next = [...previous];
        next.splice(index + 1, 0, newBlock);
        return next;
      });
      setSelectedBlockId(newBlock.id);
    },
    [updateBlocks],
  );

  const updateBlock = useCallback(
    (id: string, patch: EmailBlockPatch) => {
      updateBlocks((previous) =>
        previous.map((block) =>
          block.id === id ? ({ ...block, ...patch } as EmailBlock) : block,
        ),
      );
    },
    [updateBlocks],
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const source = settings.blocks.find((block) => block.id === id);
      if (!source) return;
      const copy = { ...source, id: uid() } as EmailBlock;
      updateBlocks((previous) => {
        const index = previous.findIndex((block) => block.id === id);
        const next = [...previous];
        next.splice(index + 1, 0, copy);
        return next;
      });
      setSelectedBlockId(copy.id);
    },
    [settings.blocks, updateBlocks],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      updateBlocks((previous) => previous.filter((block) => block.id !== id));
      setSelectedBlockId(null);
    },
    [updateBlocks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      updateBlocks((previous) => {
        const from = previous.findIndex((block) => block.id === active.id);
        const to = previous.findIndex((block) => block.id === over.id);
        if (from < 0 || to < 0) return previous;
        return arrayMove(previous, from, to);
      });
    },
    [updateBlocks],
  );

  const appendMessageToken = (token: string) => {
    updateBlocks((previous) => {
      const selectedText =
        selectedBlock?.type === "text" ? selectedBlock.id : null;
      const fallbackText =
        [...previous].reverse().find((block) => block.type === "text")?.id ??
        null;
      const targetId = selectedText ?? fallbackText;

      if (!targetId) {
        const nextBlock: EmailBlock = { id: uid(), type: "text", content: token };
        setSelectedBlockId(nextBlock.id);
        return [...previous, nextBlock];
      }

      return previous.map((block) => {
        if (block.id !== targetId || block.type !== "text") return block;
        const separator = block.content && !block.content.endsWith(" ") ? " " : "";
        return { ...block, content: `${block.content}${separator}${token}` };
      });
    });
  };

  return (
    <div className="bg-gray-50/70 p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-50 text-primary-600">
                  <PaperPlaneTiltIcon size={20} weight="fill" />
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  Submit Form
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Send a confirmation email after a respondent submits.
                </p>
              </div>
              <Toggle
                checked={settings.enabled}
                onChange={(enabled) => updateSettings({ enabled })}
              />
            </div>
          </section>

          <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <EnvelopeSimpleIcon size={18} weight="fill" className="text-gray-500" />
              <h3 className="text-sm font-bold text-gray-900">Recipient field</h3>
            </div>

            <div className="mt-4 space-y-2">
              {emailFields.length ? (
                emailFields.map((field) => {
                  const selected = field.id === settings.recipientFieldId;
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => updateSettings({ recipientFieldId: field.id })}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-primary-300 bg-primary-50/80"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-primary-500 bg-primary-600 text-white"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        <CheckIcon size={13} weight="bold" />
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600">
                        <EnvelopeSimpleIcon size={16} weight="fill" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-800">
                          {field.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-400">
                          {field.pageTitle}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                  <EnvelopeSimpleIcon
                    size={24}
                    className="mx-auto text-gray-300"
                  />
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    No email field found
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Add an Email field or set a text field validation to email.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>

        <aside className="space-y-5">
          <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-50 text-amber-600">
                  <HashIcon size={20} weight="bold" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  Lottery number
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Generate a number for each submitted respondent.
                </p>
              </div>
              <Toggle
                checked={settings.raffleEnabled}
                onChange={(raffleEnabled) => updateSettings({ raffleEnabled })}
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Prefix
                  </label>
                  <input
                    value={settings.rafflePrefix}
                    onChange={(event) =>
                      updateSettings({ rafflePrefix: event.target.value })
                    }
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    placeholder="UF-"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Suffix
                  </label>
                  <input
                    value={settings.raffleSuffix}
                    onChange={(event) =>
                      updateSettings({ raffleSuffix: event.target.value })
                    }
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    placeholder="-A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Start from
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.raffleStart}
                    onChange={(event) =>
                      updateSettings({
                        raffleStart: Number(event.target.value) || 0,
                      })
                    }
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Digits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.rafflePadding}
                    onChange={(event) =>
                      updateSettings({
                        rafflePadding: normalizePadding(Number(event.target.value)),
                      })
                    }
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-700">Preview</p>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-900">
                  {settings.raffleEnabled ? rafflePreview : "-"}
                </p>
              </div>
            </div>
          </section>

        </aside>
      </div>

      <section className="mt-6 rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <SparkleIcon size={18} weight="fill" className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Email content</h3>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Subject
              </label>
              <input
                value={settings.subject}
                onChange={(event) =>
                  updateSettings({ subject: event.target.value })
                }
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="Submission received"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Theme
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
                  <ThemeSelectIcon theme={emailTheme.config} />
                </span>
                <ConditionSelect
                  value={getThemeSelectValue(emailTheme)}
                  placeholder="Select theme"
                  options={themeOptions}
                  onChange={(emailThemeValue) =>
                    updateSettings({ emailThemeValue })
                  }
                  menuPlacement="auto"
                  menuWidth={260}
                  triggerClassName="rounded-md pl-16"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500">
                  Message
                </label>
                <p className="mt-1 text-xs text-gray-400">
                  Design the confirmation email sent after submission.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {["{{form_title}}", "{{raffle_number}}", "{{submitted_at}}"].map(
                  (token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => appendMessageToken(token)}
                      className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      {token}
                    </button>
                  ),
                )}
                <AddBlockDropdown onAdd={(type) => addBlock(type)} />
              </div>
            </div>
            <div className="grid overflow-hidden rounded-md border border-gray-200 bg-white xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="min-h-[32rem] bg-gray-100/70 p-7">
                <div
                  className="mx-auto min-h-[18rem] w-full max-w-[54rem] rounded-xl px-8 py-7 shadow-sm"
                  style={{
                    background: emailTheme.config.bg,
                    color: emailTheme.config.textColor,
                    fontFamily: emailTheme.config.fontFamily,
                  }}
                >
                  {settings.blocks.length === 0 ? (
                    <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                      <AddBlockDropdown onAdd={(type) => addBlock(type)} />
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={settings.blocks.map((block) => block.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div>
                          {settings.blocks.map((block, index) => (
                            <div key={block.id}>
                              <BlockInsertControl
                                isVisible={
                                  selectedBlockId === block.id ||
                                  selectedBlockId ===
                                    settings.blocks[index - 1]?.id
                                }
                                onAdd={(type) =>
                                  addBlock(
                                    type,
                                    index === 0
                                      ? null
                                      : settings.blocks[index - 1]?.id,
                                  )
                                }
                              />
                              <SortableBlock
                                block={block}
                                isSelected={selectedBlockId === block.id}
                                onDelete={() => deleteBlock(block.id)}
                                onDuplicate={() => duplicateBlock(block.id)}
                                onPickImage={() => setImagePickerFor(block.id)}
                                onSelect={() => setSelectedBlockId(block.id)}
                                onUpdate={(patch) =>
                                  updateBlock(block.id, patch)
                                }
                              />
                            </div>
                          ))}
                          <BlockInsertControl
                            isVisible={
                              selectedBlockId ===
                              settings.blocks[settings.blocks.length - 1]?.id
                            }
                            onAdd={(type) =>
                              addBlock(
                                type,
                                settings.blocks[settings.blocks.length - 1]
                                  ?.id ?? null,
                              )
                            }
                          />
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>

              <aside className="min-h-[32rem] border-t border-gray-200 bg-white xl:border-l xl:border-t-0">
                {selectedBlock ? (
                  selectedBlock.type === "image" ? (
                    <ImageSettingsPanel
                      block={selectedBlock}
                      onClose={() => setSelectedBlockId(null)}
                      onPickImage={() => setImagePickerFor(selectedBlock.id)}
                      onUpdate={(patch) =>
                        updateBlock(selectedBlock.id, patch)
                      }
                    />
                  ) : selectedBlock.type === "text" ? (
                    <TextSettingsPanel
                      onClose={() => setSelectedBlockId(null)}
                    />
                  ) : (
                    <SpacerSettingsPanel
                      block={selectedBlock}
                      onClose={() => setSelectedBlockId(null)}
                      onUpdate={(patch) =>
                        updateBlock(selectedBlock.id, patch)
                      }
                    />
                  )
                ) : (
                  <div className="p-5">
                    <p className="text-sm font-bold text-gray-700">
                      Message blocks
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      Add text, image, or spacer blocks. Select a block to edit
                      its settings.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </section>
      {imagePickerFor ? (
        <ImagePickerModal
          isOpen
          showIconTab={false}
          onClose={() => setImagePickerFor(null)}
          onSelect={(url) => {
            updateBlock(imagePickerFor, { url });
            setImagePickerFor(null);
          }}
        />
      ) : null}
    </div>
  );
}

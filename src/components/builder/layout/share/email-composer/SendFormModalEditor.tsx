import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  ArrowLeftIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ImagePickerModal } from "@/components/modal";
import {
  useMutationCreateEmailBlast,
  useMutationSaveEmailComposerDraft,
} from "@/api/email-blasts";
import { useQueryResponses } from "@/api/responses";
import { resolveTheme } from "@/utils/form/themeConfig";
import {
  DEFAULT_EMAIL_IMAGE_URL,
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
  EMAIL_RE,
} from "./constants";
import {
  AddBlockDropdown,
  BlockInsertControl,
  EmailBlocksPreview,
  EmailStepIndicator,
  FieldSourceOption,
  GeneralSettingsPanel,
  ImageSettingsPanel,
  LeaveWithoutSendingModal,
  ManualRecipientInput,
  SortableBlock,
  SpacerSettingsPanel,
  TextSettingsPanel,
} from "./components";
import type {
  EmailBlock,
  EmailBlockPatch,
  EmailComposerDraftState,
  EmailComposerScreen,
  EmailFieldSource,
  RecipientMode,
  SendFormModalProps,
} from "@/types/builderShare";
import {
  buildEmailFieldSources,
  generateHtml,
  hasLocalEmailImageUrl,
  isEventNotFound,
  normalizeEmailDraftForSave,
  serializeEmailDraft,
  toSaveEmailDraftPayload,
  uid,
} from "./utils";

type SendFormModalEditorProps = SendFormModalProps & {
  initialDraft: EmailComposerDraftState;
  savedDraftKey: string;
};

export default function SendFormModalEditor({
  activeTheme,
  eventId,
  formTitle,
  initialDraft,
  isOpen,
  onClose,
  publicFormUrl,
  savedDraftKey,
  sections = [],
  showToast,
}: SendFormModalEditorProps) {
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState(savedDraftKey);
  const [screen, setScreen] = useState<EmailComposerScreen>("compose");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [emailStyle, setEmailStyle] = useState(initialDraft.emailStyle);
  const [emailThemeValue, setEmailThemeValue] = useState<string | null>(
    initialDraft.emailThemeValue,
  );
  const [subject, setSubject] = useState(initialDraft.subject);
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialDraft.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [manualRecipients, setManualRecipients] = useState<string[]>(
    initialDraft.manualRecipients,
  );
  const [recipientMode, setRecipientMode] = useState<RecipientMode>(
    initialDraft.recipientMode,
  );
  const [selectedEmailFieldIds, setSelectedEmailFieldIds] = useState<
    Set<string>
  >(() => new Set(initialDraft.selectedEmailFieldIds));
  const [excludedRecipients, setExcludedRecipients] = useState<Set<string>>(
    () => new Set(initialDraft.excludedRecipients),
  );

  const { data: responses = [] } = useQueryResponses(eventId);
  const createBlast = useMutationCreateEmailBlast();
  const saveDraft = useMutationSaveEmailComposerDraft();
  const resolvedFormTheme = useMemo(() => resolveTheme(activeTheme), [activeTheme]);
  const resolvedEmailTheme = useMemo(
    () => resolveTheme(emailThemeValue ?? activeTheme),
    [activeTheme, emailThemeValue],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? null;
  const emailFieldSources = useMemo(
    () => buildEmailFieldSources(sections, responses),
    [responses, sections],
  );
  const selectedFieldRecipients = useMemo(() => {
    const emails = new Set<string>();
    emailFieldSources.forEach((source) => {
      if (!selectedEmailFieldIds.has(source.fieldId)) return;
      source.emails.forEach((email) => emails.add(email));
    });
    return Array.from(emails).sort();
  }, [emailFieldSources, selectedEmailFieldIds]);
  const recipients = useMemo(() => {
    const all = new Set([...manualRecipients, ...selectedFieldRecipients]);
    return Array.from(all)
      .filter((email) => !excludedRecipients.has(email))
      .sort();
  }, [excludedRecipients, manualRecipients, selectedFieldRecipients]);
  const currentDraft = useMemo<EmailComposerDraftState>(
    () => ({
      blocks,
      emailStyle,
      emailThemeValue,
      excludedRecipients: Array.from(excludedRecipients),
      manualRecipients,
      recipientMode,
      selectedEmailFieldIds: Array.from(selectedEmailFieldIds),
      subject,
    }),
    [
      blocks,
      emailStyle,
      emailThemeValue,
      excludedRecipients,
      manualRecipients,
      recipientMode,
      selectedEmailFieldIds,
      subject,
    ],
  );
  const normalizedCurrentDraft = useMemo(
    () => normalizeEmailDraftForSave(currentDraft, formTitle, publicFormUrl),
    [currentDraft, formTitle, publicFormUrl],
  );
  const isEmailDraftDirty = useMemo(
    () => serializeEmailDraft(normalizedCurrentDraft) !== savedDraftSnapshot,
    [normalizedCurrentDraft, savedDraftSnapshot],
  );

  useEffect(() => {
    if (!isOpen || !isEmailDraftDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEmailDraftDirty, isOpen]);

  function requestClose() {
    if (isEmailDraftDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose();
  }

  function exitWithoutSaving() {
    setShowLeaveConfirm(false);
    onClose();
  }

  function addBlock(type: EmailBlock["type"], afterId?: string | null) {
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

    setBlocks((previous) => {
      if (afterId === null) return [newBlock, ...previous];
      if (!afterId) return [...previous, newBlock];
      const index = previous.findIndex((block) => block.id === afterId);
      if (index < 0) return [...previous, newBlock];
      const next = [...previous];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    setSelectedId(newBlock.id);
  }

  function updateBlock(id: string, patch: EmailBlockPatch) {
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === id ? ({ ...block, ...patch } as EmailBlock) : block,
      ),
    );
  }

  function duplicateBlock(id: string) {
    const source = blocks.find((block) => block.id === id);
    if (!source) return;
    const copy = { ...source, id: uid() };
    setBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === id);
      const next = [...previous];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  }

  function deleteBlock(id: string) {
    setBlocks((previous) => previous.filter((block) => block.id !== id));
    setSelectedId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((previous) => {
      const from = previous.findIndex((block) => block.id === active.id);
      const to = previous.findIndex((block) => block.id === over.id);
      if (from < 0 || to < 0) return previous;
      return arrayMove(previous, from, to);
    });
  }

  function addManualRecipients(value = manualInput) {
    const candidates = value
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const valid = candidates.filter((item) => EMAIL_RE.test(item));

    if (candidates.length === 0) {
      showToast?.("Enter at least one email", "error");
      return;
    }

    if (valid.length !== candidates.length) {
      showToast?.("Some email addresses are invalid", "error");
      return;
    }

    setManualRecipients((previous) =>
      Array.from(new Set([...previous, ...valid])),
    );
    setExcludedRecipients((previous) => {
      const next = new Set(previous);
      valid.forEach((email) => next.delete(email));
      return next;
    });
    setManualInput("");
  }

  function toggleEmailField(source: EmailFieldSource) {
    setSelectedEmailFieldIds((previous) => {
      const next = new Set(previous);
      if (next.has(source.fieldId)) {
        next.delete(source.fieldId);
      } else {
        next.add(source.fieldId);
        setExcludedRecipients((current) => {
          const excluded = new Set(current);
          source.emails.forEach((email) => excluded.delete(email));
          return excluded;
        });
      }
      return next;
    });
  }

  function removeRecipient(email: string) {
    setManualRecipients((previous) => previous.filter((item) => item !== email));
    if (selectedFieldRecipients.includes(email)) {
      setExcludedRecipients((previous) => new Set(previous).add(email));
    }
  }

  async function handleSaveDraft({ silent = false }: { silent?: boolean } = {}) {
    if (saveDraft.isPending) return false;

    if (!silent) {
      showToast?.("Saving email settings...", "info", 0);
    }

    try {
      await saveDraft.mutateAsync(
        toSaveEmailDraftPayload(eventId, normalizedCurrentDraft),
      );
      setSavedDraftSnapshot(serializeEmailDraft(normalizedCurrentDraft));
      if (!silent) {
        showToast?.("Email settings saved", "success");
      }
      return true;
    } catch (error) {
      if (isEventNotFound(error)) {
        showToast?.("Form belum tersimpan. Save form dulu ya.", "error");
      } else if (!silent) {
        showToast?.("Failed to save email settings", "error");
      }
      return false;
    }
  }

  async function handleSend() {
    if (!subject.trim()) {
      showToast?.("Subject is required", "error");
      return;
    }

    if (recipients.length === 0) {
      showToast?.("Add at least one recipient", "error");
      return;
    }

    if (hasLocalEmailImageUrl(blocks)) {
      showToast?.(
        "Image upload masih lokal. Pilih ulang atau upload image lagi supaya bisa ikut terkirim.",
        "error",
      );
      return;
    }

    try {
      if (isEmailDraftDirty) {
        const saved = await handleSaveDraft({ silent: true });
        if (!saved) return;
      }
      await createBlast.mutateAsync({
        eventId,
        html: generateHtml(blocks, emailStyle, resolvedEmailTheme.config),
        recipients,
        subject,
      });
      showToast?.(
        `Sending to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`,
        "success",
      );
      onClose();
    } catch {
      showToast?.("Failed to send email blast", "error");
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-300 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={requestClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16 }}
        className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-5 py-4">
          {screen === "recipients" ? (
            <button
              type="button"
              onClick={() => setScreen("compose")}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800"
              aria-label="Back to email composer"
            >
              <ArrowLeftIcon size={15} weight="bold" />
            </button>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <EnvelopeSimpleIcon size={20} weight="fill" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-950">
              Send form by email
            </h2>
          </div>

          <EmailStepIndicator screen={screen} />

          <button
            type="button"
            onClick={requestClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close send email modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {screen === "compose" ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-100 px-8 py-6">
                <div
                  className={`mx-auto w-full max-w-2xl overflow-visible rounded-lg ${
                    emailStyle === "formatted" ? "px-8 py-6" : ""
                  }`}
                  onClick={() => setSelectedId(null)}
                  style={{
                    background:
                      emailStyle === "formatted"
                        ? resolvedEmailTheme.config.canvasBg
                        : resolvedEmailTheme.config.bg,
                    fontFamily: resolvedEmailTheme.config.fontFamily,
                  }}
                >
                  {emailStyle === "formatted" ? (
                    <div
                      className="mb-5 text-center text-3xl font-extrabold leading-none"
                      style={{ color: resolvedEmailTheme.config.textColor }}
                    >
                      UpForm
                    </div>
                  ) : null}

                  <div
                    className={`px-8 py-6 ${
                      emailStyle === "formatted" ? "rounded-lg" : ""
                    }`}
                    style={{
                      background: resolvedEmailTheme.config.bg,
                      color: resolvedEmailTheme.config.textColor,
                    }}
                  >
                    {blocks.length === 0 ? (
                      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                        <AddBlockDropdown onAdd={(type) => addBlock(type)} />
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={blocks.map((block) => block.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div>
                            {blocks.map((block, index) => (
                              <div key={block.id}>
                                <BlockInsertControl
                                  isVisible={
                                    selectedId === block.id ||
                                    selectedId === blocks[index - 1]?.id
                                  }
                                  onAdd={(type) =>
                                    addBlock(
                                      type,
                                      index === 0 ? null : blocks[index - 1]?.id,
                                    )
                                  }
                                />
                                <SortableBlock
                                  block={block}
                                  isSelected={selectedId === block.id}
                                  onDelete={() => deleteBlock(block.id)}
                                  onDuplicate={() => duplicateBlock(block.id)}
                                  onPickImage={() => setImagePickerFor(block.id)}
                                  onSelect={() => setSelectedId(block.id)}
                                  onUpdate={(patch) =>
                                    updateBlock(block.id, patch)
                                  }
                                />
                              </div>
                            ))}
                            <BlockInsertControl
                              isVisible={
                                selectedId === blocks[blocks.length - 1]?.id
                              }
                              onAdd={(type) =>
                                addBlock(
                                  type,
                                  blocks[blocks.length - 1]?.id ?? null,
                                )
                              }
                            />
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </div>

              <aside className="flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-50">
                {selectedBlock ? (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {selectedBlock.type === "image" ? (
                      <ImageSettingsPanel
                        block={selectedBlock}
                        onClose={() => setSelectedId(null)}
                        onPickImage={() => setImagePickerFor(selectedBlock.id)}
                        onUpdate={(patch) =>
                          updateBlock(selectedBlock.id, patch)
                        }
                      />
                    ) : selectedBlock.type === "text" ? (
                      <TextSettingsPanel onClose={() => setSelectedId(null)} />
                    ) : (
                      <SpacerSettingsPanel
                        block={selectedBlock}
                        onClose={() => setSelectedId(null)}
                        onUpdate={(patch) =>
                          updateBlock(selectedBlock.id, patch)
                        }
                      />
                    )}
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <GeneralSettingsPanel
                      currentFormTheme={resolvedFormTheme}
                      emailStyle={emailStyle}
                      selectedTheme={resolvedEmailTheme}
                      subject={subject}
                      onEmailStyleChange={setEmailStyle}
                      onSubjectChange={setSubject}
                      onThemeChange={setEmailThemeValue}
                    />
                  </div>
                )}
              </aside>
            </>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_448px] gap-8 overflow-y-auto bg-white p-6">
              <div className="min-w-0">
                <EmailBlocksPreview
                  blocks={blocks}
                  emailStyle={emailStyle}
                  theme={resolvedEmailTheme.config}
                />
              </div>

              <aside className="min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="max-h-full overflow-y-auto p-5">
                  <div className="space-y-6">
                    <div>
                      <ManualRecipientInput
                        inputValue={manualInput}
                        recipients={manualRecipients}
                        onAdd={() => addManualRecipients()}
                        onInputChange={setManualInput}
                        onRemove={removeRecipient}
                      />

                      <div className="mt-3 inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => setRecipientMode("manual")}
                          className={`h-8 rounded px-3 text-xs font-semibold transition-colors ${
                            recipientMode === "manual"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Manual input
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientMode("field")}
                          className={`h-8 rounded px-3 text-xs font-semibold transition-colors ${
                            recipientMode === "field"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Email field
                        </button>
                      </div>
                    </div>

                    {recipientMode === "field" ? (
                      <div className="space-y-2">
                        {emailFieldSources.length > 0 ? (
                          emailFieldSources.map((source) => (
                            <FieldSourceOption
                              key={source.fieldId}
                              source={source}
                              selected={selectedEmailFieldIds.has(
                                source.fieldId,
                              )}
                              onToggle={() => toggleEmailField(source)}
                            />
                          ))
                        ) : (
                          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              No email field found
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Add an Email field and collect responses first.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900">
                        Subject
                      </label>
                      <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <span className="block text-xs font-medium text-gray-400">
              {recipients.length} recipient
              {recipients.length !== 1 ? "s" : ""} selected
            </span>
            {isEmailDraftDirty ? (
              <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                {saveDraft.isPending ? (
                  <>
                    <SpinnerGapIcon size={10} className="animate-spin" />
                    Saving email...
                  </>
                ) : (
                  "Email settings unsaved"
                )}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => handleSaveDraft()}
            disabled={!isEmailDraftDirty || saveDraft.isPending}
            className="ml-auto flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveDraft.isPending ? (
              <SpinnerGapIcon size={15} className="animate-spin" />
            ) : (
              <CheckIcon size={15} weight="bold" />
            )}
            {saveDraft.isPending ? "Saving..." : "Save"}
          </button>
          {screen === "compose" ? (
            <button
              type="button"
              onClick={() => setScreen("recipients")}
              className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              <UsersIcon size={16} weight="fill" />
              Set recipients
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={
                createBlast.isPending ||
                saveDraft.isPending ||
                recipients.length === 0
              }
              className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createBlast.isPending ? (
                <SpinnerGapIcon size={16} className="animate-spin" />
              ) : (
                <PaperPlaneTiltIcon size={16} weight="fill" />
              )}
              {createBlast.isPending ? "Sending..." : "Send form"}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showLeaveConfirm ? (
            <LeaveWithoutSendingModal
              onExit={exitWithoutSaving}
              onResume={() => setShowLeaveConfirm(false)}
            />
          ) : null}
        </AnimatePresence>

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
      </motion.div>
    </motion.div>,
    document.body,
  );
}

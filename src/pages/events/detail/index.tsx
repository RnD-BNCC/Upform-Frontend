import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  BuilderHeader,
  BuilderGamePanel,
  BuilderSharePanel,
  CoverSettingsPanel,
  CoverPagePreview,
  EndingSettingsPanel,
  EndingPagePreview,
  FieldCategoryPanel,
  FieldPropertiesPanel,
  FormPagePreview,
  LogicModal,
  PageTabBar,
  ThemeImagePositionModal,
  ThemePickerModal,
  ThemePanel,
} from "@/components/builder";
import { ReferenceCalculationProvider } from "@/components/builder/layout/reference/ReferenceCalculationContext";
import {
  ConfirmModal,
  ImagePickerModal,
  LoadingModal,
  StatusModal,
} from "@/components/modal";
import { RenameModal, Spinner } from "@/components/ui";
import ResponsesPanel from "@/components/responses/ResponsesPanel";
import ShareToast from "@/components/toast/ShareToast";
import { useEventDetailPage } from "@/hooks/events";
import type { SubmitSettingsEditorState } from "@/types/builderShare";
import {
  DesktopIcon,
  FloppyDiskIcon,
  ImageIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  getFormCalculationsFromSections,
  setFormCalculationsInSections,
} from "@/utils/form";
import { ensureGoogleFontsLoaded } from "@/utils/form/googleFonts";
import {
  getThemeCustomConfig,
  resolveTheme,
  serializeCustomTheme,
} from "@/utils/form/themeConfig";

function EditorLargeScreenNotice({
  onBack,
  onOpenRespondentForm,
}: {
  onBack: () => void;
  onOpenRespondentForm?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-3 py-6 lg:hidden">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-5 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <DesktopIcon size={24} weight="duotone" />
        </div>
        <h1 className="text-base font-bold text-gray-950">
          The UpForm editor works best on larger screens
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Note that the forms you build will still work on mobile devices.
        </p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-full items-center justify-center rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Back to home
          </button>
          {onOpenRespondentForm ? (
            <button
              type="button"
              onClick={onOpenRespondentForm}
              className="flex h-9 w-full items-center justify-center rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Open respondent form
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const {
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
    buildSectionsForPageLogic,
    confirmAction,
    confirmDeletePageIdx,
    coverBgImage,
    coverHeroImage,
    coverLayout,
    createEvent,
    deletedSectionIdsRef,
    deleteErrorOpen,
    deleteField,
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
    id,
    isAddingPage,
    isChangingStatus,
    isCoverPage,
    isDirty,
    isLoading,
    isLogicOpen,
    isPublishing,
    isRightPanelOpen,
    isSaving,
    isUpdatingMeta,
    leftPanelMode,
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
    setConfirmAction,
    setConfirmDeletePageIdx,
    setCoverBgImage,
    setCoverHeroImage,
    setCoverLayout,
    setDeleteErrorOpen,
    setFormTitle,
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
    welcomeRename,
    welcomeThemePicker,
  } = useEventDetailPage();
  const [isCoverBgPickerOpen, setIsCoverBgPickerOpen] = useState(false);
  const [isThemeImagePositionOpen, setIsThemeImagePositionOpen] =
    useState(false);
  const [submitSettingsState, setSubmitSettingsState] =
    useState<SubmitSettingsEditorState>({ dirty: false, saving: false });

  useEffect(() => {
    ensureGoogleFontsLoaded([
      {
        key: themeConfig.fontKey,
        label: themeConfig.fontKey,
        family: themeConfig.fontFamily,
        category: themeConfig.fontCategory,
      },
    ]);
  }, [
    themeConfig.fontCategory,
    themeConfig.fontFamily,
    themeConfig.fontKey,
  ]);

  if (isLoading) {
    return (
      <>
        <EditorLargeScreenNotice
          onBack={() => navigate("/")}
          onOpenRespondentForm={id ? () => navigate(`/forms/${id}`) : undefined}
        />
        <div className="hidden min-h-screen items-center justify-center bg-gray-50 lg:flex">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={32} className="text-primary-500" />
            <p className="text-sm text-gray-400">Loading form...</p>
          </div>
        </div>
      </>
    );
  }

  const referenceCalculations = getFormCalculationsFromSections(sections);
  const canAdjustThemeImage =
    activePageType === "page" &&
    themeConfig.formPosition !== "center" &&
    !!themeConfig.formImageUrl;
  const hasUnsavedChanges = isDirty || submitSettingsState.dirty;
  const isAnySaving = isSaving || submitSettingsState.saving;

  return (
    <ReferenceCalculationProvider calculations={referenceCalculations}>
      <EditorLargeScreenNotice
        onBack={() => navigate("/")}
        onOpenRespondentForm={id ? () => navigate(`/forms/${id}`) : undefined}
      />

      <div className="hidden h-screen flex-col overflow-hidden lg:flex">
        <BuilderHeader
        formTitle={formTitle}
        onTitleChange={setFormTitle}
        activeTab={activeTab}
        onTabChange={(nextTab) => {
          if (submitSettingsState.dirty && activeTab === "share" && nextTab !== "share") {
            return;
          }
          setActiveTab(nextTab);
        }}
        onBack={() => (hasUnsavedChanges ? setShowLeaveDialog(true) : navigate("/"))}
        onPreview={() =>
          navigate(`/forms/${id}/preview`, {
            state: {
              sections,
              formTitle,
              bannerColor,
              bannerImage,
              theme: activeTheme,
            },
          })
        }
        isSaving={isAnySaving}
        isDirty={hasUnsavedChanges}
        eventStatus={eventStatus}
        onPublish={() => setConfirmAction("publish")}
        isPublishing={isPublishing}
        onUnpublish={() => setConfirmAction("unpublish")}
        onClose={() => setConfirmAction("close")}
      />

      {activeTab === "questions" ? (
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-1 overflow-hidden">
            {leftPanelMode === "theme" ? (
              <ThemePanel
                activeTheme={activeTheme}
                pageType={activePageType}
                onThemeChange={handleThemeChange}
                onClose={() => setLeftPanelMode("fields")}
              />
            ) : activePageType === "cover" ? (
              <CoverSettingsPanel
                startText={startButtonText}
                onStartTextChange={(text) => {
                  setStartButtonText(text);
                  setSections((prev) =>
                    prev.map((section) =>
                      section.pageType === "cover"
                        ? {
                            ...section,
                            settings: { ...section.settings, startButtonText: text },
                          }
                        : section,
                    ),
                  );
                }}
                coverImage={coverHeroImage}
                onAddImage={(url) => {
                  setCoverHeroImage(url);
                  setSections((prev) =>
                    prev.map((section) =>
                      section.pageType === "cover"
                        ? {
                            ...section,
                            settings: {
                              ...section.settings,
                              coverHeroImage: url,
                            },
                          }
                        : section,
                    ),
                  );
                }}
                onRemoveImage={() => {
                  setCoverHeroImage(null);
                  setSections((prev) =>
                    prev.map((section) =>
                      section.pageType === "cover"
                        ? {
                            ...section,
                            settings: { ...section.settings, coverHeroImage: null },
                          }
                        : section,
                    ),
                  );
                }}
                coverLayout={coverLayout}
                onLayoutChange={(layout) => {
                  setCoverLayout(layout);
                  setSections((prev) =>
                    prev.map((section) =>
                      section.pageType === "cover"
                        ? {
                            ...section,
                            settings: { ...section.settings, coverLayout: layout },
                          }
                        : section,
                    ),
                  );
                }}
              />
            ) : activePageType === "ending" ? (
              <EndingSettingsPanel
                onAddField={(type) => {
                  if (activePage) addField(type, activePage.id);
                }}
                hasThankyou={activePage?.fields.some(
                  (field) => field.type === "thank_you_block",
                )}
              />
            ) : (
              <FieldCategoryPanel
                onAddField={(type) => {
                  if (activePage) addField(type, activePage.id);
                }}
                onAddImageBlock={(url) => {
                  if (activePage) addField("image_block", activePage.id, url);
                }}
              />
            )}

            <div className="group/builder-preview flex-1 flex flex-col overflow-hidden relative mx-4 mt-4">
              <div className="absolute top-4 left-3 z-20 pointer-events-none">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setLeftPanelMode((mode) =>
                      mode === "theme" ? "fields" : "theme",
                    );
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

              {isCoverPage && coverLayout === 3 && (
                <div className="absolute top-4 right-3 z-20">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowBgImageModal(true);
                    }}
                    className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                    title="Adjust background image"
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
              )}

              <div
                className={`flex-1 overflow-y-auto overflow-x-hidden border scrollbar-thin border-x border-gray-200 rounded-sm ${
                  isCoverPage ? "flex h-full flex-col" : ""
                }`}
                style={{ background: themeConfig.canvasBg }}
                onClick={() => setSelectedId(null)}
              >
                {isCoverPage && activePage && (
                  <CoverPagePreview
                    coverBgImage={coverBgImage}
                    coverHeroImage={coverHeroImage}
                    coverLayout={coverLayout}
                    section={activePage}
                    startButtonText={startButtonText}
                    themeConfig={themeConfig}
                    onTitleChange={(value) =>
                      setSections((prev) =>
                        prev.map((section) =>
                          section.id === activePage.id
                            ? {
                                ...section,
                                settings: {
                                  ...section.settings,
                                  coverTitle: value,
                                },
                              }
                            : section,
                        ),
                      )
                    }
                    onDescriptionChange={(value) =>
                      setSections((prev) =>
                        prev.map((section) =>
                          section.id === activePage.id
                            ? {
                                ...section,
                                settings: {
                                  ...section.settings,
                                  coverDescription: value,
                                },
                              }
                            : section,
                        ),
                      )
                    }
                  />
                )}

                {activePageType === "page" && activePage && (
                  <FormPagePreview
                    accentColor={bannerColor}
                    activeFieldId={activeId}
                    dragInsertIdx={dragInsertIdx}
                    isLightTheme={themeConfig.key === "light"}
                    paletteDragType={paletteDragType}
                    paletteInsertIdx={paletteInsertIdx}
                    questionsEndRef={questionsEndRef}
                    section={activePage}
                    sections={sections}
                    selectedId={selectedId}
                    themeConfig={themeConfig}
                    onChangeField={(fieldId, updates) =>
                      updateField(activePage.id, fieldId, updates)
                    }
                    onDeleteField={(fieldId) => deleteField(activePage.id, fieldId)}
                    onDuplicateField={(fieldId) =>
                      duplicateField(activePage.id, fieldId)
                    }
                    onImagePositionClick={
                      canAdjustThemeImage
                        ? () => setIsThemeImagePositionOpen(true)
                        : undefined
                    }
                    onSelectField={(fieldId) => {
                      setSelectedId(fieldId);
                      setIsRightPanelOpen(true);
                    }}
                  />
                )}

                {activePageType === "ending" && activePage && (
                  <EndingPagePreview
                    accentColor={bannerColor}
                    activeFieldId={activeId}
                    dragInsertIdx={dragInsertIdx}
                    paletteDragType={paletteDragType}
                    paletteInsertIdx={paletteInsertIdx}
                    questionsEndRef={questionsEndRef}
                    section={activePage}
                    sections={sections}
                    selectedId={selectedId}
                    themeConfig={themeConfig}
                    onChangeField={(fieldId, updates) =>
                      updateField(activePage.id, fieldId, updates)
                    }
                    onDeleteField={(fieldId) => deleteField(activePage.id, fieldId)}
                    onDuplicateField={(fieldId) =>
                      duplicateField(activePage.id, fieldId)
                    }
                    onSelectField={(fieldId) => {
                      setSelectedId(fieldId);
                      setIsRightPanelOpen(true);
                    }}
                  />
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
                onLogicOpen={() => {
                  setLogicInitialTab("pageLogic");
                  setIsLogicOpen(true);
                }}
                onRenamePage={(idx, title) =>
                  setSections((prev) =>
                    prev.map((section, index) =>
                      index === idx ? { ...section, title } : section,
                    ),
                  )
                }
                onDeletePage={(idx) => setConfirmDeletePageIdx(idx)}
                onDuplicatePage={(idx) => {
                  const source = sections[idx];
                  if (!source) return;
                  const duplicate = {
                    ...source,
                    id: crypto.randomUUID(),
                    fields: source.fields.map((field) => ({
                      ...field,
                      id: crypto.randomUUID(),
                    })),
                  };
                  setSections((prev) => [
                    ...prev.slice(0, idx + 1),
                    duplicate,
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

            <FieldPropertiesPanel
              isOpen={isRightPanelOpen}
              field={selectedField?.field}
              sections={sections}
              onChange={(updates) => {
                if (selectedField) {
                  updateField(
                    selectedField.sectionId,
                    selectedField.field.id,
                    updates,
                  );
                }
              }}
              onClose={() => {
                setIsRightPanelOpen(false);
                setSelectedId(null);
              }}
            />
          </div>

          <DragOverlay>
            {paletteDragType ? (
              <div className="px-3 py-2 bg-white border border-primary-300 rounded-lg text-xs font-medium text-primary-600 shadow-lg opacity-95">
                {paletteDragType}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : activeTab === "share" ? (
        <div className="flex-1 overflow-hidden">
          <BuilderSharePanel
            activeTheme={activeTheme}
            eventId={id ?? ""}
            eventStatus={eventStatus}
            formTitle={formTitle}
            isDirty={isDirty}
            isPublishing={isPublishing}
            onSubmitSettingsStateChange={setSubmitSettingsState}
            publicFormUrl={publicFormUrl}
            sections={sections}
            onPublish={() => setConfirmAction("publish")}
            showToast={showToast}
          />
        </div>
      ) : activeTab === "game" ? (
        <div className="flex-1 overflow-hidden">
          <BuilderGamePanel
            eventId={id ?? ""}
            formTitle={formTitle}
            responses={responses}
            sections={sections}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ResponsesPanel
            responses={responses}
            allFields={sections.flatMap((section) => section.fields)}
            eventId={id ?? ""}
            sections={sections}
            showToast={showToast}
            spreadsheetUrl={existing?.spreadsheetUrl}
          />
        </div>
      )}

      <LogicModal
        isOpen={isLogicOpen}
        initialTab={logicInitialTab}
        onClose={() => {
          setIsLogicOpen(false);
          setLogicInitialTab("pageLogic");
        }}
        pages={sections}
        id={id}
        onSave={({ branches, calculations }) =>
          handleSave({
            showFeedback: false,
            sectionsOverride: setFormCalculationsInSections(
              buildSectionsForPageLogic(sections, branches),
              calculations,
            ),
          })
        }
        onToast={showToast}
        onNodeMove={handleNodeMove}
        onRenamePage={(pageId, title) =>
          setSections((prev) =>
            prev.map((section) =>
              section.id === pageId ? { ...section, title } : section,
            ),
          )
        }
        onDeletePage={(pageId) => {
          const idx = sections.findIndex((section) => section.id === pageId);
          if (idx < 0) return;
          const target = sections[idx];
          if (target?.pageType === "ending") {
            const endingCount = sections.filter(
              (section) => section.pageType === "ending",
            ).length;
            if (endingCount <= 1) {
              setDeleteErrorOpen(true);
              return;
            }
          }
          deletedSectionIdsRef.current.push(pageId);
          setSections((prev) => prev.filter((section) => section.id !== pageId));
          setActivePageIdx((pageIdx) => Math.max(0, pageIdx >= idx ? pageIdx - 1 : pageIdx));
          setSelectedId(null);
        }}
        onDuplicatePage={(pageId) => {
          const source = sections.find((section) => section.id === pageId);
          if (!source) return;
          const duplicate = {
            ...source,
            id: crypto.randomUUID(),
            fields: source.fields.map((field) => ({
              ...field,
              id: crypto.randomUUID(),
            })),
          };
          const idx = sections.findIndex((section) => section.id === pageId);
          setSections((prev) => [
            ...prev.slice(0, idx + 1),
            duplicate,
            ...prev.slice(idx + 1),
          ]);
        }}
        onSetFirstPage={(pageId) => {
          const idx = sections.findIndex((section) => section.id === pageId);
          if (idx > 0) {
            setSections((prev) => arrayMove(prev, idx, 0));
            setActivePageIdx(0);
          }
        }}
        onAddPage={addPage}
        onFlowChange={handleLogicFlowChange}
      />

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

      <RenameModal defaultName="My form" title="Rename your form"
        isOpen={welcomeRename}
        required
        onClose={() => {}}
        isLoading={isUpdatingMeta || createEvent.isPending}
        onCreate={async (name) => {
          if (!id) return;
          setIsUpdatingMeta(true);
          try {
            if (id === "new") {
              const event = await createEvent.mutateAsync({
                name,
                theme: pendingTheme,
              });
              const nextSections = event.sections?.length
                ? event.sections
                : sections;
              setFormTitle(name);
              setActiveTheme(pendingTheme);
              setWelcomeThemePicker(false);
              setWelcomeRename(false);
              setInitialized(false);
              navigate(`/forms/${event.id}/edit`, {
                replace: true,
                state: {
                  bannerColor: event.color ?? bannerColor,
                  bannerImage: event.image ?? bannerImage,
                  formTitle: name,
                  sections: nextSections,
                  theme: pendingTheme,
                },
              });
              return;
            }

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
              onClick={(event) => event.stopPropagation()}
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
        {showShareToast && (
          <ShareToast
            url={publicFormUrl}
            onClose={() => setShowShareToast(false)}
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

      <ConfirmModal
        isOpen={confirmDeletePageIdx !== null}
        title="Delete Section"
        description="Are you sure? This section will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setConfirmDeletePageIdx(null)}
        onConfirm={() => {
          const idx = confirmDeletePageIdx!;
          const target = sections[idx];
          if (target?.pageType === "ending") {
            const endingCount = sections.filter(
              (section) => section.pageType === "ending",
            ).length;
            if (endingCount <= 1) {
              setConfirmDeletePageIdx(null);
              setDeleteErrorOpen(true);
              return;
            }
          }

          const sectionId = target?.id;
          if (sectionId) deletedSectionIdsRef.current.push(sectionId);

          setSections((prev) => prev.filter((_, index) => index !== idx));
          setActivePageIdx((pageIdx) => Math.max(0, pageIdx >= idx ? pageIdx - 1 : pageIdx));
          setSelectedId(null);
          setConfirmDeletePageIdx(null);
        }}
      />

      <StatusModal
        isOpen={deleteErrorOpen}
        onClose={() => setDeleteErrorOpen(false)}
        type="error"
        title="Cannot Delete"
        description="A form must have at least one ending section."
        buttonText="OK"
        onButtonClick={() => setDeleteErrorOpen(false)}
      />

      <LoadingModal
        isOpen={isChangingStatus || isPublishing}
        title="Processing..."
        description="Please wait a moment while we process your request."
      />

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

      {isThemeImagePositionOpen ? (
        <ThemeImagePositionModal
          imageUrl={themeConfig.formImageUrl}
          isOpen
          value={{
            x: themeConfig.formImagePositionX,
            y: themeConfig.formImagePositionY,
          }}
          onClose={() => setIsThemeImagePositionOpen(false)}
          onSave={({ x, y }) => {
            const resolved = resolveTheme(activeTheme);
            setActiveTheme(
              serializeCustomTheme(
                resolved.sourceKey,
                getThemeCustomConfig({
                  ...resolved.config,
                  formImagePositionX: x,
                  formImagePositionY: y,
                }),
              ),
            );
          }}
        />
      ) : null}

      {showBgImageModal && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/40"
          onClick={() => setShowBgImageModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-80 p-5 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Adjust image
              </p>
              <button
                onClick={() => setShowBgImageModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <XIcon size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Change background image for this page
            </p>
            {coverBgImage && (
              <div className="relative rounded-sm overflow-hidden border border-gray-200 h-32">
                <img
                  src={coverBgImage}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setCoverBgImage(null);
                    setSections((prev) =>
                      prev.map((section) =>
                        section.pageType === "cover"
                          ? {
                              ...section,
                              settings: { ...section.settings, coverBgImage: null },
                            }
                          : section,
                      ),
                    );
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <TrashIcon size={11} />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsCoverBgPickerOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ImageIcon size={13} />
              {coverBgImage ? "Change image" : "Add image"}
            </button>
            <button
              onClick={() => setShowBgImageModal(false)}
              className="w-full py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <ImagePickerModal
        isOpen={isCoverBgPickerOpen}
        showIconTab={false}
        onClose={() => setIsCoverBgPickerOpen(false)}
        onSelect={(url) => {
          setCoverBgImage(url);
          setSections((prev) =>
            prev.map((section) =>
              section.pageType === "cover"
                ? {
                    ...section,
                    settings: { ...section.settings, coverBgImage: url },
                  }
                : section,
            ),
          );
        }}
      />

        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg ${
                toastType === "error"
                  ? "bg-red-600"
                  : toastType === "info"
                    ? "bg-slate-900"
                    : "bg-gray-900"
              }`}
            >
              {toastType === "info" ? (
                <Spinner size={12} className="text-sky-300" />
              ) : (
                <FloppyDiskIcon
                  size={12}
                  weight="bold"
                  className={
                    toastType === "error" ? "text-red-200" : "text-emerald-400"
                  }
                />
              )}
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ReferenceCalculationProvider>
  );
}

import { useRef, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import SendFormModal from "./SendFormModal";
import {
  PublishSharePrompt,
  QrCodeModal,
  ShareLinkCard,
  ShareTabPanel,
} from "./components";
import { EmbedSettingsModal } from "./embed";
import type {
  BuilderSharePanelProps,
  EmbedType,
  ShareTab,
  SubmitSettingsEditorState,
} from "@/types/builderShare";

export default function BuilderSharePanel({
  activeTheme,
  eventId,
  eventStatus,
  formTitle,
  isDirty,
  isPublishing,
  onSubmitSettingsStateChange,
  onPublish,
  publicFormUrl,
  sections = [],
  showToast,
}: BuilderSharePanelProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>("embed");
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedType | null>(
    null,
  );
  const [showQR, setShowQR] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const isPublished = eventStatus === "active";

  const handleSubmitSettingsStateChange = (state: SubmitSettingsEditorState) => {
    onSubmitSettingsStateChange?.(state);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicFormUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast?.("Failed to copy link", "error");
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "form-qr.png";
    link.click();
  };

  if (!isPublished) {
    return (
      <PublishSharePrompt
        eventStatus={eventStatus}
        isDirty={isDirty}
        isPublishing={isPublishing}
        onPublish={onPublish}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-7xl px-8 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-950">Share</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            <CheckCircleIcon size={15} weight="fill" />
            Ready to share
          </span>
        </div>
        <p className="mt-4 text-lg text-gray-500">
          Share <span className="font-semibold text-gray-700">{formTitle}</span>{" "}
          with others.
        </p>

        <ShareLinkCard
          copied={copied}
          publicFormUrl={publicFormUrl}
          showToast={showToast}
          onCopy={copyLink}
          onShowQr={() => setShowQR(true)}
        />

        <ShareTabPanel
          activeTab={activeTab}
          activeTheme={activeTheme}
          eventId={eventId}
          formTitle={formTitle}
          onOpenEmailComposer={() => setShowSendModal(true)}
          onSelectEmbedType={setSelectedEmbedType}
          onSubmitSettingsStateChange={handleSubmitSettingsStateChange}
          onTabChange={setActiveTab}
          sections={sections}
          showToast={showToast}
        />
      </div>

      {selectedEmbedType ? (
        <EmbedSettingsModal
          publicFormUrl={publicFormUrl}
          type={selectedEmbedType}
          showToast={showToast}
          onClose={() => setSelectedEmbedType(null)}
        />
      ) : null}

      <SendFormModal
        activeTheme={activeTheme}
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        eventId={eventId}
        formTitle={formTitle}
        publicFormUrl={publicFormUrl}
        sections={sections}
        showToast={showToast}
      />

      {showQR ? (
        <QrCodeModal
          ref={qrRef}
          publicFormUrl={publicFormUrl}
          showToast={showToast}
          onClose={() => setShowQR(false)}
          onDownload={downloadQR}
        />
      ) : null}
    </div>
  );
}

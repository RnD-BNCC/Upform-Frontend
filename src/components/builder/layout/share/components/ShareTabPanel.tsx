import {
  EnvelopeSimpleIcon,
  MonitorIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import EmailActivityPanel from "../email-activity/EmailActivityPanel";
import BrowserIllustration from "../embed/BrowserIllustration";
import SubmitFormPanel from "./SubmitFormPanel";
import type { FormSection } from "@/types/form";
import type {
  EmbedType,
  ShareTab,
  ShareToast,
  SubmitSettingsEditorState,
} from "@/types/builderShare";

const EMBED_TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "popup", label: "Popup" },
  { value: "fullscreen", label: "Full screen" },
  { value: "slider", label: "Slider" },
] as const;

type ShareTabPanelProps = {
  activeTab: ShareTab;
  activeTheme?: string;
  eventId: string;
  formTitle: string;
  onOpenEmailComposer: () => void;
  onSelectEmbedType: (type: EmbedType) => void;
  onSubmitSettingsStateChange?: (state: SubmitSettingsEditorState) => void;
  onTabChange: (tab: ShareTab) => void;
  sections: FormSection[];
  showToast?: ShareToast;
};

export default function ShareTabPanel({
  activeTab,
  activeTheme,
  eventId,
  formTitle,
  onOpenEmailComposer,
  onSelectEmbedType,
  onSubmitSettingsStateChange,
  onTabChange,
  sections,
  showToast,
}: ShareTabPanelProps) {
  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900">Other</h2>

      <div className="mt-5 overflow-hidden rounded-sm border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="inline-flex rounded-sm border border-gray-200 bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => onTabChange("embed")}
              className={`flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors ${
                activeTab === "embed"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MonitorIcon size={16} />
              Embed form
            </button>
            <button
              type="button"
              onClick={() => onTabChange("send")}
              className={`flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors ${
                activeTab === "send"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <EnvelopeSimpleIcon size={16} weight="fill" />
              Send form
            </button>
            <button
              type="button"
              onClick={() => onTabChange("submit")}
              className={`flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors ${
                activeTab === "submit"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <PaperPlaneTiltIcon size={16} weight="fill" />
              Submit Form
            </button>
          </div>
        </div>

        {activeTab === "embed" ? (
          <div className="bg-gray-50/70 p-6">
            <p className="text-sm text-gray-400">
              Embed your form anywhere. Choose an embed type.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {EMBED_TYPE_OPTIONS.map((option) => {
                const type = option.value as EmbedType;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onSelectEmbedType(type)}
                    className="overflow-hidden rounded-sm border border-gray-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="flex h-40 items-center justify-center bg-gray-50 p-4">
                      <BrowserIllustration type={type} />
                    </div>
                    <div className="border-t border-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-800">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "send" ? (
          <div className="bg-gray-50/70 p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
              <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-gray-100 text-gray-600">
                  <EnvelopeSimpleIcon size={22} weight="fill" />
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  Send form by email
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Compose a custom email blast and send the form link to your
                  recipients.
                </p>
                <button
                  type="button"
                  onClick={onOpenEmailComposer}
                  className="mt-5 flex h-10 items-center gap-2 rounded-sm bg-gray-900 px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                >
                  <PaperPlaneTiltIcon size={15} weight="fill" />
                  Compose email
                </button>
              </div>

              <EmailActivityPanel eventId={eventId} />
            </div>
          </div>
        ) : null}

        <div className={activeTab === "submit" ? "block" : "hidden"}>
          <SubmitFormPanel
            activeTheme={activeTheme}
            eventId={eventId}
            formTitle={formTitle}
            isActive={activeTab === "submit"}
            onStateChange={onSubmitSettingsStateChange}
            sections={sections}
            showToast={showToast}
          />
        </div>
      </div>
    </div>
  );
}

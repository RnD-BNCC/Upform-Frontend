import { useMemo, useState } from "react";
import {
  ConfettiIcon,
  HashIcon,
  PlayIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useQuerySubmitFormSettings } from "@/api/email-blasts";
import { LotteryMachinePreviewIcon } from "@/components/icons";
import { Spinner } from "@/components/ui";
import {
  buildLotteryParticipants,
  getLotteryRequirements,
} from "@/utils/game";
import type { GamePanelProps } from "@/types/builderGame";
import LotteryPresenter from "./components/LotteryPresenter";

export default function LotteryCodeGameCard({
  eventId,
  responses,
}: GamePanelProps) {
  const [presenting, setPresenting] = useState(false);
  const settingsQuery = useQuerySubmitFormSettings(eventId, !!eventId);
  const settings = settingsQuery.data;
  const isCheckingSettings = !settingsQuery.isFetched && !settings;
  const participants = useMemo(() => {
    if (!settings) return [];
    return buildLotteryParticipants(responses, settings);
  }, [responses, settings]);
  const canPlay = Boolean(
    settings?.enabled && settings.raffleEnabled && participants.length > 0,
  );
  const sampleNumber = participants[0]?.number ?? "UF-0001";
  const requirements = getLotteryRequirements(settings, participants.length);
  const status = isCheckingSettings
    ? {
        className: "bg-gray-100 text-gray-500",
        label: "Checking setup",
      }
    : canPlay
      ? {
          className: "bg-emerald-100 text-emerald-700",
          label: "Ready",
        }
      : {
          className: "bg-amber-100 text-amber-700",
          label: "Needs setup",
        };

  return (
    <>
      <section className="group overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
        <div className="grid min-h-64 lg:grid-cols-[320px_minmax(0,1fr)_260px]">
          <div className="relative flex items-center justify-center border-b border-gray-100 bg-gray-50 p-6 lg:border-b-0 lg:border-r">
            <div className="absolute left-5 top-5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-500 shadow-sm">
              Lottery
            </div>
            <LotteryMachinePreviewIcon />
          </div>

          <div className="min-w-0 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-950">
                    Lottery Code
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {isCheckingSettings ? <Spinner size={10} /> : null}
                    {status.label}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                  Draw a random lottery code from submitted responses using the
                  numbering configured in Submit Form.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <UsersThreeIcon size={15} weight="fill" />
                  Entries
                </div>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {isCheckingSettings ? "-" : participants.length}
                </p>
              </div>
              <div className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <HashIcon size={15} weight="bold" />
                  Sample
                </div>
                <p className="mt-2 font-mono text-base font-semibold text-gray-900">
                  {isCheckingSettings ? "-" : sampleNumber}
                </p>
              </div>
              <div className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <ConfettiIcon size={15} weight="fill" />
                  Mode
                </div>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  Glass draw
                </p>
              </div>
            </div>

            {isCheckingSettings ? (
              <div className="mt-5 rounded-sm border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Spinner size={13} />
                  Checking Submit Form setup
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  Loading lottery settings before enabling the presenter.
                </p>
              </div>
            ) : !canPlay ? (
              <div className="mt-5 rounded-sm border border-amber-200 bg-amber-50/80 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <WarningCircleIcon size={15} weight="fill" />
                  Setup required
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {requirements.map((item) => (
                    <div
                      key={item.label}
                      className={`flex min-w-0 items-center gap-2 rounded-sm border bg-white/65 px-2.5 py-2 text-[11px] font-medium leading-snug ${
                        item.done
                          ? "border-emerald-100 text-emerald-700"
                          : "border-amber-100 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          item.done ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                      />
                      <span className="min-w-0">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between border-t border-gray-100 bg-gray-50 p-6 lg:border-l lg:border-t-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Presenter
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Glass lottery scene with keyboard controls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPresenting(true)}
              disabled={isCheckingSettings || !canPlay}
              className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {isCheckingSettings ? (
                <Spinner size={14} />
              ) : (
                <PlayIcon size={16} weight="fill" />
              )}
              {isCheckingSettings ? "Checking..." : "Open draw"}
            </button>
          </div>
        </div>
      </section>

      {presenting ? (
        <LotteryPresenter
          participants={participants}
          onClose={() => setPresenting(false)}
        />
      ) : null}
    </>
  );
}

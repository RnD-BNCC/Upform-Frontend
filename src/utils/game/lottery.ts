import type { SubmitFormSettings } from "@/types/api";
import type { FormResponse } from "@/types/form";

export type LotteryParticipant = {
  id: string;
  number: string;
  submittedAt: string;
};

export type LotteryRequirement = {
  done: boolean;
  label: string;
};

export type LotteryNumberSettings = Pick<
  SubmitFormSettings,
  "rafflePadding" | "rafflePrefix" | "raffleStart" | "raffleSuffix"
>;

export const LOTTERY_BALL_COLORS = [
  "#e53935",
  "#1e88e5",
  "#f4a020",
  "#43a047",
  "#8e24aa",
  "#00acc1",
  "#c62828",
  "#6d4c41",
  "#558b2f",
  "#283593",
  "#d81b60",
  "#00897b",
];

export function normalizeRafflePadding(value: number) {
  return Math.max(1, Math.min(10, Math.round(value) || 1));
}

export function normalizeRaffleStart(value: number) {
  return Math.max(0, Math.round(value) || 0);
}

export function buildLotteryNumber(index: number, settings: LotteryNumberSettings) {
  const start = normalizeRaffleStart(settings.raffleStart);
  const number = String(start + index).padStart(
    normalizeRafflePadding(settings.rafflePadding),
    "0",
  );

  return `${settings.rafflePrefix}${number}${settings.raffleSuffix}`;
}

export function buildLotteryParticipants(
  responses: FormResponse[],
  settings: LotteryNumberSettings,
): LotteryParticipant[] {
  return [...responses]
    .sort(
      (left, right) =>
        new Date(left.submittedAt).getTime() -
        new Date(right.submittedAt).getTime(),
    )
    .map((response, index) => ({
      id: response.id,
      number: buildLotteryNumber(index, settings),
      submittedAt: response.submittedAt,
    }));
}

export function getLotteryRequirements(
  settings: SubmitFormSettings | null | undefined,
  participantCount: number,
): LotteryRequirement[] {
  return [
    { done: Boolean(settings?.enabled), label: "Submit Form is enabled" },
    { done: Boolean(settings?.raffleEnabled), label: "Lottery numbers are enabled" },
    { done: participantCount > 0, label: "Has submitted responses" },
  ];
}

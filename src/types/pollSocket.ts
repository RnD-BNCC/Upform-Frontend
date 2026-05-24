import type { PollStatus } from "@/types/polling";

export type PollSocketError = {
  code: string;
  message: string;
};

export type PollSocketAck<T> =
  | ({ ok: true } & T)
  | { error: PollSocketError; ok: false };

export type PollNegotiation = {
  currentSlide: number;
  pollId: string;
  status: PollStatus;
};

export type PollJoinGroup = {
  participantCount: number;
  pollId: string;
  room: string;
};

import type { Socket } from "socket.io-client";
import type { QAResult } from "@/types/polling";
import type {
  PollJoinGroup,
  PollNegotiation,
  PollSocketAck,
} from "@/types/pollSocket";

const ACK_TIMEOUT_MS = 5000;

type PollStatePayload = {
  currentSlide?: number;
  pollId: string;
  status?: string;
};

type ParticipantPayload = {
  avatarSeed?: string;
  name: string;
  participantId: string;
  pollId: string;
};

type QuestionSubmitPayload = {
  authorId: string;
  authorName: string;
  pollId: string;
  text: string;
};

type QuestionLikePayload = {
  like: boolean;
  pollId: string;
  questionId: string;
  userId: string;
};

type QAHighlightPayload = {
  pollId: string;
  question?: QAResult[number] | null;
  slideId?: string;
  voteId: string | null;
};

const emitPoll = (
  socket: Socket | null | undefined,
  event: string,
  payload: { pollId: string } & Record<string, unknown>,
) => {
  socket?.emit(event, payload);
};

function timeoutError(event: string): PollSocketAck<never> {
  return {
    ok: false,
    error: {
      code: "SOCKET_ACK_TIMEOUT",
      message: `${event} did not respond in time.`,
    },
  };
}

function emitWithAck<T>(
  socket: Socket,
  event: string,
  payload: { pollId: string },
) {
  return new Promise<PollSocketAck<T>>((resolve) => {
    socket.timeout(ACK_TIMEOUT_MS).emit(
      event,
      payload,
      (error: Error | null, response?: PollSocketAck<T>) => {
        if (error) {
          resolve(timeoutError(event));
          return;
        }

        resolve(
          response ?? {
            ok: false,
            error: {
              code: "SOCKET_ACK_EMPTY",
              message: `${event} returned an empty acknowledgement.`,
            },
          },
        );
      },
    );
  });
}

export function negotiatePoll(socket: Socket, pollId: string) {
  return emitWithAck<PollNegotiation>(socket, "negotiate-poll", { pollId });
}

export function joinPollGroup(socket: Socket, pollId: string) {
  return emitWithAck<PollJoinGroup>(socket, "join-poll", { pollId });
}

export function leavePollGroup(socket: Socket, pollId: string) {
  emitPoll(socket, "leave-poll", { pollId });
}

export function joinParticipant(socket: Socket | null | undefined, payload: ParticipantPayload) {
  socket?.emit("join-participant", payload);
}

export function broadcastCountdown(socket: Socket | null | undefined, pollId: string, count: number) {
  emitPoll(socket, "broadcast-countdown", { pollId, count });
}

export function broadcastRevealAnswer(socket: Socket | null | undefined, pollId: string) {
  emitPoll(socket, "broadcast-reveal-answer", { pollId });
}

export function broadcastPollState(socket: Socket | null | undefined, payload: PollStatePayload) {
  socket?.emit("broadcast-poll-state", payload);
}

export function startPollTimer(
  socket: Socket | null | undefined,
  pollId: string,
  duration: number,
  startedAt = Date.now(),
) {
  socket?.emit("timer-start", { pollId, duration, startedAt });
  return startedAt;
}

export function stopPollTimer(socket: Socket | null | undefined, pollId: string) {
  emitPoll(socket, "timer-stop", { pollId });
}

export function showPollLeaderboard(socket: Socket | null | undefined, pollId: string) {
  emitPoll(socket, "broadcast-leaderboard", { pollId });
}

export function hidePollLeaderboard(socket: Socket | null | undefined, pollId: string) {
  emitPoll(socket, "hide-leaderboard", { pollId });
}

export function resetPollScores(socket: Socket | null | undefined, pollId: string) {
  emitPoll(socket, "reset-scores", { pollId });
}

export function highlightQAQuestion(socket: Socket | null | undefined, payload: QAHighlightPayload) {
  socket?.emit("qa-highlight", payload);
}

export function submitQuestion(socket: Socket | null | undefined, payload: QuestionSubmitPayload) {
  socket?.emit("question:submit", payload);
}

export function toggleQuestionLike(socket: Socket | null | undefined, payload: QuestionLikePayload) {
  socket?.emit("question:like", payload);
}

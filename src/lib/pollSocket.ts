import type { Socket } from "socket.io-client";
import type {
  PollJoinGroup,
  PollNegotiation,
  PollSocketAck,
} from "@/types/pollSocket";

const ACK_TIMEOUT_MS = 5000;

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
  socket.emit("leave-poll", { pollId });
}

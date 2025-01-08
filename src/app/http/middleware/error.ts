import { Stream } from "node:stream";
import { OnSend } from "src/app/http/server";

const unexpectedError: Buffer | string | null | Stream = JSON.stringify({
  error: "Something went wrong",
  statusCode: 500,
});

export const processError: OnSend = (request, reply, payload, next) => {
  // if 400 - it`s our error and we can provide it to user
  if (reply.statusCode < 500) {
    next(null, payload);
    return;
  }

  // if status >= 500 - it's system error and we can't provide it to user
  reply.code(500);
  next(null, unexpectedError);
};

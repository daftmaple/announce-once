import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";

import { wait } from "../../helpers";
import { type ShoutoutOutput } from "../../validator";
import type { MessageScope } from "../type";

export const shoutoutOutputHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope,
  outputTrigger: ShoutoutOutput
) => {
  const { delay } = outputTrigger;

  if (delay) {
    await wait(delay);
  }

  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

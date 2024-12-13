import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";

import { wait } from "../../helpers";
import type { AnnounceOutput } from "../../validator";
import type { MessageScope } from "../type";
import { shouldRunCommand } from "../utilities/cooldown";
import { messageFormatter } from "../utilities/message";

export const announceOutputHandler = async (
  apiClient: BaseApiClient,
  context: MessageScope,
  inputKey: string,
  outputTrigger: AnnounceOutput
) => {
  const { channel } = context;
  const { message, cooldown, color, delay } = outputTrigger;

  if (delay) {
    await wait(delay);
  }

  // Check timer, if cooldown is not defined, defaults to 10 seconds
  if (shouldRunCommand(channel.id, inputKey, cooldown ?? 10)) {
    await apiClient.chat.sendAnnouncement(channel.id, {
      message: messageFormatter(message, context),
      color,
    });
  }
};

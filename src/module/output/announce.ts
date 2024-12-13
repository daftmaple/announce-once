import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { shouldRunCommand } from "../utilities/cooldown";
import { wait } from "../../helpers";
import { MessageScope, messageFormatter } from "../../message";
import { AnnounceOutput } from "../../validator";

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

import type { ChatClient } from "@twurple/chat";

import { wait } from "../../helpers";
import type { SayOutput } from "../../validator";
import type { MessageScope } from "../type";
import { shouldRunCommand } from "../utilities/cooldown";
import { messageFormatter } from "../utilities/message";

export const sayOutputHandler = async (
  chatClient: ChatClient,
  context: MessageScope,
  inputKey: string,
  outputTrigger: SayOutput
) => {
  const { channel } = context;
  const { message, cooldown, delay } = outputTrigger;

  if (delay) {
    await wait(delay);
  }

  let shouldSay = true;

  // Check timer if cooldown specified
  if (cooldown) {
    shouldSay = shouldRunCommand(channel.id, inputKey, cooldown);
  }

  if (shouldSay) {
    await chatClient.say(channel.name, messageFormatter(message, context));
  }
};

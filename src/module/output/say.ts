import { ChatClient } from "@twurple/chat";
import { shouldRunCommand } from "../utilities/cooldown";
import { wait } from "../../helpers";
import { MessageScope, messageFormatter } from "../../message";
import { SayOutput } from "../../validator";

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

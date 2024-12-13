import { ChatSubInfo, UserNotice } from "@twurple/chat";
import { convertSubType } from "../../helpers";
import { MessageScope } from "../../message";
import { SubTrigger } from "../../validator";
import { announceOutputHandler } from "../output/announce";
import { sayOutputHandler } from "../output/say";
import { Client } from "../type";

export const subInputHandler =
  (client: Client, trigger: SubTrigger) =>
  async (
    channel: string,
    user: string,
    subInfo: ChatSubInfo,
    msg: UserNotice
  ) => {
    const { apiClient, chatClient } = client;
    const { type } = trigger.output;

    // Compose MessageScope object
    if (!msg.channelId) {
      console.error("Missing channelId on msg (UserNotice)");
      return;
    }

    const messageScope: MessageScope = {
      channel: {
        id: msg.channelId,
        name: channel,
      },
      user: {
        id: msg.userInfo.userId,
        name: user,
      },
      subInfo: {
        plan: convertSubType(subInfo.plan),
        streak: subInfo.streak,
      },
    };

    const inputKey = `${trigger.input.type}-${user}`;

    if (type === "announce") {
      await announceOutputHandler(
        apiClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }

    if (type === "say") {
      await sayOutputHandler(
        chatClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }
  };

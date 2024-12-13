import type { ChatRaidInfo, UserNotice } from "@twurple/chat";

import type { RaidTrigger } from "../../validator";
import { announceOutputHandler } from "../output/announce";
import { sayOutputHandler } from "../output/say";
import { shoutoutOutputHandler } from "../output/shoutout";
import type { Client, MessageScope } from "../type";

export const raidInputHandler =
  (client: Client, trigger: RaidTrigger) =>
  async (
    channel: string,
    user: string,
    raidInfo: ChatRaidInfo,
    msg: UserNotice
  ) => {
    const { apiClient, chatClient } = client;
    const { minViewer } = trigger.input;
    const { type } = trigger.output;

    // Do not shoutout if minViewer is set and raider count is strictly lower than minimum viewer
    if (typeof minViewer === "number" && raidInfo.viewerCount < minViewer)
      return;

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
    };

    const inputKey = `${trigger.input.type}-${user}`;

    if (type === "shoutout") {
      await shoutoutOutputHandler(apiClient, messageScope);
    }

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

import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import {
  AnnounceAsOutput,
  MessageAsInputTrigger,
  RaidAsInputTrigger,
  ShoutoutAsOutput,
} from "./validator";
import { shouldRunCommand } from "./cooldown";
import {
  ChatClient,
  ChatMessage,
  ChatRaidInfo,
  UserNotice,
} from "@twurple/chat";

type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

type UserContext = {
  channel: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
};

const announceHandler = async (
  apiClient: BaseApiClient,
  { channel }: UserContext,
  outputTrigger: AnnounceAsOutput
) => {
  const { message, cooldown, color } = outputTrigger;

  // Check timer
  if (shouldRunCommand(channel.id, message, cooldown ?? 10)) {
    await apiClient.chat.sendAnnouncement(channel.id, {
      message,
      color,
    });
  }
};

const shoutoutHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: UserContext
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

export const messageHandler =
  (client: Client, trigger: MessageAsInputTrigger) =>
  async (channel: string, user: string, text: string, msg: ChatMessage) => {
    const { apiClient } = client;
    const { type } = trigger.output;

    /**
     * Check input condition:
     * - If input text is matching the trigger text
     * - Check text message's user privilege (TODO: to add as check)
     */
    if (trigger.input.text !== text) return;
    if (!(msg.userInfo.isBroadcaster || msg.userInfo.isMod)) return;

    // Compose userContext object
    if (!msg.channelId) return;

    const userContext: UserContext = {
      channel: {
        id: msg.channelId,
        name: channel,
      },
      user: {
        id: msg.userInfo.userId,
        name: user,
      },
    };

    if (type === "announce") {
      await announceHandler(apiClient, userContext, trigger.output);
    }
  };

export const raidHandler =
  (client: Client, trigger: RaidAsInputTrigger) =>
  async (
    channel: string,
    user: string,
    raidInfo: ChatRaidInfo,
    msg: UserNotice
  ) => {
    const { apiClient } = client;
    const { minViewer } = trigger.input;
    const { type } = trigger.output;

    // Do not shoutout if minViewer is set and raider count is strictly lower than minimum viewer
    if (typeof minViewer === "number" && raidInfo.viewerCount < minViewer)
      return;

    // Compose userContext object
    if (!msg.channelId) return;

    const userContext: UserContext = {
      channel: {
        id: msg.channelId,
        name: channel,
      },
      user: {
        id: msg.userInfo.userId,
        name: user,
      },
    };

    if (type === "shoutout") {
      await shoutoutHandler(apiClient, userContext, trigger.output);
    }

    if (type === "announce") {
      await announceHandler(apiClient, userContext, trigger.output);
    }
  };

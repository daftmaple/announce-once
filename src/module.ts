import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import {
  AnnounceOutput,
  MessageTrigger,
  RaidTrigger,
  ShoutoutOutput,
} from "./validator";
import { shouldRunCommand } from "./cooldown";
import {
  ChatClient,
  ChatMessage,
  ChatRaidInfo,
  UserNotice,
} from "@twurple/chat";
import { messageFormatter, MessageScope } from "./message";

type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

const announceHandler = async (
  apiClient: BaseApiClient,
  context: MessageScope,
  outputTrigger: AnnounceOutput
) => {
  const { channel } = context;
  const { message, cooldown, color } = outputTrigger;

  // Check timer
  if (shouldRunCommand(channel.id, message, cooldown ?? 10)) {
    await apiClient.chat.sendAnnouncement(channel.id, {
      message: messageFormatter(message, context),
      color,
    });
  }
};

const shoutoutHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope,
  _outputTrigger: ShoutoutOutput
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

export const messageHandler =
  (client: Client, trigger: MessageTrigger) =>
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

    // Compose MessageScope object
    if (!msg.channelId) {
      console.error("Missing channelId on msg (ChatMessage)");
      return;
    }

    const MessageScope: MessageScope = {
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
      await announceHandler(apiClient, MessageScope, trigger.output);
    }
  };

export const raidHandler =
  (client: Client, trigger: RaidTrigger) =>
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

    // Compose MessageScope object
    if (!msg.channelId) {
      console.error("Missing channelId on msg (UserNotice)");
      return;
    }

    const MessageScope: MessageScope = {
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
      await shoutoutHandler(apiClient, MessageScope, trigger.output);
    }

    if (type === "announce") {
      await announceHandler(apiClient, MessageScope, trigger.output);
    }
  };

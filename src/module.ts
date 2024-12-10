import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import type {
  AnnounceOutput,
  MessageTrigger,
  RaidTrigger,
  Role,
  SayOutput,
  ShoutoutOutput,
} from "./validator";
import { shouldRunCommand } from "./cooldown";
import type {
  ChatClient,
  ChatMessage,
  ChatRaidInfo,
  ChatUser,
  UserNotice,
} from "@twurple/chat";
import { type MessageScope, messageFormatter } from "./message";
import { wait } from "./helpers";

type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

const announceOutputHandler = async (
  apiClient: BaseApiClient,
  context: MessageScope,
  outputTrigger: AnnounceOutput
) => {
  const { channel } = context;
  const { message, cooldown, color, delay } = outputTrigger;

  if (delay) {
    await wait(delay);
  }

  // Check timer
  if (shouldRunCommand(channel.id, message, cooldown ?? 10)) {
    await apiClient.chat.sendAnnouncement(channel.id, {
      message: messageFormatter(message, context),
      color,
    });
  }
};

const sayOutputHandler = async (
  chatClient: ChatClient,
  context: MessageScope,
  outputTrigger: SayOutput
) => {
  const { channel } = context;
  const { message, delay } = outputTrigger;

  if (delay) {
    await wait(delay);
  }

  // TODO: add a timer check to handle cooldown
  await chatClient.say(channel.name, messageFormatter(message, context));
};

const shoutoutOutputHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope,
  _outputTrigger: ShoutoutOutput
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

const checkValidUser = (user: ChatUser, permission: Role[]): boolean => {
  // Surely there should be a cleaner way to do this
  if (user.isBroadcaster && permission.includes("broadcaster")) return true;
  if (user.isMod && permission.includes("mod")) return true;
  if (user.isVip && permission.includes("vip")) return true;
  if (user.isSubscriber && permission.includes("subscriber")) return true;
  if (user.isFounder && permission.includes("founder")) return true;
  if (user.isArtist && permission.includes("artist")) return true;

  // Since non-subscriber is the most basic user in chat. Sadly, follower object is not available on ChatUser
  return permission.includes("non-subscriber");
};

export const messageHandler =
  (client: Client, trigger: MessageTrigger) =>
  async (channel: string, user: string, text: string, msg: ChatMessage) => {
    const { apiClient, chatClient } = client;
    const { type } = trigger.output;

    /**
     * Check input condition:
     * - If input text is matching the trigger text
     * - Check text message's user privilege
     */
    if (trigger.input.text !== text) return;
    if (!checkValidUser(msg.userInfo, trigger.input.role)) return;

    // Compose MessageScope object
    if (!msg.channelId) {
      console.error("Missing channelId on msg (ChatMessage)");
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

    if (type === "announce") {
      await announceOutputHandler(apiClient, messageScope, trigger.output);
    }

    if (type === "say") {
      await sayOutputHandler(chatClient, messageScope, trigger.output);
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

    if (type === "shoutout") {
      await shoutoutOutputHandler(apiClient, messageScope, trigger.output);
    }

    if (type === "announce") {
      await announceOutputHandler(apiClient, messageScope, trigger.output);
    }

    if (type === "say") {
      await sayOutputHandler(chatClient, messageScope, trigger.output);
    }
  };

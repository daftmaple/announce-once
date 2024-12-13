import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import type {
  AnnounceOutput,
  MessageTrigger,
  RaidTrigger,
  Role,
  SayOutput,
  ShoutoutOutput,
  SubTrigger,
} from "./validator";
import { shouldRunCommand } from "./cooldown";
import type {
  ChatClient,
  ChatMessage,
  ChatRaidInfo,
  ChatSubInfo,
  ChatUser,
  UserNotice,
} from "@twurple/chat";
import { type MessageScope, messageFormatter } from "./message";
import { convertSubType, wait } from "./helpers";

type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

const announceOutputHandler = async (
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

const sayOutputHandler = async (
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
      const inputKey = `${trigger.input.type}-${trigger.input.text}`;
      await announceOutputHandler(
        apiClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }

    if (type === "say") {
      const inputKey = `${trigger.input.type}-${trigger.input.text}`;
      await sayOutputHandler(
        chatClient,
        messageScope,
        inputKey,
        trigger.output
      );
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
      const inputKey = `${trigger.input.type}-${user}`;
      await announceOutputHandler(
        apiClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }

    if (type === "say") {
      const inputKey = `${trigger.input.type}-${user}`;
      await sayOutputHandler(
        chatClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }
  };

export const subHandler =
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

    if (type === "announce") {
      const inputKey = `${trigger.input.type}-${channel}`;
      await announceOutputHandler(
        apiClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }

    if (type === "say") {
      const inputKey = `${trigger.input.type}-${user}`;
      await sayOutputHandler(
        chatClient,
        messageScope,
        inputKey,
        trigger.output
      );
    }
  };

import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { MessageAsInputTrigger, RaidAsInputTrigger } from "./validator";
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

export const messageHandler =
  (client: Client, trigger: MessageAsInputTrigger) =>
  async (_channel: string, _user: string, text: string, msg: ChatMessage) => {
    const { apiClient } = client;
    const { type } = trigger.output;

    if (type === "announce") {
      const { message, cooldown, color } = trigger.output;

      // Need channelId to execute API call or message
      if (!msg.channelId) return;
      const channelId = msg.channelId;

      /**
       * Check conditions:
       * - Message is matching
       * - Check text message's user privilege
       */
      if (trigger.input.text !== text) return;
      if (!(msg.userInfo.isBroadcaster || msg.userInfo.isMod)) return;

      // Check timer
      if (shouldRunCommand(msg.channelId, message, cooldown ?? 10)) {
        await apiClient.chat.sendAnnouncement(channelId, {
          message,
          color,
        });
      }
    }
  };

export const raidHandler =
  (client: Client, trigger: RaidAsInputTrigger) =>
  async (
    _channel: string,
    _user: string,
    raidInfo: ChatRaidInfo,
    msg: UserNotice
  ) => {
    const { apiClient } = client;
    const { minViewer } = trigger.input;
    const { type } = trigger.output;

    // Do not shoutout if minViewer is set and raider count is strictly lower than minimum viewer
    if (typeof minViewer === "number" && raidInfo.viewerCount < minViewer)
      return;

    if (type === "shoutout") {
      // Do not shoutout if minViewer is set and raider count is strictly lower than minimum viewer
      if (typeof minViewer === "number" && raidInfo.viewerCount < minViewer)
        return;

      if (msg.channelId && msg.userInfo.userId) {
        /**
         * If broadcaster is not live, this api call will throw error, hence wrapped with try-catch
         */
        try {
          await apiClient.chat.shoutoutUser(msg.channelId, msg.userInfo.userId);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

import type { ChatMessage, ChatUser } from "@twurple/chat";

import type { MessageMatcher, MessageTrigger, Role } from "../../validator";
import { announceOutputHandler } from "../output/announce";
import { sayOutputHandler } from "../output/say";
import type { Client, MessageScope } from "../type";

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

/**
 * Match string
 * If message matcher type is not defined, defaults to startsWith
 */
const matchString = (matcher: MessageMatcher, text: string): boolean => {
  let caseSensitive = true;
  if (typeof matcher.caseSensitive !== "undefined") {
    caseSensitive = matcher.caseSensitive;
  }

  const matcherText = caseSensitive ? matcher.text : matcher.text.toLowerCase();
  const textToMatch = caseSensitive ? text : text.toLowerCase();

  if (matcher.type === "exact") {
    return textToMatch === matcherText;
  }

  if (matcher.type === "includes") {
    return textToMatch.includes(matcherText);
  }

  return textToMatch.startsWith(matcherText);
};

export const messageInputHandler =
  (client: Client, trigger: MessageTrigger) =>
  async (channel: string, user: string, text: string, msg: ChatMessage) => {
    const { apiClient, chatClient } = client;
    const { type } = trigger.output;

    /**
     * Check input condition:
     * - If input text is matching the trigger text
     * - Check text message's user privilege
     */
    if (!matchString(trigger.input.message, text)) return;
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

    const inputKey = `${trigger.input.type}-${trigger.input.message.text}`;

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

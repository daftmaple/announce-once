import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";

import { configSchema, tokensSchema } from "./validator";
import { shouldRunCommand } from "./cooldown";

/**
 * Initial validation
 */
const clientConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "config.json"), "utf-8")
);

const parsedClientConfig = configSchema.safeParse(clientConfig);

if (!parsedClientConfig.success) {
  throw parsedClientConfig.error;
}

const tokenData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "tokens.json"), "utf-8")
);

const parsedTokenData = tokensSchema.safeParse(tokenData);

if (!parsedTokenData.success) {
  throw parsedTokenData.error;
}

/**
 * Main function
 */
const main = async () => {
  const { clientId, clientSecret, botName, channels } = parsedClientConfig.data;

  /**
   * auth section
   */
  const authProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
  });

  authProvider.onRefresh(async (_userId, newTokenData) =>
    fs.writeFileSync(
      path.join(process.cwd(), `tokens.json`),
      JSON.stringify(newTokenData, null, 4),
      "utf-8"
    )
  );

  await authProvider.addUserForToken(parsedTokenData.data, ["chat"]);

  /**
   * api client section, used to obtain bot user id and later on for announcement api calls
   */
  const apiClient = new ApiClient({ authProvider });
  const user = await apiClient.users.getUserByName(botName);
  if (!user) {
    throw new Error("Invalid bot username");
  }

  /**
   * chat client section
   */
  const chatClient = new ChatClient({
    authProvider,
    channels: channels.map(({ channelName }) => channelName),
  });

  chatClient.connect();

  chatClient.onConnect(() => {
    console.log("Bot has been connected");
  });

  chatClient.onJoin((broadcasterName, botName) => {
    console.log(`Bot has joined ${broadcasterName} as ${botName}`);
  });

  chatClient.onMessage(async (currentChannelName, _user, text, msg) => {
    // Get matching channel from channels list
    const channelToTrigger = channels.find(
      ({ channelName }) => channelName === currentChannelName
    );

    if (channelToTrigger) {
      // Check text message's user privilege
      if (!(msg.userInfo.isBroadcaster || msg.userInfo.isMod)) return;

      // Get text message if match any trigger
      const triggerMessage = channelToTrigger.triggers.find(
        ({ command }) => command === text
      );

      if (triggerMessage) {
        const { message, color, cooldown } = triggerMessage;

        // Check timer
        if (shouldRunCommand(currentChannelName, text, cooldown ?? 10)) {
          // Send command to channel, we need to use apiClient.asUser: https://twurple.js.org/docs/auth/concepts/context-switching.html
          await apiClient.asUser(user.id, async (context) => {
            if (!msg.channelId) return;

            await context.chat.sendAnnouncement(msg.channelId, {
              message,
              color,
            });
          });
        }
      }
    }
  });

  chatClient.onRaid(
    async (currentChannelName, _raiderChannelName, raidInfo, msg) => {
      // Get matching channel from channels list
      const channelToTrigger = channels.find(
        ({ channelName }) => channelName === currentChannelName
      );

      // Send shoutout command to channel if shoutout is enabled
      if (channelToTrigger && channelToTrigger.shoutout.enabled) {
        const { minViewer } = channelToTrigger.shoutout;
        // Do not shoutout if minViewer is set and raider count is strictly lower than minimum viewer
        if (typeof minViewer === "number" && raidInfo.viewerCount < minViewer)
          return;

        await apiClient.asUser(user.id, async (context) => {
          if (msg.channelId && msg.userInfo.userId) {
            /**
             * If broadcaster is not live, this api call will throw error, hence wrapped with try-catch
             */
            try {
              await context.chat.shoutoutUser(
                msg.channelId,
                msg.userInfo.userId
              );
            } catch (e) {
              console.error(e);
            }
          }
        });
      }
    }
  );
};

main();

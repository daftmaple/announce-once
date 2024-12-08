import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";

import {
  configSchema,
  MessageAsInputTrigger,
  RaidAsInputTrigger,
  tokensSchema,
  Trigger,
} from "./validator";
import { messageHandler, raidHandler } from "./module";
import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";

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

  // Get asUser context since we need to send command to a channel as current user (asUser) https://twurple.js.org/docs/auth/concepts/context-switching.html
  const apiClientAsUser = await new Promise<BaseApiClient>((resolve) => {
    apiClient.asUser(user.id, async (context) => {
      resolve(context);
    });
  });

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

  chatClient.onMessage(async (currentChannelName, userName, text, msg) => {
    // Get matching channel from channels list
    const channelToTrigger = channels.find(
      ({ channelName }) => channelName === currentChannelName
    );

    if (channelToTrigger) {
      const filterMessageAsInputTrigger = (
        t: Trigger
      ): t is MessageAsInputTrigger => t.input.type === "message";

      // Get matching input trigger
      const triggers = channelToTrigger.triggers.filter(
        filterMessageAsInputTrigger
      );

      triggers.forEach(async (trigger) => {
        try {
          await messageHandler(
            { apiClient: apiClientAsUser, chatClient },
            trigger
          )(currentChannelName, userName, text, msg);
        } catch (e) {
          console.error(e);
        }
      });
    }
  });

  chatClient.onRaid(
    async (currentChannelName, raiderChannelName, raidInfo, msg) => {
      // Get matching channel from channels list
      const channelToTrigger = channels.find(
        ({ channelName }) => channelName === currentChannelName
      );

      // Send shoutout command to channel if shoutout is enabled
      if (channelToTrigger) {
        const filterRaidAsInputTrigger = (
          t: Trigger
        ): t is RaidAsInputTrigger => t.input.type === "raid";

        // Get matching input trigger
        const triggers = channelToTrigger.triggers.filter(
          filterRaidAsInputTrigger
        );

        triggers.forEach(async (trigger) => {
          try {
            await raidHandler(
              { apiClient: apiClientAsUser, chatClient },
              trigger
            )(currentChannelName, raiderChannelName, raidInfo, msg);
          } catch (e) {
            console.error(e);
          }
        });
      }
    }
  );
};

main();

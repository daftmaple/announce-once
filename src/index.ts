import fs from "fs";
import path from "path";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";

import {
  type MessageTrigger,
  type RaidTrigger,
  SubTrigger,
  type Trigger,
  configSchema,
  tokensSchema,
} from "./validator";
import { messageHandler, raidHandler, subHandler } from "./module";

/**
 * Initial validation
 */
const rawClientConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "config.json"), "utf-8")
);

const clientConfig = configSchema.parse(rawClientConfig);

const rawTokenData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "tokens.json"), "utf-8")
);

const initialTokenData = tokensSchema.parse(rawTokenData);

/**
 * Main function
 */
const main = async () => {
  const { clientId, clientSecret, botName, channels } = clientConfig;

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

  await authProvider.addUserForToken(initialTokenData, ["chat"]);

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

    // Do command if matching input type is detected
    if (channelToTrigger) {
      const filterMessageAsInputTrigger = (t: Trigger): t is MessageTrigger =>
        t.input.type === "message";

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

      // Do command if matching input type is detected
      if (channelToTrigger) {
        const filterRaidAsInputTrigger = (t: Trigger): t is RaidTrigger =>
          t.input.type === "raid";

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

  chatClient.onSub(async (currentChannelName, subscriberName, subInfo, msg) => {
    // Get matching channel from channels list
    const channelToTrigger = channels.find(
      ({ channelName }) => channelName === currentChannelName
    );

    // Do command if matching input type is detected
    if (channelToTrigger) {
      const filterSubAsInputTrigger = (t: Trigger): t is SubTrigger =>
        t.input.type === "sub";

      // Get matching input trigger
      const triggers = channelToTrigger.triggers.filter(
        filterSubAsInputTrigger
      );

      triggers.forEach(async (trigger) => {
        try {
          await subHandler({ apiClient: apiClientAsUser, chatClient }, trigger)(
            currentChannelName,
            subscriberName,
            subInfo,
            msg
          );
        } catch (e) {
          console.error(e);
        }
      });
    }
  });
};

main();

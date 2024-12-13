import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";

import type { MessageScope } from "../type";

export const shoutoutOutputHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

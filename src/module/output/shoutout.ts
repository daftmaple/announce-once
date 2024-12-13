import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { MessageScope } from "../../message";
import { ShoutoutOutput } from "../../validator";

export const shoutoutOutputHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope,
  _outputTrigger: ShoutoutOutput
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

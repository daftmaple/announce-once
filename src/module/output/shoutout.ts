import { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { ShoutoutOutput } from "../../validator";
import { MessageScope } from "../type";

export const shoutoutOutputHandler = async (
  apiClient: BaseApiClient,
  { channel, user }: MessageScope,
  _outputTrigger: ShoutoutOutput
) => {
  await apiClient.chat.shoutoutUser(channel.id, user.id);
};

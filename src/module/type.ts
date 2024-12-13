import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { ChatClient } from "@twurple/chat";

export type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

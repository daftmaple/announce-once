import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import type { ChatClient } from "@twurple/chat";

import type { SubType } from "../helpers";

export interface Client {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
}

export interface MessageScope {
  channel: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
  subInfo?: {
    plan: SubType;
    streak?: number;
  };
}

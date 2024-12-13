import type { BaseApiClient } from "@twurple/api/lib/client/BaseApiClient";
import { ChatClient } from "@twurple/chat";

import { SubType } from "../helpers";

export type Client = {
  apiClient: BaseApiClient;
  chatClient: ChatClient;
};

export type MessageScope = {
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
};

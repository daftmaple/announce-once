import { render } from "micromustache";
import { SubType } from "./helpers";

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

export const messageFormatter = (template: string, scope: MessageScope) =>
  render(template, scope);

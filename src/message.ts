import { render } from "micromustache";

export type MessageScope = {
  channel: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
};

export const messageFormatter = (template: string, scope: MessageScope) =>
  render(template, scope);

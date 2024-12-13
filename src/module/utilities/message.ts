import { render } from "micromustache";
import { MessageScope } from "../type";

export const messageFormatter = (template: string, scope: MessageScope) =>
  render(template, scope);

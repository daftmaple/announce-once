import { render } from "micromustache";

import type { MessageScope } from "../type";

export const messageFormatter = (template: string, scope: MessageScope) =>
  render(template, scope);

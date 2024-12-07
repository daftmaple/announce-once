import { z } from "zod";

export const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  channels: z.array(
    z.object({
      channelName: z.string(),
      triggers: z.array(
        z.object({
          command: z.string(),
          message: z.string(),
          cooldown: z.number().optional(),
          color: z
            .enum(["blue", "green", "orange", "purple", "primary"])
            .optional(),
        })
      ),
    })
  ),
  botName: z.string(),
});

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  obtainmentTimestamp: z.number(),
});

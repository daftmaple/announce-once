import { z } from "zod";

const messageKind = z.object({
  type: z.literal("message"),
  text: z.string(),
});

const raidKind = z.object({
  type: z.literal("raid"),
  minViewer: z.number().optional(),
});

const announcementKind = z.object({
  type: z.literal("announce"),
  message: z.string(),
  cooldown: z.number().optional(),
  color: z.enum(["blue", "green", "orange", "purple", "primary"]).optional(),
});

const shoutoutKind = z.object({
  type: z.literal("shoutout"),
});

const triggerKind = z.union([
  z.object({
    input: raidKind,
    output: z.union([announcementKind, shoutoutKind]),
  }),
  z.object({
    input: messageKind,
    output: announcementKind,
  }),
]);

export const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  channels: z.array(
    z.object({
      channelName: z.string(),
      triggers: z.array(triggerKind),
    })
  ),
  botName: z.string(),
});

// type Config = z.infer<typeof configSchema>;

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  obtainmentTimestamp: z.number(),
});

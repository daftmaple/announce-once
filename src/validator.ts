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

export type Announcement = z.infer<typeof announcementKind>;

const shoutoutKind = z.object({
  type: z.literal("shoutout"),
});

const raidAsInputTrigger = z.object({
  input: raidKind,
  output: z.union([announcementKind, shoutoutKind]),
});

export type RaidAsInputTrigger = z.infer<typeof raidAsInputTrigger>;

const messageAsInputTrigger = z.object({
  input: messageKind,
  output: announcementKind,
});

export type MessageAsInputTrigger = z.infer<typeof messageAsInputTrigger>;

const triggerKind = z.union([raidAsInputTrigger, messageAsInputTrigger]);

export type Trigger = z.infer<typeof triggerKind>;

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

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  obtainmentTimestamp: z.number(),
});

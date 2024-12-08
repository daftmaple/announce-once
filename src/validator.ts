import { z } from "zod";

/**
 * Input
 */
const messageKind = z.object({
  type: z.literal("message"),
  text: z.string(),
  role: z.array(
    z.enum(["broadcaster", "subscriber", "founder", "mod", "vip", "artist"])
  ),
});

export type MessageAsInput = z.infer<typeof messageKind>;

const raidKind = z.object({
  type: z.literal("raid"),
  minViewer: z.number().optional(),
});

/**
 * Output
 */
const announcementKind = z.object({
  type: z.literal("announce"),
  message: z.string(),
  cooldown: z.number().optional(),
  color: z.enum(["blue", "green", "orange", "purple", "primary"]).optional(),
});

export type AnnounceAsOutput = z.infer<typeof announcementKind>;

const shoutoutKind = z.object({
  type: z.literal("shoutout"),
});

export type ShoutoutAsOutput = z.infer<typeof shoutoutKind>;

const sayKind = z.object({
  type: z.literal("say"),
  message: z.string(),
  cooldown: z.number().optional(),
});

/**
 * Pairing
 */
const raidAsInputTrigger = z.object({
  input: raidKind,
  output: z.union([announcementKind, shoutoutKind, sayKind]),
});

export type RaidAsInputTrigger = z.infer<typeof raidAsInputTrigger>;

const messageAsInputTrigger = z.object({
  input: messageKind,
  output: z.union([announcementKind, sayKind]),
});

export type MessageAsInputTrigger = z.infer<typeof messageAsInputTrigger>;

/**
 * Schema
 */
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

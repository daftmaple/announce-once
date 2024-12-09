import { z } from "zod";

const role = [
  "broadcaster",
  "mod",
  "vip",
  "subscriber",
  "founder",
  "artist",
  "non-subscriber",
] as const;
export type Role = (typeof role)[number];

/**
 * Input
 */
const messageInput = z.object({
  type: z.literal("message"),
  text: z.string(),
  role: z.array(z.enum(role)),
});

export type MessageInput = z.infer<typeof messageInput>;

const raidInput = z.object({
  type: z.literal("raid"),
  minViewer: z.number().optional(),
});

/**
 * Output
 */
const announceOutput = z.object({
  type: z.literal("announce"),
  message: z.string(),
  cooldown: z.number().optional(),
  delay: z.number().optional(),
  color: z.enum(["blue", "green", "orange", "purple", "primary"]).optional(),
});

export type AnnounceOutput = z.infer<typeof announceOutput>;

const shoutoutOutput = z.object({
  type: z.literal("shoutout"),
  delay: z.number().optional(),
});

export type ShoutoutOutput = z.infer<typeof shoutoutOutput>;

const sayOutput = z.object({
  type: z.literal("say"),
  message: z.string(),
  cooldown: z.number().optional(),
  delay: z.number().optional(),
});

/**
 * Pairing
 */
const raidTrigger = z.object({
  input: raidInput,
  output: z.union([announceOutput, shoutoutOutput, sayOutput]),
});

export type RaidTrigger = z.infer<typeof raidTrigger>;

const messageTrigger = z.object({
  input: messageInput,
  output: z.union([announceOutput, sayOutput]),
});

export type MessageTrigger = z.infer<typeof messageTrigger>;

/**
 * Schema
 */
const trigger = z.union([raidTrigger, messageTrigger]);
export type Trigger = z.infer<typeof trigger>;

export const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  channels: z.array(
    z.object({
      channelName: z.string(),
      triggers: z.array(trigger),
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

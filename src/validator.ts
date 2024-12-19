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

// Maximum delay is 60 seconds
const delay = z.number().min(0).max(60).optional();

const matchingStrategy = ["exact", "includes", "startsWith"] as const;

const messageMatcher = z.object({
  text: z.string(),
  type: z.enum(matchingStrategy).optional(),
  caseSensitive: z.boolean().optional(),
});

export type MessageMatcher = z.infer<typeof messageMatcher>;

/**
 * Input
 */
const messageInput = z.object({
  type: z.literal("message"),
  message: messageMatcher,
  role: z.array(z.enum(role)),
});

export type MessageInput = z.infer<typeof messageInput>;

const raidInput = z.object({
  type: z.literal("raid"),
  minViewer: z.number().optional(),
});

export type RaidInput = z.infer<typeof raidInput>;

const subInput = z.object({
  type: z.literal("sub"),
});

export type SubInput = z.infer<typeof subInput>;

/**
 * Output
 */
const shoutoutOutput = z.object({
  type: z.literal("shoutout"),
  delay: delay,
});

export type ShoutoutOutput = z.infer<typeof shoutoutOutput>;

const announceOutput = z.object({
  type: z.literal("announce"),
  message: z.string(),
  cooldown: z.number().optional(),
  delay: delay,
  color: z.enum(["blue", "green", "orange", "purple", "primary"]).optional(),
});

export type AnnounceOutput = z.infer<typeof announceOutput>;

const sayOutput = z.object({
  type: z.literal("say"),
  message: z.string(),
  cooldown: z.number().optional(),
  delay: z.number().optional(),
});

export type SayOutput = z.infer<typeof sayOutput>;

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

const subTrigger = z.object({
  input: subInput,
  output: z.union([announceOutput, sayOutput]),
});

export type SubTrigger = z.infer<typeof subTrigger>;

/**
 * Schema
 */
const trigger = z.union([raidTrigger, messageTrigger, subTrigger]);
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

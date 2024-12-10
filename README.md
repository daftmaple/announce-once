# Announce Once

Simple bot to:

- run announce command with inbuilt cooldown
- shoutout-on-raid

You can run these features for multiple channels wherever your bot is modded.

## Setup

You need to set both `config.json` and `tokens.json`. Guides is available below. If you don't set these json files correctly, the app will throw validation error (refer to `src/validator.ts`) and won't work.

## Obtaining initial token

Obtain your Oauth token with the guide provided by [this project](https://github.com/daftmaple/twitch-oauth-token), scopes needed are:

```json
{
  "scope": [
    "chat:edit",
    "chat:read",
    "moderator:manage:announcements",
    "moderator:manage:shoutouts"
  ]
}
```

Once you have obtained the token, copy the token to the root directory of this project as `tokens.json`, and rename these properties on the `tokens.json` file:

```
access_token -> accessToken
refresh_token -> refreshToken
token_type -> tokenType
expires_in -> expiresIn
```

Remove property `token_type` and add property `obtainmentTimestamp` with value `0`, so the tokens.json file should look something like:

```json
{
  "accessToken": "token",
  "refreshToken": "token",
  "expiresIn": 12000,
  "obtainmentTimestamp": 0
}
```

This token will eventually be handled by the `@twurple/auth` library used in this project.

## Config

Use the `config.example.json` provided, copy it as `config.json`. Within the channel object, there are few optional properties for trigger message

```json
{
  "channelName": "channel name where you are broadcaster/mod",
  "triggers": [
    {
      "input": {}, // Input kind
      "output": {} // Output kind
    }
  ]
}
```

The valid input and output is available on the table below, with explanation for each section

## Table of valid input-output pair

|                                | _ChatClient event_ | Shoutout (API) | Announce (API) | Say (Chat) | Moderation actions (API) |
| ------------------------------ | ------------------ | -------------- | -------------- | ---------- | ------------------------ |
| Message                        | onMessage          | X              | O              | O          |                          |
| Raid                           | onRaid             | O              | O              | O          |                          |
| Subscriptions (Published only) |                    |                |                |            |                          |
| Action (/me)                   |                    |                |                |            |                          |
| Cheers                         |                    |                |                |            |                          |
| Chat mode change               |                    |                |                |            |                          |

## Input

### Message (`ChatClient.onMessage`)

If `non-subscriber` is listed in role, then any role enables trigger.

```ts
type MessageInput = {
  type: "message";
  text: string;
  role: (
    | "broadcaster"
    | "mod"
    | "vip"
    | "subscriber"
    | "founder"
    | "artist"
    | "non-subscriber"
  )[];
};
```

### Raid (`ChatClient.onRaid`)

Trigger is enabled if `minViewer` is undefined, or raider viewer count is larger than or equal to `minViewer`

```ts
type RaidInput = {
  type: "raid";
  minViewer?: number | undefined;
};
```

## Output

### Shoutout (`APIClient.chat.shoutoutUser`)

```ts
type ShoutoutOutput = {
  type: "shoutout";
  delay?: number | undefined;
};
```

### Announce (`APIClient.chat.sendAnnouncement`)

```ts
type AnnounceOutput = {
  type: "announce";
  message: string;
  cooldown?: number | undefined;
  delay?: number | undefined;
  color?: "blue" | "green" | "orange" | "purple" | "primary" | undefined;
};
```

### Say (`ChatClient.say`)

Behaves similarly to announce, with properties:

```ts
type SayOutput = {
  type: "say";
  message: string;
  cooldown?: number | undefined;
  delay?: number | undefined;
};
```

## Message output replacer available

Any output fields with `message` field may have replacer text, which can be replaced by the `MessageScope` object below

```ts
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
```

To access properties eg. user, use double curly braces as replacer:

```json
{
  "type": "announce",
  "message": "Thank you {{user.name}} for the raid!",
  "cooldown": 10,
  "color": "purple"
}
```

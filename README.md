# Announce Once

Simple bot to run announce command with inbuilt cooldown. You can run this for multiple channels where your bot is modded.

## Setup

You need to set both `config.json` and `tokens.json`. Guides is available below. If you don't set these json files correctly, the app will throw validation error (refer to `src/validator.ts`) and won't work.

## Obtaining initial token

Obtain your Oauth token with the guide provided by [this project](https://github.com/daftmaple/twitch-oauth-token), scopes needed are:

```
"scopes": ["moderator:manage:announcements", "chat:read", "chat:edit"]
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
  "triggers: [
    {
      "command": "Text where message below will be sent if matches the text sent on chat",
      "message": "Message announced by the bot",
      "color": "Colour of the announcement, optional",
      "cooldown": "Cooldown of the command, in seconds, optional (defaults to 10 seconds)"
    }
  ]
}
```

Available colour:

- blue
- green
- orange
- purple
- primary

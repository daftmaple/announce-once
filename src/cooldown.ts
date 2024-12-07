declare const tags: unique symbol;

type Tagged<BaseType, Tag extends PropertyKey> = BaseType & {
  [tags]: { [K in Tag]: void };
};

type ChannelName = Tagged<string, "ChannelName">;
type Command = Tagged<string, "Command">;
type LastSent = Tagged<number, "LastSent">;

const channelAnnouncerMapping: Map<
  ChannelName,
  Map<Command, LastSent>
> = new Map();

/**
 * @param channelName
 * @param command
 * @param cooldown Cooldown in seconds
 */
export const shouldRunCommand = (
  channelName: string,
  command: string,
  cooldown: number
) => {
  const currentTimestamp = performance.now();

  let channel = channelAnnouncerMapping.get(channelName as ChannelName);
  if (!channel) {
    channel = new Map<Command, LastSent>();
    channelAnnouncerMapping.set(channelName as ChannelName, channel);
  }

  // Get last timestamp when the command is triggered
  const lastSent = channel.get(command as Command);

  // If has not been triggered or has reached cooldown, command should be run and update last sent timestamp
  if (!lastSent || currentTimestamp - lastSent > cooldown * 1000) {
    channel.set(command as Command, currentTimestamp as LastSent);
    return true;
  }

  return false;
};

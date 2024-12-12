declare const tags: unique symbol;

type Tagged<BaseType, Tag extends PropertyKey> = BaseType & {
  [tags]: { [K in Tag]: void };
};

type ChannelName = Tagged<string, "ChannelName">;
type InputKey = Tagged<string, "InputKey">;
type LastSent = Tagged<number, "LastSent">;

const channelAnnouncerMapping: Map<
  ChannelName,
  Map<InputKey, LastSent>
> = new Map();

/**
 * @param channelName
 * @param inputKey Distinction key for the command should be run
 * @param cooldown Cooldown in seconds
 *
 * TODO: implement this so that it handles all IO system
 */
export const shouldRunCommand = (
  channelName: string,
  inputKey: string,
  cooldown: number
) => {
  const currentTimestamp = performance.now();

  let channel = channelAnnouncerMapping.get(channelName as ChannelName);
  if (!channel) {
    channel = new Map<InputKey, LastSent>();
    channelAnnouncerMapping.set(channelName as ChannelName, channel);
  }

  // Get last timestamp when the InputKey is triggered
  const lastSent = channel.get(inputKey as InputKey);

  // If has not been triggered or has reached cooldown, InputKey should be run and update last sent timestamp
  if (!lastSent || currentTimestamp - lastSent > cooldown * 1000) {
    channel.set(inputKey as InputKey, currentTimestamp as LastSent);
    return true;
  }

  return false;
};

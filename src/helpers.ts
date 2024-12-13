import { ChatSubInfo } from "@twurple/chat";

export const wait = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export type SubType = "tier1" | "tier2" | "tier3" | "prime";

export const convertSubType = (subType: ChatSubInfo["plan"]): SubType => {
  switch (true) {
    case subType === "1000":
      return "tier1";
    case subType === "2000":
      return "tier2";
    case subType === "3000":
      return "tier3";
    case subType === "Prime":
      return "prime";
    default:
      throw new Error(`Invalid sub type ${subType} detected`);
  }
};

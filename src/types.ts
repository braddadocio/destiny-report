import { DestinyHistoricalStatsPeriodGroup } from "bungie-api-ts/destiny2/interfaces";

declare global {
  interface Window {
    __HIDDEN_IFRAME_REFRESH_AUTH: boolean;
    __recieveNewCodeFromIframe: (v: any) => void;
    __preloadData: Record<string, any>;
  }
}

export enum MembershipType {
  Xbox = 1,
  Playstation = 2,
  Steam = 3,
  BattleNet = 4,
  Stadia = 5,
  Unknown = 777,
}

export interface BigQueryDate {
  value: string;
}

export interface Season {
  name: string;
  seasonHash: number;
  startDate: string;
  endDate: string;
}

export interface Membership {
  membershipType: string;
  membershipId: string;
}

export interface CharacterActivity {
  characterId: string;
  activity: DestinyHistoricalStatsPeriodGroup;
}

import { GetAwardType } from "./award.type.js";
import { GetBadgeType } from "./badge.type.js";
import { CollectionType } from "./collection.type.js";
import { ExperimentsNameType } from "./experiment.type.js";
import { GetInteractionCollection } from "./interaction.type.js";
import { GetLinkType } from "./link.type.js";
import { GetNotificationCollection } from "./notification.type.js";
import { StatisticsType } from "./statistics.type.js";
import { GetUsernameType } from "./username.type.js";
import { VisibilityType } from "./visibility.type.js";

export type PresenceType =
    | "online"
    | "idle"
    | "dnd"
    | "offline"
;

export type UserType = {
    algorithmScore: string;
    id: string;
    displayName?: string;
    fanflair: string;
    avatar?: string;
    animatedAvatar?: string;
    banner?: string;
    status?: string;
    about?: string;
    markdown?: string;
    tags: string;
    pronouns?: string;
    birthDate?: string;
    birthDateVisibility: VisibilityType;
    foundedDate?: string;
    foundedDateVisibility: VisibilityType;
    location: string;
    theme: string;
    isAuraEnabled: boolean;
    auraType: string;
    auraPrimary: string;
    auraSecondary: string;
    type: string;
    flags: string;
    isDeveloper: boolean;
    isSensitive: boolean;
    isMature: boolean;
    visibility: VisibilityType;
    areFriendRequestsEnabled: boolean;
    sendMessages: VisibilityType;
    sendComments: VisibilityType;
    presence: PresenceType;
    isOnline: boolean;
    lastActive: string;
    createdDate: string;
}

export type GetUserItemType = Omit<
    UserType, 
    "tags" | "flags"
> & {
    usernames: GetUsernameType[];
    badges: GetBadgeType[];
    awards: GetAwardType[];
    tags: string[];
    flags: ExperimentsNameType[];
    links: GetLinkType[];
    interactions?: Partial<GetInteractionCollection>;
    isFriends: boolean;
    statistics :Partial<StatisticsType>
    collections?: CollectionType[]
    notifications: GetNotificationCollection;
};

export type GetUserType = {
    items: GetUserItemType[],
    count: number
}

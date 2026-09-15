import { CategoryNameType } from "../../scripts/categories.js";
import { VisibilityType } from "../visibility.type.js";
import { GetRowType } from "./row.type.js";

export type BlockType = {
    id: string;
    ownerId: string;
    categoryType: CategoryNameType;
    icon?: string;
    label?: string;
    description?: string;
    tags?: string;
    source: "official" | "community";
    isRecommended: boolean;
    isSensitive: boolean;
    isMature: boolean;
    addedCount: number;
    visibility: VisibilityType;
    updatedDate: string;
    createdDate: string;
}

export type GetBlockType = Omit<
    BlockType, 
    "ownerId"
> & {
    rows: GetRowType[];
};

export type AddedBlockType = Omit<
    BlockType,
    | "ownerId"
    | "categoryType"
    | "tags"
    | "source"
    | "isRecommended"
    | "isSensitive"
    | "isMature"
    | "visibility"
    | "updatedDate"
> & {
    assetId: string;
    sourceBlockId?: string;
    categoryId: string;
    version?: string;
    isLocked: boolean;
    position: number;
    createdBy: string;
    lastEditedDate: string;
};

export type GetAddedBlockType = Omit<
    AddedBlockType, 
    "assetId" | "categoryId"
> & {
    rows: GetRowType[];
};

import { CategoryIdType } from "../../scripts/categories.js";
import { GetAddedBlockType } from "./block.type.js";

export type CategoryType = {
    assetId: string;
    categoryId: string;
    type: CategoryIdType[];
    label?: string;
    position: number;
    createdBy: string;
    lastEditedDate: string;
    createdDate: string;
}

export type GetCategoryType = Omit<
    CategoryType, 
    "assetId"
> & {
    blocks: GetAddedBlockType[];
};

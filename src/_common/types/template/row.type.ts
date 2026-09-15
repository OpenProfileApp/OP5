import { GetFieldType } from "./field.type.js";

export type RowNameType = 
    | "text"
    | "media"
    | "split"
    | "timeline"
    | "calendar"
;

export type RowType = {
    assetId: string;
    rowId: string;
    blockId: string;
    type: RowNameType;
    position: number;
    createdBy: string;
    createdDate: string;
}

export type GetRowType = Omit<
    RowType, 
    "assetId" | "blockId"
> & {
    fields: GetFieldType[];
};

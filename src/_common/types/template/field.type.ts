import { NoteType } from "./note.type.js";
import { ThoughtType } from "./thought.type.js";
import { GetValueType } from "./value.type.js";

export type FieldNameType = 
    | "text"
    | "dropdown"
    | "slider"
    | "color"
    | "rating"
    | "asset"
    | "button"
;

export type FieldType = {
    assetId: string;
    fieldId: string;
    rowId: string;
    type: FieldNameType;
    label?: string;
    placeholder?: string;
    options?: Record<string, string>[];
    guide?: string;
    isLocked: boolean;
    position: number;
    createdBy: string;
    lastEditedDate: string;
    createdDate: string;
}

export type GetFieldType = Omit<
    FieldType, 
    "assetId" | "rowId"
> & {
    value?: GetValueType;
    notes: NoteType[];
    thought?: ThoughtType;
};

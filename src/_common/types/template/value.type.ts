export type ValueType = {
    assetId: string;
    fieldId: string;
    author: string;
    text: string;
    date: string;
}

export type GetValueType = Omit<
    ValueType, 
    "assetId" | "fieldId"
>

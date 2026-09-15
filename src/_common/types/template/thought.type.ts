export type ThoughtType = {
    fieldId: string;
    author: string;
    text: string;
    lastEditedDate: string;
    createdDate: string;
}

export type GetThoughtType = Omit<
    ThoughtType, 
    "fieldId"
>

export type NoteType = {
    fieldId: string;
    author: string;
    text: string;
    position: number;
    isPinned: boolean;
    lastEditedDate: string;
    createdDate: string;
}

export type GetNoteType = Omit<
    NoteType, 
    "fieldId"
>

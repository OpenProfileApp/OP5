export type UsernameType = {
    userId: string;
    username: string;
    isPrimary: boolean;
    position: number;
    addedDate: string;
}

export type GetUsernameType = Omit<
    UsernameType, 
    "userId"
>;

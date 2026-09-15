export const categories = [
    { id: "identity", name: "Identity" },
    { id: "astrology", name: "Astrology" },
    { id: "abilities", name: "Abilities" },
    { id: "physical", name: "Physical" },
    { id: "personality", name: "Personality" },
    { id: "choices", name: "Choices" },
    { id: "preferences", name: "Preferences" },
    { id: "beliefs", name: "Beliefs" },
    { id: "interactions", name: "Interactions" },
    { id: "emotional", name: "Emotional" },
    { id: "health", name: "Health" },
    { id: "relationships", name: "Relationships" }
] as const;

export const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name)
);

export type CategoryType = (typeof categories)[number];

export type CategoryIdType = CategoryType["id"];
export type CategoryNameType = CategoryType["name"];

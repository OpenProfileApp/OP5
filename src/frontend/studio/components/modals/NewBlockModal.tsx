import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Row } from "../CharacterTemplate.js";

type Screen = "menu" | "configure";

export interface BlockLibraryItem {
    id: string;
    label?: string;
    description?: string;
    icon?: string;
    source: "official" | "addon";
    pack?: string; // Merge source with pack?
    uses?: number;
    rows?: Row[];
}

// eslint-disable-next-line react-refresh/only-export-components
export const library: Record<string, BlockLibraryItem[]> = {
    identity: [
        {
            id: "legal",
            label: "Legal",
            description: "Legal name, living status, citizenship, and identifiers.",
            icon: "https://openmoji.org/data/color/svg/1F9D1.svg",
            source: "official",
            uses: 100,
            rows: [
                {
                    id: "full-name",
                    type: "field",
                    fields: [
                        // Remove placeholders?
                        // Maybe have fill in value variables where the user can link values from one field to another: {identity.legal.full-name.first-name}  
                        { 
                            id: "first-name",
                            type: "text",
                            label: "First Name",
                            placeholder: "What is {DISPLAY_NAME_POSSESSIVE} first name?",
                            guide: "First names are generally given by parents or legal guardians. It could reflect something from their personalities or how they view {DISPLAY_NAME}.\n\nIt is recommended choosing a name that fits {DISPLAY_NAME_POSSESSIVE} ethnic background, social class, and birth era.\n\n[Learn more](https://support.openprofile.app/en-us/article/choosing-a-name)",
                            // value: "Jane",
                            // thoughts: "I've always wanted to get my name changed, but at the same time, I'm unsure. I wish I had a rarer name that stood out more, yk?",
                            // comments: "This is an example of an author's BTS comment."
                        },
                        { 
                            id: "middle-name",
                            type: "text",
                            label: "Middle Name",
                            placeholder: "What is {DISPLAY_NAME_POSSESSIVE} middle name?",
                            guide: "Middle names aren't always required and are more often used for realism or an alternate calling.",
                        },
                        { 
                            id: "last-name",
                            type: "text",
                            label: "Last Name",
                            placeholder: "What is {DISPLAY_NAME_POSSESSIVE} last name?",
                            guide: "Last names typically reflect ancestral heritage, family history, or paternal lineage.",
                        }
                    ],
                },
                {
                    id: "affixes",
                    type: "field",
                    fields: [
                        { 
                            id: "prefix",
                            type: "text",
                            label: "Prefix / Title",
                            placeholder: "e.g., Dr., Sir, Lady, Hon.",
                            guide: "Formal honorific, academic, or noble title preceding {DISPLAY_NAME_POSSESSIVE} name.",
                        },
                        { 
                            id: "suffix",
                            type: "text",
                            label: "Suffix",
                            placeholder: "e.g., Jr., III, Esq., PhD",
                            guide: "Generational designation, lineage numeral, or post-nominal professional title.",
                        },
                        {
                            id: "maiden-name",
                            type: "text",
                            label: "Maiden Name",
                            placeholder: "Does the {DISPLAY_NAME} have a legal maiden name?",
                            guide: "Lastname held prior to legal changes such as marriage.",
                        },
                    ],
                },
                {
                    id: "lifespan",
                    type: "field",
                    fields: [
                        {
                            id: "date-of-birth",
                            type: "text",
                            label: "Date of Birth",
                            placeholder: "When was {DISPLAY_NAME} born?",
                            guide: "The official birth date recorded on {DISPLAY_NAME_POSSESSIVE} birth certificate or legal ledger.",
                        },
                        {
                            id: "chronological-age",
                            type: "text",
                            label: "Age",
                            placeholder: "How old is {DISPLAY_NAME}?",
                            guide: "The actual number of years {DISPLAY_NAME} has existed between birth and death.",
                        },
                        {
                            id: "date-of-death",
                            type: "text",
                            label: "Date of Death",
                            placeholder: "When did {DISPLAY_NAME} pass away?",
                            guide: "The official death date recorded on {DISPLAY_NAME_POSSESSIVE} death certificate or legal ledger.",
                        },
                    ],
                },
                {
                    id: "lifespan-places",
                    type: "field",
                    fields: [
                        {
                            id: "place-of-birth",
                            type: "text",
                            label: "Place of Birth",
                            placeholder: "Where was {DISPLAY_NAME} born?",
                            guide: "City, nation, or region of birth recorded in official records.",
                        },
                        {
                            id: "place-of-death",
                            type: "text",
                            label: "Place of Death",
                            placeholder: "Where was {DISPLAY_NAME} found deceased?",
                            guide: "City, nation, or region of death recorded in official records.",
                        },
                    ],
                },
                {
                    id: "citizenship",
                    type: "field",
                    fields: [
                        {
                            id: "nationality",
                            type: "dropdown",
                            label: "Country of Citizenship",
                            guide: "The country where {DISPLAY_NAME} holds legal citizenship. If multi-nationality, add all of them",
                            options: [
                                "Afghanistan",
                                "Albania",
                                "Algeria",
                                "Andorra",
                                "Angola",
                                "Antigua and Barbuda",
                                "Argentina",
                                "Armenia",
                                "Australia",
                                "Austria",
                                "Azerbaijan",
                                "Bahamas",
                                "Bahrain",
                                "Bangladesh",
                                "Barbados",
                                "Belarus",
                                "Belgium",
                                "Belize",
                                "Benin",
                                "Bhutan",
                                "Bolivia",
                                "Bosnia and Herzegovina",
                                "Botswana",
                                "Brazil",
                                "Brunei",
                                "Bulgaria",
                                "Burkina Faso",
                                "Burundi",
                                "Cabo Verde",
                                "Cambodia",
                                "Cameroon",
                                "Canada",
                                "Central African Republic",
                                "Chad",
                                "Chile",
                                "China",
                                "Colombia",
                                "Comoros",
                                "Congo (Congo-Brazzaville)",
                                "Costa Rica",
                                "Croatia",
                                "Cuba",
                                "Cyprus",
                                "Czechia (Czech Republic)",
                                "Democratic Republic of the Congo",
                                "Denmark",
                                "Djibouti",
                                "Dominica",
                                "Dominican Republic",
                                "Ecuador",
                                "Egypt",
                                "El Salvador",
                                "Equatorial Guinea",
                                "Eritrea",
                                "Estonia",
                                "Eswatini",
                                "Ethiopia",
                                "Fiji",
                                "Finland",
                                "France",
                                "Gabon",
                                "Gambia",
                                "Georgia",
                                "Germany",
                                "Ghana",
                                "Greece",
                                "Grenada",
                                "Guatemala",
                                "Guinea",
                                "Guinea-Bissau",
                                "Guyana",
                                "Haiti",
                                "Holy See (Vatican City)",
                                "Honduras",
                                "Hong Kong",
                                "Hungary",
                                "Iceland",
                                "India",
                                "Indonesia",
                                "Iran",
                                "Iraq",
                                "Ireland",
                                "Israel",
                                "Italy",
                                "Ivory Coast (Cote d'Ivoire)",
                                "Jamaica",
                                "Japan",
                                "Jordan",
                                "Kazakhstan",
                                "Kenya",
                                "Kiribati",
                                "Kuwait",
                                "Kyrgyzstan",
                                "Laos",
                                "Latvia",
                                "Lebanon",
                                "Lesotho",
                                "Liberia",
                                "Libya",
                                "Liechtenstein",
                                "Lithuania",
                                "Luxembourg",
                                "Macau",
                                "Madagascar",
                                "Malawi",
                                "Malaysia",
                                "Maldives",
                                "Mali",
                                "Malta",
                                "Marshall Islands",
                                "Mauritania",
                                "Mauritius",
                                "Mexico",
                                "Micronesia",
                                "Moldova",
                                "Monaco",
                                "Mongolia",
                                "Montenegro",
                                "Morocco",
                                "Mozambique",
                                "Myanmar (Burma)",
                                "Namibia",
                                "Nauru",
                                "Nepal",
                                "Netherlands",
                                "New Zealand",
                                "Nicaragua",
                                "Niger",
                                "Nigeria",
                                "North Korea",
                                "North Macedonia",
                                "Norway",
                                "Oman",
                                "Pakistan",
                                "Palau",
                                "Palestine",
                                "Panama",
                                "Papua New Guinea",
                                "Paraguay",
                                "Peru",
                                "Philippines",
                                "Poland",
                                "Portugal",
                                "Puerto Rico",
                                "Qatar",
                                "Romania",
                                "Russia",
                                "Rwanda",
                                "Saint Kitts and Nevis",
                                "Saint Lucia",
                                "Saint Vincent and the Grenadines",
                                "Samoa",
                                "San Marino",
                                "Sao Tome and Principe",
                                "Saudi Arabia",
                                "Senegal",
                                "Serbia",
                                "Seychelles",
                                "Sierra Leone",
                                "Singapore",
                                "Slovakia",
                                "Slovenia",
                                "Solomon Islands",
                                "Somalia",
                                "South Africa",
                                "South Korea",
                                "South Sudan",
                                "Spain",
                                "Sri Lanka",
                                "Sudan",
                                "Suriname",
                                "Sweden",
                                "Switzerland",
                                "Syria",
                                "Taiwan",
                                "Tajikistan",
                                "Tanzania",
                                "Thailand",
                                "Timor-Leste",
                                "Togo",
                                "Tonga",
                                "Trinidad and Tobago",
                                "Tunisia",
                                "Turkey",
                                "Turkmenistan",
                                "Tuvalu",
                                "Uganda",
                                "Ukraine",
                                "United Arab Emirates",
                                "United Kingdom",
                                "United States",
                                "Uruguay",
                                "Uzbekistan",
                                "Vanuatu",
                                "Venezuela",
                                "Vietnam",
                                "Yemen",
                                "Zambia",
                                "Zimbabwe"
                            ]
                        },
                        {
                            id: "identification",
                            type: "text",
                            label: "Identification Number",
                            placeholder: "",
                            guide: "The primary identifier used by authorities to track {DISPLAY_NAME_POSSESSIVE} legal status.\n\n- **Passport Numbers:** International (e.g. A12345678), US/UK (9 digits)\n- **National IDs:** EU / Global ID (Alphanumeric), India Aadhaar (12 digits), Mexico CURP (18 chars), China National ID (18 chars), Japan My Number (12 digits)\n- **Tax & Social Security Numbers:** US SSN (XXX-XX-XXXX), UK NINO (e.g. QQ123456A), Canada SIN (XXX-XXX-XXX), Brazil CPF (XXX.XXX.XXX-XX), France NIR (15 digits), Germany Steuer-ID (11 digits), Australia TFN (9 digits)",
                        }
                    ],
                },
            ]
        },






// add preffered name
//   DISPALY NAME GUIDE: "A name, at first glance, gives personality to an outsider, so pick one that truely defines your character!\n\n[Need help?](https://support.openprofile.app/en-us/article/choosing-a-name)",

    ],
};

























































export interface NewBlockData {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    source?: "official" | "addon";
    rows?: Row[];
}

interface NewBlockModalProps {
    onAddBlock: (data: NewBlockData) => void;
    initialCategory: string;
}

export default function NewBlockModal({ onAddBlock, initialCategory }: NewBlockModalProps) {
    const { t, ready: isTranslationReady } = useTranslation();

    const [screen, setScreen] = useState<Screen>("menu");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSort, setFilterSort] = useState("popular-desc");
    const [selectedItem, setSelectedItem] = useState<BlockLibraryItem | null>(null);
    const [blockLabel, setBlockLabel] = useState("");
    const [blockId, setBlockId] = useState("");

    const filteredItems = useMemo(() => {
        const categoryItems = library[initialCategory] ?? [];

        return categoryItems
            .filter((item) => {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                    (item.label && item.label.toLowerCase().includes(q)) ||
                    (item.description && item.description.toLowerCase().includes(q));

                return matchesSearch;
            })
            .sort((a, b) => {
                if (a.source === "official" && b.source !== "official") return -1;
                if (a.source !== "official" && b.source === "official") return 1;

                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                const popA = a.uses ?? 0;
                const popB = b.uses ?? 0;

                switch (filterSort) {
                    case "newest":
                        return dateB - dateA;
                    case "oldest":
                        return dateA - dateB;
                    case "popular-desc":
                        if (popB !== popA) return popB - popA;
                        return (a.label || "").localeCompare(b.label || "");
                    case "popular-asc":
                        if (popA !== popB) return popA - popB;
                        return (a.label || "").localeCompare(b.label || "");
                    case "name-asc":
                        return (a.label || "").localeCompare(b.label || "");
                    case "name-desc":
                        return (b.label || "").localeCompare(a.label || "");
                    case "updated":
                    default:
                        return dateB - dateA;
                }
            });
    }, [searchQuery, filterSort, initialCategory]);

    function handleSelect(item: BlockLibraryItem) {
        setSelectedItem(item);
        setBlockLabel(item.label || "New Block");
        setBlockId(`${item.id}-${Date.now().toString().slice(-4)}`);
        setScreen("configure");
    }

    function resetForm() {
        setScreen("menu");
        setSelectedItem(null);
        setBlockLabel("");
        setBlockId("");
        setSearchQuery("");
        setFilterSort("popular-desc");
    }

    function handleSave() {
        if (!selectedItem) return;

        const finalLabel = blockLabel.trim() || selectedItem.label || "New Block";
        const finalId = blockId.trim() || `${selectedItem.id}-${Date.now()}`;

        onAddBlock({
            id: finalId,
            label: finalLabel,
            description: selectedItem.description,
            icon: selectedItem.icon,
            source: selectedItem.source,
            rows: selectedItem.rows,
        });

        const modal = document.getElementById("new-block") as HTMLDialogElement | null;
        modal?.close();
        resetForm();
    }

    if (!isTranslationReady) return null;

    return (
        <dialog id="new-block" className="modal" onClose={resetForm}>
            <div 
                className={`modal-box flex flex-col relative 
                    ${screen === "menu" ? "max-w-245" : "max-w-md"}
                `}
            >
                <form method="dialog">
                    <button
                        type="submit"
                        className="absolute right-0 top-0 m-5 text-2xl font-nerdfont cursor-pointer z-10"
                    >
                        
                    </button>
                </form>

                {screen === "configure" && (
                    <button
                        type="button"
                        className="absolute left-0 top-0 m-5 flex items-center gap-2 cursor-pointer z-10"
                        onClick={() => setScreen("menu")}
                    >
                        <span className="text-xl font-nerdfont leading-none"></span>
                        <span>Back</span>
                    </button>
                )}

                <div className="mb-6 text-center mt-2">
                    <h3 className="text-2xl font-bold">
                        {screen === "menu" ? "Add New Block" : "Configure Block"}
                    </h3>
                    <p className="text-sm text-sub mt-1">
                        {screen === "menu"
                            ? "Browse and select a block template from the library"
                            : "Customize the label and unique ID for this block."}
                    </p>
                </div>

                {screen === "menu" && (
                    <>
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <fieldset className="fieldset flex-1">
                                <legend className="fieldset-legend">Search</legend>
                                <label className="input w-full flex items-center gap-2">
                                    <span className="font-nerdfont text-base"></span>
                                    <input
                                        type="search"
                                        placeholder="Search blocks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </label>
                            </fieldset>

                            <fieldset className="fieldset shrink-0 w-full sm:w-60">
                                <legend className="fieldset-legend">Filter</legend>
                                <select
                                    value={filterSort}
                                    onChange={(e) => setFilterSort(e.target.value)}
                                    className="select w-full"
                                >
                                    <option value="updated">Recently Updated</option>
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="popular-desc">Most Popular</option>
                                    <option value="popular-asc">Least Popular</option>
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="name-desc">Name (Z-A)</option>
                                </select>
                            </fieldset>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                            {filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="aspect-square relative flex flex-col items-center justify-center p-3 bg-base-200 hover:bg-base-300 border border-base-300 rounded shadow-xs cursor-pointer text-center group"
                                    onClick={() => handleSelect(item)}
                                >
                                    {item.source !== "official" && (
                                        <div
                                            className="absolute top-2 left-4 tooltip tooltip-accent"
                                            data-tip="Addon"
                                        >
                                            <div>
                                                <span className="font-nerdfont leading-none text-sm mr-2">
                                                    󰐱
                                                </span>
                                                <span className="text-xs">{item.pack}</span>
                                            </div>
                                        </div>
                                    )}

                                    <img
                                        className="h-16 w-16 object-contain"
                                        src={
                                            item.icon ||
                                            "https://openmoji.org/data/color/svg/2728.svg"
                                        }
                                        alt={item.label || "Block"}
                                    />

                                    <span className="text-base font-semibold mt-2">
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span className="text-xs text-sub mt-1 line-clamp-2">
                                            {item.description}
                                        </span>
                                    )}

                                    <div className="absolute bottom-2 left-4">
                                        <div>
                                            <span className="font-nerdfont leading-none text-sm mr-2">
                                                󱔗
                                            </span>
                                            <span className="text-xs">Added to {item.uses} template{item.uses !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-12 text-center text-sub">
                                    No blocks found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </>
                )}

                {screen === "configure" && selectedItem && (
                    <div className="flex flex-col gap-6 py-4 max-w-md mx-auto w-full">
                        {/* Selected Template Preview */}
                        <div className="flex items-center gap-4 p-4 bg-base-200 border border-base-300 rounded-lg">
                            <img
                                className="h-12 w-12 object-contain shrink-0"
                                src={
                                    selectedItem.icon ||
                                    "https://openmoji.org/data/color/svg/2728.svg"
                                }
                                alt={selectedItem.label}
                            />
                            <div className="flex flex-col text-left">
                                <span className="text-xs text-sub uppercase font-semibold">
                                    Template
                                </span>
                                <span className="font-bold text-lg">
                                    {selectedItem.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">Block Title</legend>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Block Title / Name"
                                    value={blockLabel}
                                    onChange={(e) => setBlockLabel(e.target.value)}
                                />
                            </fieldset>

                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">Block Unique ID</legend>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-mono text-sm"
                                    placeholder="Block ID (e.g., legal-identity-1)"
                                    value={blockId}
                                    onChange={(e) =>
                                        setBlockId(
                                            e.target.value.toLowerCase().replace(/\s+/g, "-")
                                        )
                                    }
                                />
                            </fieldset>
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            className="btn btn-accent w-full mt-2"
                        >
                            Add Block
                        </button>
                    </div>
                )}
            </div>

            <form method="dialog" className="modal-backdrop">
                <button type="submit" />
            </form>
        </dialog>
    );
}

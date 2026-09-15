import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RowNameType } from "../../../../_common/types/template/row.type.js";
import { Tooltip } from "../../../_common/components/Tooltip.js";

type Screen = "menu" | "configure";

interface RowTypeOption {
    type: RowNameType;
    icon: string;
    title: string;
    description: string;
}

const index: RowTypeOption[] = [
    {
        type: "text",
        icon: "󰈚",
        title: "Text",
        description: "Add up to five customizable text fields."
    },
    {
        type: "media",
        icon: "󰋩",
        title: "Media",
        description: "Upload or link a single image or video."
    },
    {
        type: "split",
        icon: "󰯌",
        title: "Split Layout",
        description: "Divide the row into two side-by-side sections."
    },
    {
        type: "timeline",
        icon: "󰙮",
        title: "Timeline",
        description: "Present events in chronological order along a visual timeline."
    },
    {
        type: "calendar",
        icon: "󰃭",
        title: "Calendar",
        description: "Display events, tasks, or routines by day, week, or month."
    }
];

export interface NewRowData {
    id: string;
    type: RowNameType;
}

interface Props {
    onAddRow: (data: NewRowData) => void;
}

export default function NewRowModal({ onAddRow }: Props) {
    const { t, ready: isTranslationReady } = useTranslation();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [screen, setScreen] = useState<Screen>("menu");
    const [isSingletype] = useState(index.length === 0);
   
    const [id, setId] = useState<string>("");
    const [type, setType] = useState<RowNameType>("text");

    const modal = document.getElementById("new-row") as HTMLDialogElement;

    function go(type: RowNameType) {
        setType(type);
        setScreen("configure");
    }

    function resetForm() {
        setScreen("menu");
        setId("");
        setType("text");
    }

    function handleSave() {
        onAddRow({
            id,
            type
        });

        modal?.close();

        resetForm();
    }

    if (!isTranslationReady) return null;

    return (
        <dialog 
            className="modal"
            id="new-row"
        >
            <div className="modal-box flex flex-col">
                <form method="dialog">
                    <button
                        type="submit"
                        className="absolute right-0 top-0 m-5 text-2xl font-nerdfont cursor-pointer"
                    >
                        
                    </button>
                </form>

                {!isSingletype && screen !== "menu" && (
                    <button
                        type="button"
                        className="absolute left-0 top-1 m-5 flex items-center gap-2 cursor-pointer"
                        onClick={() => setScreen("menu")}
                    >
                        <span className="text-xl font-nerdfont leading-none">
                            
                        </span>

                        <span>Back</span>
                    </button>
                )}

                <div className="absolute top-12 left-6 right-6 md:relative md:top-0 md:right-0 md:left-0 pointer-events-none mb-8">
                    <h3 className="font-nerdfont text-6xl text-center mb-4">
                        
                    </h3>

                    <h3 className="text-center text-2xl font-bold">
                        {screen === "menu" ? "New Row" : `New ${index.find((item) => item.type === type)?.title} Row`}
                    </h3>

                    {screen === "menu" && (
                        <p className="text-center text-sm text-sub py-4">
                            What type of row do you want to add?
                        </p>
                    )}
                </div>

                <div>
                    {screen === "menu" && (
                        <div
                            className={`grid gap-2 ${
                                index.length > 5 ? "grid-cols-2" : "grid-cols-1"
                            }`}
                        >
                            {index.map((item, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="btn bg-base-100 border border-base-300 gap-4 h-16"
                                    onClick={() => go(item.type)}
                                >
                                    <div className="text-xl w-6 font-nerdfont">
                                        {item.icon}
                                    </div>

                                    <div className="flex flex-col text-left flex-1">
                                        <div>{item.title}</div>

                                        <div className="text-xs font-normal text-sub">
                                            {item.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {screen === "configure" && (
                        <fieldset className="fieldset w-full">
                            <div className="flex flex-col gap-1 mt-1">
                                <label className="label flex gap-2">
                                    ID

                                    <Tooltip content={(
                                        <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                            The ID should be human-readable for parsing and migration purposes.
                                        </div>
                                    )}>
                                        <span className="font-nerdfont text-sm"></span>
                                    </Tooltip>
                                </label>

                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder={"What is the unique id for this row?"}
                                    value={id ?? ""}
                                    maxLength={64}
                                    onChange={(e) =>
                                        setId(
                                            e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                                            .replace(/[^a-z-]/g, "")
                                        )
                                    }
                                />
                            </div>
                        </fieldset>
                    )}
                </div>

                {screen === "configure" && (
                    <button
                        type="button"
                        className="absolute bottom-6 left-6 right-6 md:relative md:bottom-0 md:right-0 md:left-0 md:mt-4 btn btn-accent"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        <span className={`${isLoading ? "loading" : ""}`}>
                            {!isLoading ? "Create" : ""}
                        </span>
                    </button>
                )}
            </div>
        </dialog>
    );
}

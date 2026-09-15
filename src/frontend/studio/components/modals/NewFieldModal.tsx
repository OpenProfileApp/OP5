import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FieldNameType } from "../../../../_common/types/template/field.type.js";
import { Tooltip } from "../../../_common/components/Tooltip.js";

type Screen = "menu" | "configure";

interface FieldTypeOption {
    type: FieldNameType;
    icon: string;
    title: string;
    description: string;
}

const index: FieldTypeOption[] = [
    {
        type: "text",
        icon: "󰦨",
        title: "Text",
        description: "Enter single or multi-line markdown-supported text."
    },
    {
        type: "dropdown",
        icon: "",
        title: "Dropdown",
        description: "Write a new or choose existing options from a list."
    },
    {
        type: "slider",
        icon: "",
        title: "Slider",
        description: "Select a value within a range."
    },
    {
        type: "color",
        icon: "󰏘",
        title: "Color",
        description: "Choose a color value such as HEX, RGB, or other formats."
    },
    {
        type: "rating",
        icon: "",
        title: "Rating",
        description: "Rate using a custom icon or a score."
    },
    {
        type: "asset",
        icon: "",
        title: "Asset",
        description: "Select an existing asset to define a relationship."
    },
    {
        type: "button",
        icon: "",
        title: "Button",
        description: "Trigger an action or open a link."
    }
];

export interface NewFieldData {
    id: string;
    type: FieldNameType;
    label: string;
    placeholder?: string;
    options?: Record<string, string>[];
    guide?: string;
    value?: string;
}

interface NewFieldModalProps {
    targetRowId: string;
    onAddField: (targetRowId: string, data: NewFieldData) => void;
}

export default function NewFieldModal({ targetRowId, onAddField }: NewFieldModalProps) {
    const { t, ready: isTranslationReady } = useTranslation();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [screen, setScreen] = useState<Screen>("menu");
    const [isSingletype] = useState(index.length === 0);
   
    const [id, setId] = useState<string>("");
    const [type, setType] = useState<FieldNameType>("text");
    const [label, setLabel] = useState<string>("");
    const [placeholder, setPlaceholder] = useState<string>("");
    const [options, setOptions] = useState<Record<string, string>[]>([]);
    const [guide, setGuide] = useState<string>("");
    const [value, setValue] = useState<string>("")

    const modal = document.getElementById("new-field") as HTMLDialogElement;

    function go(type: FieldNameType) {
        setType(type);
        setScreen("configure");
    }

    function resetForm() {
        setScreen("menu");
        setId("");
        setType("text");
        setLabel("");
        setPlaceholder("");
        setOptions([]);
        setGuide("");
        setValue("");
    }

    function handleSave() {
        const payload: NewFieldData = {
            id,
            type,
            label,
            placeholder,
            options,
            guide,
            value
        };

        onAddField(
            targetRowId, 
            payload
        );

        modal?.close();

        resetForm();
    }

    if (!isTranslationReady) return null;

    return (
        <dialog 
            className="modal"
            id="new-field"
        >
            <div className={`modal-box flex flex-col max-h-[650px] ${index.length > 5 && screen === "menu" ? "max-w-245" : ""}`}>
                <form method="dialog">
                    <button
                        type="submit"
                        className="absolute right-0 top-0 m-5 text-2xl font-nerdfont cursor-pointer z-10"
                    >
                        
                    </button>
                </form>

                {!isSingletype && screen !== "menu" && (
                    <button
                        type="button"
                        className="absolute left-0 top-1 m-5 flex items-center gap-2 cursor-pointer z-10"
                        onClick={() => setScreen("menu")}
                    >
                        <span className="text-xl font-nerdfont leading-none">
                            
                        </span>

                        <span>Back</span>
                    </button>
                )}

                <div className="shrink-0 mb-4">
                    <h3 className="font-nerdfont text-6xl text-center mb-4">
                        
                    </h3>

                    <h3 className="text-center text-2xl font-bold">
                        {screen === "menu" ? "New Field" : `New ${index.find((item) => item.type === type)?.title} Field`}
                    </h3>

                    {screen === "menu" && (
                        <p className="text-center text-sm text-sub py-4">
                            What type of field do you want to add?
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
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
                                <label className="label">
                                    Label
                                </label>

                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder={"What does this field covers?"}
                                    value={label ?? ""}
                                    maxLength={64}
                                    onChange={(e) =>
                                        setLabel(e.target.value)
                                    }
                                />
                            </div>

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

                            <div className="flex flex-col gap-1 mt-1">
                                <label className="label flex gap-2">
                                    Placeholder

                                    <Tooltip content={(
                                        <div className="flex flex-col gap-1 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                            <div>Use the following varibles to display dynamic data from the character.</div>
                                            <br/>
                                            <div><strong>{"{DISPLAY_NAME}"}:</strong> Alice</div>
                                            <div><strong>{"{DISPLAY_NAME_POSSESSIVE}"}:</strong> Alice's</div>
                                        </div>
                                    )}>
                                        <span className="font-nerdfont text-sm"></span>
                                    </Tooltip>
                                </label>

                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder={"What placeholder should this field have?"}
                                    value={placeholder ?? ""}
                                    onChange={(e) =>
                                        setPlaceholder(e.target.value)
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                <label className="label">
                                    Predefined Value
                                </label>

                                <textarea
                                    className="textarea w-full resize-none !h-auto min-h-[2.5rem] [field-sizing:content]"
                                    placeholder={"Text here should assist with filling in the field"}
                                    value={value ?? ""}
                                    onChange={(e) =>
                                        setValue(e.target.value)
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                <label className="label flex gap-2">
                                    Guide

                                    <Tooltip content={(
                                        <div className="flex flex-col gap-1 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                            <div>Use the following varibles to display dynamic data from the character.</div>
                                            <br/>
                                            <div><strong>{"{DISPLAY_NAME}"}:</strong> Alice</div>
                                            <div><strong>{"{DISPLAY_NAME_POSSESSIVE}"}:</strong> Alice's</div>
                                        </div>
                                    )}>
                                        <span className="font-nerdfont text-sm"></span>
                                    </Tooltip>
                                </label>

                                <textarea
                                    className="textarea w-full resize-none !h-auto min-h-[2.5rem] [field-sizing:content]"
                                    placeholder={"Text here should assist with filling in the field"}
                                    value={guide ?? ""}
                                    onChange={(e) =>
                                        setGuide(e.target.value)
                                    }
                                />
                            </div>
                        </fieldset>
                    )}
                </div>

                {screen === "configure" && (
                    <button
                        type="button"
                        className="btn btn-accent w-full shrink-0 mt-4"
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

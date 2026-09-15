import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "../../../_common/components/Tooltip.js";
import { TypeableDropdownInput } from "../../../_common/components/TypeableDropdownInput.js";
import { sortedCategories } from "../../../../_common/scripts/categories.js";

export interface DataProps {
    id: string;
    label: string;
}

interface Props {
    onAddCategory: (data: DataProps) => void;
}

export default function NewCategoryModal({ onAddCategory }: Props) {
    const { t, ready: isTranslationReady } = useTranslation();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [id, setId] = useState<string>("");
    const [label, setLabel] = useState<string>("");
    const [blockTypes, setBlockTypes] = useState<string[]>([]);

    const modal = document.getElementById("new-category") as HTMLDialogElement;

    function resetForm() {
        setLabel("");
        setId("");
    }

    function handleSave() {
        onAddCategory({
            id,
            label
        });

        modal?.close();

        resetForm();
    }

    if (!isTranslationReady) return null;

    return (
        <dialog 
            className="modal"
            id="new-category"
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

                <div className="absolute top-12 left-6 right-6 md:relative md:top-0 md:right-0 md:left-0 pointer-events-none mb-6">
                    <h3 className="font-nerdfont text-6xl text-center mb-4">
                        
                    </h3>

                    <h3 className="text-center text-2xl font-bold">
                        New Category
                    </h3>
                </div>


                <fieldset className="fieldset w-full">
                    <div className="flex flex-col gap-1 mt-1">
                        <label className="label">
                            Label
                        </label>

                        <input
                            type="text"
                            className="input w-full"
                            placeholder={"What does this category covers?"}
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
                            placeholder={"What is the unique id for this category?"}
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
                        <label className="label">
                            Block Types
                        </label>

                        <TypeableDropdownInput
                            multiple
                            value={blockTypes}
                            options={sortedCategories}
                            onChange={(values) => setBlockTypes(values as string[])}
                            placeholder="What block types should be visible in this category?"
                        />
                    </div>
                </fieldset>

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
            </div>
        </dialog>
    );
}

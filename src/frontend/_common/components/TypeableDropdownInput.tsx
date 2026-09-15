import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CheckboxInput } from "./CheckboxInput.js";

export type DropdownOptionValue = string | number;
export type DropdownOption = DropdownOptionValue | { id: DropdownOptionValue; name: string };

interface TypeableDropdownInputProps {
    value?: DropdownOptionValue | DropdownOptionValue[];
    options?: DropdownOption[] | Record<string, string>;
    placeholder?: string;
    typeable?: boolean;
    multiple?: boolean;
    title?: string;
    defaultOpenAbove?: boolean;
    onChange?: (value: unknown) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export const TypeableDropdownInput: React.FC<TypeableDropdownInputProps> = ({
    value = "",
    options = [],
    placeholder,
    typeable = true,
    multiple = false,
    title,
    defaultOpenAbove = false,
    onChange,
    onFocus,
    onBlur,
    onContextMenu,
}) => {
    const { t, ready: isTranslationReady } = useTranslation();

    const normalizedOptions: { id: DropdownOptionValue; name: string }[] = useMemo(() => {
        if (Array.isArray(options)) {
            return options.map((opt) =>
                typeof opt === "object" && opt !== null ? opt : { id: opt, name: String(opt) }
            );
        }

        if (typeof options === "object" && options !== null) {
            return Object.entries(options).map(([id, name]) => ({ id, name }));
        }

        return [];
    }, [options]);

    const selectedValues = useMemo<DropdownOptionValue[]>(() => {
        if (multiple) {
            return Array.isArray(value) ? value : value !== "" && value !== undefined ? [value] : [];
        }
        return [];
    }, [value, multiple]);

    const getDisplayName = useCallback(
        (val: DropdownOptionValue) => {
            const matched = normalizedOptions.find((opt) => opt.id === val || opt.name === val);
            return matched ? matched.name : String(val || "");
        },
        [normalizedOptions]
    );

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openAbove, setOpenAbove] = useState<boolean>(defaultOpenAbove);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>(() => (multiple ? "" : getDisplayName(value as DropdownOptionValue)));
    const [prevValue, setPrevValue] = useState<DropdownOptionValue | DropdownOptionValue[]>(value);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    if (value !== prevValue) {
        setPrevValue(value);
        if (!multiple) {
            setSearchTerm(getDisplayName(value as DropdownOptionValue));
        }
    }

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen && !isMobile) {
            if (defaultOpenAbove) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setOpenAbove(true);
                return;
            }

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const menuMaxHeight = 350;

                setOpenAbove(spaceBelow < menuMaxHeight && rect.top > menuMaxHeight);
            }
        }
    }, [isOpen, isMobile, defaultOpenAbove]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                !isMobile &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                if (isOpen) {
                    setIsOpen(false);
                    onBlur?.();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, isMobile, onBlur]);

    const filteredOptions = useMemo(() => {
        if (!typeable) return normalizedOptions;
        const term = (searchTerm || "").toLowerCase();
        return normalizedOptions.filter((opt) => opt.name.toLowerCase().includes(term));
    }, [normalizedOptions, typeable, searchTerm]);

    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            if (item) {
                item.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex]);

    if (!isTranslationReady) return null;

    const resolvedTitle = title ?? t("components.dropdown.selectOption", "Select Option");
    const resolvedPlaceholder = placeholder ?? t("components.dropdown.selectOrType", "Select or type...");

    const handleClose = () => {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (multiple) setSearchTerm("");
        onBlur?.();
    };

    const handleSelectOption = (opt: { id: DropdownOptionValue; name: string }) => {
        if (multiple) {
            const exists = selectedValues.includes(opt.id);
            const next = exists
                ? selectedValues.filter((v) => v !== opt.id)
                : [...selectedValues, opt.id];
            onChange?.(next);
            setSearchTerm("");
        } else {
            setSearchTerm(opt.name);
            onChange?.(opt.id);
            handleClose();
        }
    };

    const handleRemoveBadge = (valToRemove: DropdownOptionValue, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
            const next = selectedValues.filter((v) => v !== valToRemove);
            onChange?.(next);
        }
    };

    const handleToggleMenu = () => {
        const nextState = !isOpen;

        setIsOpen(nextState);

        if (nextState) {
            if (typeable && !isMobile) inputRef.current?.focus();
            onFocus?.();
        } else {
            onBlur?.();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
                setHighlightedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case "Enter":
            case " ":
                if (isOpen && filteredOptions.length > 0) {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                        handleSelectOption(filteredOptions[highlightedIndex]);
                    } else {
                        handleSelectOption(filteredOptions[0]);
                    }
                }
                break;
            case "Escape":
                handleClose();
                break;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!typeable) return;
        const newVal = e.target.value;
        setSearchTerm(newVal);
        setHighlightedIndex(-1);
        if (!multiple) {
            onChange?.(newVal);
        }
        setIsOpen(true);
    };

    const renderOptionList = () => (
        <ul
            ref={listRef}
            role="listbox"
            onMouseLeave={() => setHighlightedIndex(-1)}
            className={
                isMobile
                    ? "flex scrollbar flex-col w-full h-full min-h-0 overflow-y-auto text-sm"
                    : `flex flex-col absolute z-99999 w-full max-h-80 overflow-y-auto rounded-md bg-base-200 border border-base-300 shadow-2xl text-sm focus:outline-none ${
                          openAbove ? "bottom-full mb-1" : "top-full mt-1"
                      }`
            }
        >
            {filteredOptions.length === 0 ? (
                <li className="flex items-center px-4 h-10 min-h-10 text-sm text-sub w-full text-left">
                    No matching options
                </li>
            ) : (
                filteredOptions.map((opt, i) => {
                    const isHighlighted = i === highlightedIndex;
                    const isSelected = multiple
                        ? selectedValues.includes(opt.id)
                        : opt.name === searchTerm || opt.id === value;

                    return (
                        <li
                            key={opt.id}
                            role="option"
                            aria-selected={isSelected}
                            className="flex items-center w-full h-10 min-h-10 text-sm shrink-0"
                            onMouseEnter={() => setHighlightedIndex(i)}
                        >
                            {multiple ? (
                                <div className="w-full h-10 min-h-10 flex items-center">
                                    <CheckboxInput
                                        label={opt.name}
                                        checked={isSelected ? 1 : 0}
                                        onChange={() => handleSelectOption(opt)}
                                        selected={isSelected || isHighlighted}
                                        isDropdownOption={true}
                                    />
                                </div>
                            ) : (
                                <div
                                    className={`w-full h-10 min-h-10 px-4 flex items-center cursor-pointer transition-colors ${
                                        isHighlighted || isSelected ? "bg-base-300" : ""
                                    }`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectOption(opt);
                                    }}
                                >
                                    <span className="truncate">{opt.name}</span>
                                </div>
                            )}
                        </li>
                    );
                })
            )}
        </ul>
    );

    return (
        <div
            ref={containerRef}
            className="flex flex-col w-full relative"
            onContextMenu={onContextMenu}
        >
            <div className="relative w-full flex flex-col">
                <div
                    className={`input input-bordered bg-base-100 border border-base-300 w-full min-h-10 h-auto py-1.5 pl-3 pr-10 text-sm flex flex-wrap items-center gap-1.5 focus-within:outline-none ${
                        !typeable ? "cursor-pointer select-none" : ""
                    }`}
                    onClick={() => {
                        if (!typeable) {
                            handleToggleMenu();
                        } else {
                            setIsOpen(true);
                            inputRef.current?.focus();
                        }
                    }}
                >
                    {multiple &&
                        selectedValues.map((val) => (
                            <span
                                key={val}
                                className="flex gap-1.5 px-2 py-1 bg-base-200 text-xs text-left border border-base-300 rounded items-center"
                            >
                                {getDisplayName(val)}

                                <button
                                    type="button"
                                    className="cursor-pointer text-error text-xs font-nerdfont leading-none"
                                    onClick={(e) => handleRemoveBadge(val, e)}
                                >
                                    
                                </button>
                            </span>
                        ))}

                    <input
                        ref={inputRef}
                        type="text"
                        readOnly={!typeable}
                        value={searchTerm}
                        placeholder={selectedValues.length > 0 ? "" : resolvedPlaceholder}
                        className={`bg-transparent outline-none flex-1 min-w-[60px] text-sm ${
                            !typeable ? "cursor-pointer select-none caret-transparent" : ""
                        }`}
                        onChange={handleInputChange}
                        onFocus={onFocus}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleToggleMenu}
                    className="absolute right-0 top-0 h-10 flex items-center justify-center px-3 text-sub transition-colors cursor-pointer"
                >
                    <span
                        className={`font-nerdfont flex items-center justify-center text-sm leading-none h-4 w-4 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    >
                        
                    </span>
                </button>
            </div>

            {isOpen && !isMobile && renderOptionList()}

            {isOpen && isMobile && (
                <div className="modal modal-open modal-bottom sm:modal-middle z-99999 fixed inset-0">
                    <div className="modal-box bg-base-100 p-5 relative flex flex-col w-full max-w-md h-[90vh] max-h-[90vh] z-99999">
                        <button
                            type="button"
                            className="cursor-pointer absolute right-0 top-0 m-5 text-2xl font-nerdfont z-30"
                            onClick={handleClose}
                        >
                            
                        </button>

                        <div className="flex flex-col w-full h-full min-h-0 space-y-4">
                            <h3 className="font-bold text-2xl text-center w-full pt-1 shrink-0 mb-6">
                                {resolvedTitle}
                            </h3>

                            {typeable && (
                                <input
                                    type="text"
                                    className="input input-bordered w-full text-sm text-left focus:outline-none shrink-0"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                />
                            )}

                            <div className="flex-1 min-h-0 w-full overflow-hidden">
                                {renderOptionList()}
                            </div>
                        </div>
                    </div>
                    <form
                        method="dialog"
                        className="modal-backdrop z-99998 fixed inset-0 bg-black/50"
                        onClick={handleClose}
                    >
                        <button>close</button>
                    </form>
                </div>
            )}
        </div>
    );
};

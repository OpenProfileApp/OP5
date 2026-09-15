import React from "react";

interface Props {
    label: string;
    checked: boolean | number | string;
    onChange: (checked: 1 | 0) => void;
    disabled?: boolean;
    className?: string;
    selected?: boolean;
    isDropdownOption?: boolean;
}

export const CheckboxInput: React.FC<Props> = ({
    label,
    checked,
    onChange,
    disabled = false,
    className = "",
    selected = false,
    isDropdownOption = false
}) => {
    const isChecked = checked === true || checked === 1 || checked === "true";

    return (
        <label
            className={`
                flex items-center gap-2 w-full px-3 h-10 transition-colors 
                ${!isDropdownOption ? "rounded border border-base-300" : ""}
                ${selected ? "bg-base-200" : "bg-base-100"}
                ${disabled ? "text-[#636363] cursor-not-allowed" : "cursor-pointer"} 
                ${className}
            `}
        >
            <input
                type="checkbox"
                className={`checkbox rounded h-5 w-5 bg-base-200 ${
                    disabled ? "cursor-not-allowed" : ""
                }`}
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            />

            <span className="text-sm flex-1 truncate">
                {label}
            </span>
        </label>
    );
};

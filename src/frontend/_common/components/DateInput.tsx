import React, { useEffect, useState } from "react";
import { TypeableDropdownInput } from "./TypeableDropdownInput.js";

interface Props {
    value?: string;
    onChange: (value: string) => void;
}

interface Option {
    id: string;
    name: string;
}

export const DateInput: React.FC<Props> = ({ value = "", onChange }) => {
    const parseValue = (val: string) => {
        const parts = val ? val.split("-") : [];
        return {
            year: parts[0] ?? "",
            month: parts[1] ?? "",
            day: parts[2] ?? "",
        };
    };

    const [dateState, setDateState] = useState(() => parseValue(value));

    useEffect(() => {
        const parts = [];
        if (dateState.year) parts.push(dateState.year);
        if (dateState.year && dateState.month) parts.push(dateState.month);
        if (dateState.year && dateState.month && dateState.day) parts.push(dateState.day);

        const currentFormatted = parts.join("-");

        if (value !== currentFormatted) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDateState(parseValue(value));
        }
    }, [dateState.day, dateState.month, dateState.year, value]);

    const currentYear = new Date().getFullYear();

    const yearOptions: Option[] = [
        { id: "", name: "Year" },
        ...Array.from({ length: 100 }, (_, i) => {
            const y = String(currentYear - i);
            return { id: y, name: y };
        })
    ];

    const monthOptions: Option[] = [
        { id: "", name: "Month" },
        { id: "01", name: "January" },
        { id: "02", name: "February" },
        { id: "03", name: "March" },
        { id: "04", name: "April" },
        { id: "05", name: "May" },
        { id: "06", name: "June" },
        { id: "07", name: "July" },
        { id: "08", name: "August" },
        { id: "09", name: "September" },
        { id: "10", name: "October" },
        { id: "11", name: "November" },
        { id: "12", name: "December" },
    ];

    const { year, month, day } = dateState;

    const daysInMonth = month && year ? new Date(Number(year), Number(month), 0).getDate() : 31;
    const dayOptions: Option[] = [
        { id: "", name: "Day" },
        ...Array.from({ length: daysInMonth }, (_, i) => {
            const d = String(i + 1).padStart(2, "0");
            return { id: d, name: String(i + 1) };
        })
    ];

    const updateField = (field: "year" | "month" | "day", selectedId: string) => {
        const newYear = field === "year" ? selectedId : year;
        let newMonth = field === "month" ? selectedId : month;
        let newDay = field === "day" ? selectedId : day;

        if (!newYear) {
            newMonth = "";
            newDay = "";
        } else if (!newMonth) {
            newDay = "";
        }

        if (newYear && newMonth && newDay) {
            const maxDays = new Date(Number(newYear), Number(newMonth), 0).getDate();
            if (Number(newDay) > maxDays) {
                newDay = String(maxDays).padStart(2, "0");
            }
        }

        const newState = { year: newYear, month: newMonth, day: newDay };
        setDateState(newState);

        if (newYear && newMonth && newDay) {
            onChange(`${newYear}-${newMonth}-${newDay}`);
        } else if (newYear && newMonth) {
            onChange(`${newYear}-${newMonth}`);
        } else if (newYear) {
            onChange(newYear);
        } else {
            onChange("");
        }
    };

    return (
        <div className="flex gap-2">
            <div className="flex-12">
                <TypeableDropdownInput
                    value={month}
                    options={monthOptions}
                    placeholder="Month"
                    typeable={false}
                    onChange={(val) => updateField("month", val as string)}
                />
            </div>

            <div className="flex-5">
                <TypeableDropdownInput
                    value={day}
                    options={dayOptions}
                    placeholder="Day"
                    typeable={false}
                    onChange={(val) => updateField("day", val as string)}
                />
            </div>

            <div className="flex-5">
                <TypeableDropdownInput
                    value={year}
                    options={yearOptions}
                    placeholder="Year"
                    typeable={false}
                    onChange={(val) => updateField("year", val as string)}
                />
            </div>
        </div>
    );
};

import { DateTime } from "luxon";

export function formatRemainingTime(remainingMs: number) {
    if (remainingMs <= 0) return "";

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s left`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s left`;
    }

    return `${seconds}s left`;
}

export function getRemainingTimeIcon(timeText: string) {
    if (!timeText || timeText === "Indefinitely") return "󰂛";

    if (timeText.includes("h")) {
        const hours = parseInt(timeText, 10);

        if (hours >= 24) return "󱑊";
        if (hours >= 23) return "󱑉";
        if (hours >= 22) return "󱑈";
        if (hours >= 21) return "󱑇";
        if (hours >= 20) return "󱑆";
        if (hours >= 19) return "󱑅";
        if (hours >= 18) return "󱑄";
        if (hours >= 17) return "󱑃";
        if (hours >= 16) return "󱑂";
        if (hours >= 15) return "󱑁";
        if (hours >= 14) return "󱑀";
        if (hours >= 13) return "󱐿";
        if (hours >= 12) return "󱑊";
        if (hours >= 11) return "󱑉";
        if (hours >= 10) return "󱑈";
        if (hours >= 9)  return "󱑇";
        if (hours >= 8)  return "󱑆";
        if (hours >= 7)  return "󱑅";
        if (hours >= 6)  return "󱑄";
        if (hours >= 5)  return "󱑃";
        if (hours >= 4)  return "󱑂";
        if (hours >= 3)  return "󱑁";
        if (hours >= 2)  return "󱑀";
        if (hours >= 1)  return "󱐿";
    }

    return "󱑊";
}

export function formatLongRelative(date: string | number | Date | undefined) {
    if (!date) return "0 seconds ago";

    let past: Date;
    let isYearOnly = false;
    let isYearMonthOnly = false;

    if (typeof date === "string") {
        const trimmed = date.trim();
        if (/^\d{4}$/.test(trimmed)) {
            isYearOnly = true;
            past = new Date(`${trimmed}-01-01T00:00:00`);
        } else if (/^\d{4}-(?:0[1-9]|1[0-2])$/.test(trimmed)) {
            isYearMonthOnly = true;
            past = new Date(`${trimmed}-01T00:00:00`);
        } else {
            past = new Date(date);
        }
    } else {
        past = new Date(date);
    }

    if (isNaN(past.getTime())) return "0 seconds ago";

    const now = new Date();
    if (now.getTime() <= past.getTime()) return "0 seconds ago";

    let years = now.getFullYear() - past.getFullYear();
    let months = now.getMonth() - past.getMonth();
    let days = now.getDate() - past.getDate();

    if (days < 0) {
        months -= 1;
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    if (isYearOnly) {
        return years > 0 ? `${years} year${years !== 1 ? "s" : ""} ago` : "0 seconds ago";
    }

    if (isYearMonthOnly) {
        if (years > 0) return `${years} year${years !== 1 ? "s" : ""} ago`;
        if (months > 0) return `${months} month${months !== 1 ? "s" : ""} ago`;
        return "0 seconds ago";
    }

    if (years > 0) return `${years} year${years !== 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months !== 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago`;

    const diffMs = now.getTime() - past.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (seconds > 0) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;

    return "0 seconds ago";
}

export function formatShortRelative(dateInput?: string | number | Date): string {
    if (!dateInput) return "N/A";

    if (typeof dateInput === "string") {
        const trimmed = dateInput.trim();

        if (/^\d{4}$/.test(trimmed)) {
            return trimmed;
        }

        if (/^\d{4}-(?:0[1-9]|1[0-2])$/.test(trimmed)) {
            const dt = DateTime.fromISO(`${trimmed}-01`);
            return dt.isValid ? dt.toFormat("LLLL yyyy") : trimmed;
        }
    }

    let dt: DateTime;

    if (typeof dateInput === "number") {
        dt = DateTime.fromMillis(dateInput);
    } else if (typeof dateInput === "string") {
        dt = DateTime.fromISO(dateInput);
    } else {
        dt = DateTime.fromJSDate(dateInput);
    }

    dt = dt.toLocal();

    if (!dt.isValid) return "N/A";

    const now = DateTime.now();
    const diffHours = Math.abs(now.diff(dt, "hours").hours);

    if (diffHours < 48) {
        return dt.toRelative({ style: "short" }) ?? "0 seconds ago";
    }

    return dt.toFormat("LLLL d, yyyy");
}

export function isBirthdayToday(dateInput?: string | number | Date): boolean {
    if (!dateInput) return false;

    let dt: DateTime;

    if (typeof dateInput === "number") {
        dt = DateTime.fromMillis(dateInput);
    } else if (typeof dateInput === "string") {
        dt = DateTime.fromISO(dateInput);
    } else {
        dt = DateTime.fromJSDate(dateInput);
    }

    dt = dt.toLocal();

    if (!dt.isValid) return false;

    const now = DateTime.now();
    return dt.month === now.month && dt.day === now.day;
}

import { useTranslation } from "react-i18next";
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import { GetUserItemType, PresenceType } from "../../../../_common/types/user.type.js";
import ImageInput from "../../../_common/components/ImageInput.js";
import { useObjectURL } from "../../../_common/hooks/useObjectURL.hook.js";
import ColorInput from "../../../_common/components/ColorInput.js";
import { TypeableDropdownInput } from "../../../_common/components/TypeableDropdownInput.js";
import UserCard from "../UserCard.js";
import { apiBaseUrl, cdnBaseUrl } from "../../../_common/scripts/domains.js";
import ExternalLink from "../../../_common/components/ExternalLink.js";
import { GetLinkType } from "../../../../_common/types/link.type.js";
import { VisibilityType } from "../../../../_common/types/visibility.type.js";
import { Tooltip } from "../../../_common/components/Tooltip.js";
import { toast } from "../../../_common/scripts/toast.js";
import { DateInput } from "../../../_common/components/DateInput.js";
import { CheckboxInput } from "../../../_common/components/CheckboxInput.js";
import { recommendedTags } from "../../../_common/scripts/tags.js";

export interface EditUserProfileModalRef {
    open: (
        incomingData: GetUserItemType,
        onSave?: (updatedData: GetUserItemType) => void
    ) => Promise<GetUserItemType | null>;
    close: () => void;
}

type UsernameItem = NonNullable<GetUserItemType["usernames"]>[number] & { _id: string };
type LinkItem = NonNullable<GetUserItemType["links"]>[number] & { _id: string };

type UserLinkItem = {
    _id: string;
    url?: string;
};

interface SortableUsernameItemProps {
    item: UsernameItem;
    index: number;
    totalCount: number;
    onChange: (value: string) => void;
    onDelete: () => void;
}

interface SortableLinkItemProps {
    item: UserLinkItem;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onChangeUrl: (url: string) => void;
    onDelete: () => void;
}

function SortableUsernameItem({
    item,
    index,
    totalCount,
    onChange,
    onDelete,
}: SortableUsernameItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: item._id,
    });

    const roundingClass =
        totalCount === 1 || totalCount === 2
            ? "rounded"
            : index === 0
            ? "rounded"
            : index === 1
            ? "rounded-t"
            : index === 2
            ? "rounded-b"
            : "";

    return (
        <>
            {index === 0 && <div className="divider text-xs my-3">Primary Username</div>}
            {index === 1 && <div className="divider text-xs my-3">Aliases</div>}

            <div
                ref={setNodeRef}
                className={`
                    text-xs w-full border border-base-300 p-3 flex items-center gap-3
                    ${index % 2 === 0 ? "bg-base-200" : "bg-[#151515]"}
                    ${roundingClass}
                `}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                }}
            >
                <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 flex items-center justify-center p-1"
                    {...attributes}
                    {...listeners}
                >
                    <span className="font-nerdfont text-xl leading-none">
                        󰇝
                    </span>
                </button>

                <div className="flex-1 flex flex-col gap-1">
                    <div className="relative flex items-center">
                        <span className="absolute left-3 text-sub font-nerdfont text-sm select-none z-1">
                            󰁥
                        </span>

                        <input
                            type="text"
                            className="input w-full pl-7"
                            placeholder="username"
                            value={item.username || ""}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className="text-error w-8 cursor-pointer"
                    onClick={onDelete}
                >
                    <span className="font-nerdfont text-lg leading-none"></span>
                </button>
            </div>
        </>
    );
}

function SortableLinkItem({
    item,
    index,
    isFirst,
    isLast,
    onChangeUrl,
    onDelete,
}: SortableLinkItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: item._id,
    });

    const [debouncedUrl, setDebouncedUrl] = useState(item.url ?? "");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUrl(item.url ?? "");
        }, 500);

        return () => clearTimeout(timer);
    }, [item.url]);

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={`
                text-xs w-full border border-base-300 p-3 transition-colors flex items-center gap-3
                ${index % 2 === 0 ? "bg-base-200" : "bg-[#151515]"}
                ${isFirst ? "rounded-t" : ""}
                ${isLast ? "rounded-b" : ""}
            `}
        >
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 flex items-center justify-center p-1"
                {...attributes}
                {...listeners}
            >
                <span className="font-nerdfont text-xl leading-none">
                    󰇝
                </span>
            </button>

            <ExternalLink 
                url={debouncedUrl as string} 
                isPreview={true}
            />

            <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full">
                    <input
                        type="url"
                        className="input w-full"
                        placeholder="https://example.com"
                        value={item.url ?? ""}
                        onChange={(e) => onChangeUrl(e.target.value)}
                    />
                </div>
            </div>

            <button
                type="button"
                className="text-error w-8 cursor-pointer"
                onClick={onDelete}
            >
                <span className="font-nerdfont text-lg leading-none"></span>
            </button>
        </div>
    );
}

const EditUserProfileModal = forwardRef<EditUserProfileModalRef>((_, ref) => {
    const { t, ready: isTranslationReady } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const onSaveRef = useRef<((updatedData: GetUserItemType) => void) | null>(null);

    const [data, setData] = useState<GetUserItemType | null>(null);
    const [initialData, setInitialData] = useState<GetUserItemType | null>(null);

    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [activeTab, setActiveTab] = useState("appearance");

    const [avatar, setAvatar] = useState<File | null>(null);
    const [animatedAvatar, setAnimatedAvatar] = useState<File | null>(null);

    const [banner, setBanner] = useState<File | null>(null);

    const avatarUrl = useObjectURL(avatar);
    const animatedAvatarUrl = useObjectURL(animatedAvatar);

    const bannerUrl = useObjectURL(banner);

    const isPremium = window.session.permissions.array.includes("PREMIUM_ACCESS");

    const resetState = () => {
        setData(null);
        setInitialData(null);
        setActiveTab("appearance");
        setAvatar(null);
        setAnimatedAvatar(null);
        setBanner(null);
    };

    useImperativeHandle(ref, () => ({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        open: (
            incomingData: GetUserItemType,
            onSave?: (updatedData: GetUserItemType) => void
        ) => {
            onSaveRef.current = onSave || null;

            const cloned = structuredClone(incomingData);

            if (cloned.usernames) {
                cloned.usernames = cloned.usernames.map((username, i) => ({
                    ...username,
                    _id: (username as UsernameItem)._id || `username-${Date.now()}-${i}`,
                }));
            } else {
                cloned.usernames = [
                    {
                        _id: `username-${Date.now()}-0`,
                        isPrimary: true,
                        username: "",
                    } as UsernameItem,
                ];
            }

            if (cloned.links) {
                cloned.links = cloned.links.map((link, i) => ({
                    ...link,
                    _id: (link as LinkItem)._id || `link-${Date.now()}-${i}`,
                })) as GetLinkType[];
            } else {
                cloned.links = [];
            }

            setData(cloned);
            setInitialData(structuredClone(cloned));

            setTimeout(() => {
                dialogRef.current?.showModal();
            }, 0);
        },
        close: () => {
            dialogRef.current?.close();
            resetState();
        },
    }));

    const handleClose = () => {
        dialogRef.current?.close();
        resetState();
    };

    const handleFieldChange = <K extends keyof GetUserItemType>(
        field: K,
        value: GetUserItemType[K]
    ) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    const handleUsernameDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !data?.usernames) return;

        const oldIndex = data.usernames.findIndex(
            (u) => (u as UsernameItem)._id === active.id
        );
        const newIndex = data.usernames.findIndex(
            (u) => (u as UsernameItem)._id === over.id
        );

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(data.usernames, oldIndex, newIndex).map(
                (item, idx) => ({
                    ...item,
                    isPrimary: idx === 0,
                })
            );

            handleFieldChange("usernames", reordered);
        }
    };

    const handleUsernameChange = (index: number, newUsername: string) => {
        if (!data?.usernames) return;
        const updated = [...data.usernames];
        if (updated[index]) {
            updated[index] = {
                ...updated[index],
                username: newUsername,
            };
            handleFieldChange("usernames", updated);
        }
    };

    const handleAddUsername = () => {
        if (!data) return;

        const currentList = data.usernames || [];

        if (currentList.length >= 3) return;

        const newItem: UsernameItem = {
            _id: `username-${Date.now()}-${currentList.length}`,
            isPrimary: currentList.length === 0,
            username: "",
        } as UsernameItem;

        handleFieldChange("usernames", [...currentList, newItem]);
    };

    const handleDeleteUsername = (index: number) => {
        if (!data?.usernames) return;
        
        const updated = data.usernames
            .filter((_, i) => i !== index)
            .map((item, idx) => ({
                ...item,
                isPrimary: idx === 0
            }));

        handleFieldChange("usernames", updated);
    };

    const linksList: LinkItem[] = (data?.links as LinkItem[]) || [];

    const handleLinksDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = linksList.findIndex((link) => link._id === active.id);
        const newIndex = linksList.findIndex((link) => link._id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(linksList, oldIndex, newIndex);
            handleFieldChange("links", reordered);
        }
    };

    const handleLinkChange = (index: number, field: "url", value: string) => {
        const updated = [...linksList];
        if (updated[index]) {
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            handleFieldChange("links", updated);
        }
    };

    const handleAddLink = () => {
        if (linksList.length >= 15) return;
        
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const newLink: LinkItem = {
            _id: `link-${Date.now()}-${linksList.length}`,
            url: "https://",
        };
        handleFieldChange("links", [...linksList, newLink]);
    };

    const handleDeleteLink = (index: number) => {
        const updated = linksList.filter((_, i) => i !== index);
        handleFieldChange("links", updated);
    };

    const currentTags: string[] = Array.isArray(data?.tags)
        ? data?.tags
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        : typeof data?.tags === "string" && data?.tags?.trim().length > 0
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ? data.tags?.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    const [tagInput, setTagInput] = useState("");
    const tagRegex = /^[a-z-]+$/;

    const handleAddTag = () => {
        const trimmed = tagInput.trim().toLowerCase();
        if (!trimmed) return;

        if (trimmed.length < 3 || trimmed.length > 24) {
            toast.show(
                "Tags must be between 3 and 24 characters", 
                { type: "error" }
            );
            return;
        }

        if (!tagRegex.test(trimmed)) {
            toast.show(
                "Tags can only contain a-z and dashes", 
                { type: "error" }
            );
            return;
        }

        if (currentTags.includes(trimmed)) {
            toast.show(
                "Tag already added", 
                { type: "error" }
            );
            return;
        }

        if (currentTags.length >= 10) {
            toast.show(
                "You have reached the maximum amount (10) of tags.", 
                { type: "error" }
            );
            return;
        }

        handleFieldChange("tags", [...currentTags, trimmed]);

        setTagInput("");
    };

    const handleDeleteTag = (indexToDelete: number) => {
        const updated = currentTags.filter((_, i) => i !== indexToDelete);

        handleFieldChange("tags", updated);
    };

    function omitId<T>(obj: T): T {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(omitId) as unknown as T;
        }

        const cleanObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key !== "_id") {
                cleanObj[key] = omitId(value);
            }
        }
        return cleanObj as T;
    }

    function getChangedData(
        data: GetUserItemType,
        initialData: GetUserItemType
    ) {
        const result: Partial<GetUserItemType> = {};

        const cleanData = omitId(data);
        const cleanInitial = omitId(initialData);

        for (const k in cleanData) {
            const key = k as keyof GetUserItemType;

            if (JSON.stringify(cleanData[key]) !== JSON.stringify(cleanInitial?.[key])) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[key] = cleanData[key];
            }
        }

        return result;
    }

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const response = await fetch(`${apiBaseUrl}/v3/users/update/${data?.id}`, {
                credentials: "include", 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ 
                    data: getChangedData(
                        data as GetUserItemType, 
                        initialData as GetUserItemType
                    ) 
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                if (onSaveRef.current) {
                    onSaveRef?.current(data as GetUserItemType);
                }

                handleClose();

                setIsSaving(false);

                toast.show(
                    t("defaults.savedYourProfile"),
                    { type: "success" }
                );
            } else {
                setIsSaving(false);

                toast.show(
                    t("defaults.failedToSaveProfile"),
                    {
                        subtext: `${responseData.id || ""}${responseData.id ? ": " : ""}${responseData.message}`,
                        type: "error",
                    }
                );
            }
        } catch (error) {
            console.error(`Failed to save profile:`, error);
        }
    };

    if (!isTranslationReady || !data) return null;

    const currentAvatar = avatar !== null ? avatarUrl ?? undefined : data.avatar;
    const currentAnimatedAvatar = avatar !== null ? animatedAvatarUrl ?? undefined : data.animatedAvatar;

    const currentBanner = banner !== null ? bannerUrl ?? undefined : data.banner;

    const previewData: GetUserItemType = {
        ...data,
        avatar: currentAvatar,
        animatedAvatar: currentAnimatedAvatar,
        banner: currentBanner,
    };

    const avatarInputDefaultUrl = data.avatar
        ? data.avatar.startsWith("blob:") || data.avatar.startsWith("data:")
            ? data.avatar
            : `${cdnBaseUrl}${data.avatar}`
        : null;

    const bannerInputDefaultUrl = data.banner
        ? data.banner.startsWith("blob:") || data.banner.startsWith("data:")
            ? data.banner
            : `${cdnBaseUrl}${data.banner}`
        : null;

    const usernameItems = (data.usernames || []) as UsernameItem[];

    return (
        <dialog ref={dialogRef} className="modal" onClose={resetState}>
            <div className="modal-box max-w-235">
                <form method="dialog">
                    <button
                        type="button"
                        className="cursor-pointer absolute right-0 top-0 m-5 text-2xl font-nerdfont z-30"
                        onClick={handleClose}
                    >
                        
                    </button>
                </form>

                <h3 className="font-bold text-2xl text-center pb-6">
                    {t("words.EditProfile")}
                </h3>

                <div className="flex flex-col md:flex-row">
                    <div className="w-full">
                        <div className="relative md:right-3 tabs tabs-border flex w-full">
                            <button
                                type="button"
                                className={`tab bg-base-200 flex-1 ${
                                    activeTab === "appearance" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("appearance")}
                            >
                                Appearance
                            </button>

                            <button
                                type="button"
                                className={`tab bg-base-200 flex-1 ${
                                    activeTab === "overview" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("overview")}
                            >
                                Overview
                            </button>

                            <button
                                type="button"
                                className={`tab bg-base-200 flex-1 ${
                                    activeTab === "usernames" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("usernames")}
                            >
                                Usernames
                            </button>

                            <button
                                type="button"
                                className={`tab bg-base-200 flex-1 ${
                                    activeTab === "links" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("links")}
                            >
                                Links
                            </button>

                            <button
                                type="button"
                                className={`tab bg-base-200 flex-1 ${
                                    activeTab === "privacy" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("privacy")}
                            >
                                Privacy
                            </button>

                            <button
                                type="button"
                                className={`md:hidden tab bg-base-200 flex-1 ${
                                    activeTab === "preview" ? "tab-active" : ""
                                }`}
                                onClick={() => setActiveTab("preview")}
                            >
                                Preview
                            </button>
                        </div>

                        <div className="border-base-300 pt-3 md:pr-6 rounded-b overflow-x-hidden overflow-y-auto h-108">
                            {activeTab === "appearance" && (
                                <fieldset className="fieldset w-full">
                                    <div className="flex gap-3">
                                        <div className="w-32">
                                            <label className="label mb-1">
                                                Avatar
                                            </label>

                                            <ImageInput
                                                value={animatedAvatar || avatar}
                                                defaultUrl={avatarInputDefaultUrl}
                                                animatedDefaultUrl={data.animatedAvatar ? `${cdnBaseUrl}${data.animatedAvatar}` : null}
                                                onChange={(file, base64Url, staticPreviewFile, staticPreviewBase64) => {
                                                    if (file && file.size > 1 * 1024 * 1024) {
                                                        toast.show("File is too large (1 MB maximum)", { type: "error" });
                                                        return;
                                                    }
                                                    
                                                    const isGif = file?.type === "image/gif";

                                                    setAvatar(staticPreviewFile || file);
                                                    setAnimatedAvatar(isGif ? file : null);

                                                    const staticBase64 = staticPreviewBase64 || base64Url;
                                                    const animatedBase64 = isGif ? base64Url : null;

                                                    handleFieldChange("avatar", staticBase64 as GetUserItemType["avatar"]);
                                                    handleFieldChange("animatedAvatar", animatedBase64 as GetUserItemType["animatedAvatar"]);
                                                }}
                                                accept={`image/png, image/jpeg, image/jpg${isPremium ? ", image/gif" : ""}`}
                                                aspectRatio={1}
                                                height="32"
                                                width="32"
                                                label="avatar"
                                            />
                                        </div>

                                        <div className="w-full">
                                            <label className="label mb-1">
                                                Banner
                                            </label>

                                            <ImageInput
                                                value={banner}
                                                defaultUrl={bannerInputDefaultUrl}
                                                onChange={(file, base64Url) => {
                                                    
                                                    if (file && file.size > 1 * 1024 * 1024) {
                                                        toast.show("File is too large (1 MB maximum)", { type: "error" });
                                                        return;
                                                    }

                                                    setBanner(file);

                                                    handleFieldChange(
                                                        "banner",
                                                        base64Url as GetUserItemType["banner"]
                                                    );
                                                }}
                                                accept="image/png, image/jpeg, image/jpg"
                                                aspectRatio={2}
                                                height="32"
                                                width="full"
                                                label="banner"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label">
                                            Display Name ({(data.displayName ?? "").length}/32)
                                        </label>

                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder={
                                                initialData?.displayName ||
                                                "What is your display name?"
                                            }
                                            value={data.displayName ?? ""}
                                            maxLength={32}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "displayName",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="divider text-xs my-0 mt-3">
                                        <span 
                                            className="flex gap-2 tooltip" 
                                            data-tip="Premium Feature"
                                        >
                                            Activity
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label flex gap-2">
                                            Presence

                                            <Tooltip content={(
                                                <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                    <div><strong>Online:</strong> Standard online mode that automatically updates to idle if inactive.</div>
                                                    <div><strong>Do Not Disturb:</strong> You will not be notified of notifications. They will still appear in your notifications page.</div>
                                                    <div><strong>Offline:</strong> You appear offline to everyone.</div>
                                                </div>
                                            )}>
                                                <span className="font-nerdfont text-sm"></span>
                                            </Tooltip>
                                        </label>

                                        <TypeableDropdownInput
                                            value={
                                                data.presence === "dnd" ? "Do Not Disturb" : data.presence.charAt(0).toUpperCase() + data.presence.slice(1).toLowerCase()
                                            }
                                            options={[
                                                { id: "online", name: "Online" },
                                                { id: "dnd", name: "Do Not Disturb" },
                                                { id: "offline", name: "Offline" }
                                            ]}
                                            placeholder="Select Option"
                                            typeable={false}
                                            onChange={(option) =>
                                                handleFieldChange(
                                                    "presence",
                                                    option as PresenceType
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label">
                                            Status ({(data.status ?? "").length}/160)
                                        </label>

                                        <textarea
                                            className="textarea w-full resize-none !h-auto min-h-[2.5rem] [field-sizing:content]"
                                            placeholder={
                                                initialData?.status || "What is on your mind?"
                                            }
                                            value={data.status ?? ""}
                                            rows={1}
                                            maxLength={160}
                                            onChange={(e) =>
                                                handleFieldChange("status", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="divider text-xs my-0 mt-3">
                                        <span 
                                            className="flex gap-2 tooltip" 
                                            data-tip="Premium Feature"
                                        >
                                            Aura
                                            <span className="font-nerdfont leading-none text-sm text-premium"></span>
                                        </span>
                                    </div>

                                    <CheckboxInput
                                        label="Aura"
                                        checked={data.isAuraEnabled}
                                        disabled={!isPremium}
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        onChange={(checked) => handleFieldChange("isAuraEnabled", checked)}
                                    />

                                    <div className="flex gap-3">
                                        <div className="w-full">
                                            <label className="label mb-1">
                                                Primary
                                            </label>
                                           
                                            <ColorInput
                                                placeholder={
                                                    initialData?.auraPrimary || "#000000"
                                                }
                                                value={data.auraPrimary || "#000000"}
                                                disabled={!isPremium}
                                                onChange={(val) =>
                                                    handleFieldChange(
                                                        "auraPrimary",
                                                        val
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="w-full">
                                            <label className="label mb-1">
                                                Secondary
                                            </label>

                                            <ColorInput
                                                placeholder={
                                                    initialData?.auraSecondary || "#000000"
                                                }
                                                value={data.auraSecondary || "#000000"}
                                                disabled={!isPremium}
                                                onChange={(val) =>
                                                    handleFieldChange(
                                                        "auraSecondary",
                                                        val
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    
                                    {
                                        (data?.id === "5719552362357773" ||
                                        data?.id === "5019646586243236")
                                    && (
                                        <>
                                            <div className="divider text-xs my-0 mt-3">
                                                <span 
                                                    className="flex gap-2 tooltip" 
                                                    data-tip="Experimental Feature"
                                                >
                                                    Overrides
                                                    <span className="font-nerdfont leading-none text-sm text-nightly"></span>
                                                </span>
                                            </div>

                                            <CheckboxInput
                                                label="Dragonights Fanflair"
                                                checked={data.fanflair as unknown as boolean}
                                                onChange={(checked) => handleFieldChange("fanflair", checked ? "true" : "false")}
                                            />
                                        </>
                                    )}
                                </fieldset>
                            )}

                            {activeTab === "overview" && (
                                <fieldset className="fieldset w-full">
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label">
                                            Account Type
                                        </label>

                                        <TypeableDropdownInput
                                            value={
                                                data.type.charAt(0).toUpperCase() + data.type.slice(1).toLowerCase()
                                            }
                                            options={[
                                                { id: "user", name: "User" },
                                                { id: "author", name: "Author" },
                                                { id: "publisher", name: "Publisher" },
                                            ]}
                                            placeholder="Select Option"
                                            typeable={false}
                                            onChange={(option) =>
                                                handleFieldChange(
                                                    "type",
                                                    option as string
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="label flex gap-2">
                                            Content Flags

                                            <Tooltip content={(
                                                <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                    <div>
                                                        <strong>Sensitive Content (viewable by everyone):</strong>
                                                        <br />
                                                        Your content includes sensitive themes, such as trauma, severe mental health struggles (e.g., self-harm or suicide), grief, hate speech, abuse, minor gore, or non-sexual revealing clothing.
                                                    </div>

                                                    <div>
                                                        <strong>Mature Content (18+ accounts only):</strong>
                                                        <br />
                                                        Your content includes themes restricted to adult audiences due to explicit detail, such as graphic violence, suggestive sexual content, severe profanity, explicit substance abuse, simulated gambling, or sexually suggestive revealing clothing.
                                                    </div>
                                                </div>
                                            )}>
                                                <span className="font-nerdfont text-sm"></span>
                                            </Tooltip>
                                        </label>

                                        <div className="flex gap-2">
                                            <CheckboxInput
                                                label="Sensitive Content"
                                                checked={data.isSensitive}
                                                className="mt-1"
                                                onChange={(checked) => handleFieldChange("isSensitive", checked as unknown as boolean)}
                                            />

                                            <CheckboxInput
                                                label="Mature Content"
                                                checked={data.isMature}
                                                className="mt-1"
                                                onChange={(checked) => handleFieldChange("isMature", checked as unknown as boolean)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label">About ({`${data.about?.length}/320`})</label>

                                        <textarea
                                            className="textarea w-full resize-none !h-auto min-h-[2.5rem] [field-sizing:content]"
                                            placeholder={
                                                initialData?.about || "Tell us about yourself..."
                                            }
                                            value={data.about ?? ""}
                                            maxLength={320}
                                            onChange={(e) =>
                                                handleFieldChange("about", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="divider text-xs my-0 mt-3">
                                        <span className="flex gap-2">
                                            {data.type !== "publisher" ? "Personal" : "Business"}
                                        </span>
                                    </div>

                                    {data.type !== "publisher" ? (
                                        <>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <label className="label">
                                                    Pronouns
                                                </label>

                                                <input
                                                    type="text"
                                                    className="input w-full"
                                                    placeholder={
                                                        initialData?.pronouns ||
                                                        "What are your pronouns?"
                                                    }
                                                    value={data.pronouns ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            "pronouns",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="label flex gap-2">
                                                    Birth Date

                                                    <Tooltip content={(
                                                        <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                            <div>Friends can view by default. You can update its visibility in the privacy tab.</div>
                                                        </div>
                                                    )}>
                                                        <span className="font-nerdfont text-sm"></span>
                                                    </Tooltip>
                                                </label>

                                                <DateInput
                                                    value={data.birthDate ?? ""}
                                                    onChange={(value) => handleFieldChange("birthDate", value)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <label className="label flex gap-2">
                                                Founded Date
                                            </label>

                                            <DateInput
                                                value={data.foundedDate ?? ""}
                                                onChange={(value) => handleFieldChange("foundedDate", value)}
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="label">
                                            Location
                                        </label>

                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder={
                                                initialData?.location ||
                                                "Where are you located (physically or mentally)?"
                                            }
                                            value={data.location ?? ""}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "location",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="divider text-xs my-0 mt-3">
                                        <span className="flex gap-2">
                                            Tags ({`${currentTags.length}/10`})
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className={`flex flex-wrap gap-1 ${currentTags.length > 0 ? "mb-1" : ""}`}>
                                            {currentTags.map((tag, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-2 items-center justify-center rounded-full bg-base-100 text-xs px-3 py-1 border border-base-300"
                                                >
                                                    <span className="font-nerdfont leading-none"></span>

                                                    <span className="mb-0.5">{tag}</span>

                                                    <button
                                                        type="button"
                                                        className="cursor-pointer text-error text-xs font-nerdfont leading-none"
                                                        onClick={() => handleDeleteTag(index)}
                                                    >
                                                        
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {!recommendedTags.some(item => currentTags.includes(item.tag)) && (
                                            <div className="flex gap-1 items-center">
                                                <span>Missing an optional, but recommended category tag</span>

                                                <Tooltip 
                                                    content={(
                                                        <div className="flex flex-col gap-1 p-2 bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                            {recommendedTags.map(item => (
                                                                <div key={item.tag}><strong className="mr-1">#</strong>{item.tag}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                >
                                                    <span className="font-nerdfont text-sm"></span>
                                                </Tooltip>
                                            </div>
                                        )}

                                        {currentTags.length < 10 && (
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute z-1 font-nerdfont leading-none left-3 top-1/2 -translate-y-1/2 text-sub select-none">
                                                        
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="input w-full pl-7 text-sm"
                                                        placeholder="your-tag-here"
                                                        value={tagInput}
                                                        maxLength={24}
                                                        onChange={(e) => setTagInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddTag();
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    className="btn btn-square btn-secondary text-base font-nerdfont cursor-pointer"
                                                    onClick={handleAddTag}
                                                >
                                                    
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </fieldset>
                            )}

                            {activeTab === "usernames" && (
                                <div className="flex flex-col mt-2">
                                    <div className="divider text-xs my-3">User ID</div>
                                    <div className="text-xs w-full border border-base-300 p-3 flex items-center gap-3 bg-base-200 rounded opacity-75">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3 text-sub font-nerdfont text-sm select-none z-1">
                                                    󰁥
                                                </span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="input w-full pl-7 font-mono cursor-not-allowed bg-base-300/50"
                                                    value={data.id || ""}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <DndContext
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleUsernameDragEnd}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        <SortableContext
                                            items={usernameItems.map((u) => u._id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {usernameItems.map((item, index) => (
                                                <SortableUsernameItem
                                                    key={item._id}
                                                    item={item}
                                                    index={index}
                                                    totalCount={usernameItems.length}
                                                    onChange={(val) =>
                                                        handleUsernameChange(index, val)
                                                    }
                                                    onDelete={() =>
                                                        handleDeleteUsername(index)
                                                    }
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>

                                    {usernameItems.length < 3 && (
                                        <button
                                            type="button"
                                            onClick={handleAddUsername}
                                            className="mt-3 cursor-pointer border-2 border-dashed border-base-300 rounded flex items-center justify-center py-3 transition-colors text-sm opacity-70 hover:opacity-100"
                                        >
                                            <span className="font-nerdfont text-lg">
                                                
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {activeTab === "links" && (
                                <fieldset className="fieldset w-full">
                                    <div className="flex flex-col">
                                        <DndContext
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleLinksDragEnd}
                                            modifiers={[restrictToVerticalAxis]}
                                        >
                                            <SortableContext
                                                items={linksList.map((l) => l._id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {linksList.map((item, index) => (
                                                    <SortableLinkItem
                                                        key={item._id}
                                                        item={item}
                                                        index={index}
                                                        isFirst={index === 0}
                                                        isLast={index === linksList.length - 1}
                                                        onChangeUrl={(val) =>
                                                            handleLinkChange(index, "url", val)
                                                        }
                                                        onDelete={() => handleDeleteLink(index)}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>

                                        {linksList.length < 15 && (
                                            <button
                                                type="button"
                                                onClick={handleAddLink}
                                                className="mt-3 cursor-pointer border-2 border-dashed border-base-300 rounded flex items-center justify-center py-3 transition-colors text-sm opacity-70 hover:opacity-100"
                                            >
                                                <span className="font-nerdfont text-lg">
                                                    
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </fieldset>
                            )}

                            {activeTab === "privacy" && (
                                <fieldset className="fieldset w-full">
                                    <div className="flex gap-2">
                                        <div className="flex flex-col gap-1 mt-1">
                                            <label className="label flex gap-2">
                                                Profile Visibility

                                                <Tooltip content={(
                                                    <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                        <div><strong>Public:</strong> Visible to everyone.</div>
                                                        <div><strong>Unlisted:</strong> Only accessible via direct link.</div>
                                                        <div><strong>Registered:</strong> Visible only to logged-in users.</div>
                                                        <div><strong>Friends:</strong> Visible only to friends on your list.</div>
                                                        <div><strong>Private:</strong> Visible only to you.</div>
                                                    </div>
                                                )}>
                                                    <span className="font-nerdfont text-sm"></span>
                                                </Tooltip>
                                            </label>

                                            <TypeableDropdownInput
                                                value={
                                                    data.visibility.charAt(0).toUpperCase() + data.visibility.slice(1).toLowerCase()
                                                }
                                                options={[
                                                    { id: "public", name: "Public" },
                                                    { id: "unlisted", name: "Unlisted" },
                                                    { id: "registered", name: "Registered" },
                                                    { id: "friends", name: "Friends" },
                                                    { id: "private", name: "Private" },
                                                ]}
                                                placeholder="Select Option"
                                                typeable={false}
                                                onChange={(option) =>
                                                    handleFieldChange(
                                                        "visibility",
                                                        option as VisibilityType
                                                    )
                                                }
                                            />
                                        </div>

                                        {data.type !== "publisher" ? (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <label className="label flex gap-2">
                                                    Birth Date Visibility

                                                    <Tooltip content={(
                                                        <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                            <div><strong>Default:</strong> Follows profile visibility.</div>
                                                            <div><strong>Public:</strong> Visible to everyone.</div>
                                                            <div><strong>Registered:</strong> Visible only to logged-in users.</div>
                                                            <div><strong>Followers:</strong> Visible to users who follow you.</div>
                                                            <div><strong>Friends:</strong> Visible only to friends on your list.</div>
                                                            <div><strong>Private:</strong> Visible only to you.</div>
                                                        </div>
                                                    )}>
                                                        <span className="font-nerdfont text-sm"></span>
                                                    </Tooltip>
                                                </label>

                                                <TypeableDropdownInput
                                                    value={
                                                        data.birthDateVisibility.charAt(0).toUpperCase() + data.birthDateVisibility.slice(1).toLowerCase()
                                                    }
                                                    options={[
                                                        { id: "default", name: "Default" },
                                                        { id: "public", name: "Public" },
                                                        { id: "registered", name: "Registered" },
                                                        { id: "followers", name: "Followers" },
                                                        { id: "friends", name: "Friends" },
                                                        { id: "private", name: "Private" },
                                                    ]}
                                                    placeholder="Select Option"
                                                    typeable={false}
                                                    onChange={(option) =>
                                                        handleFieldChange(
                                                            "birthDateVisibility",
                                                            option as VisibilityType
                                                        )
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <label className="label flex gap-2">
                                                    Founded Date Visibility

                                                    <Tooltip content={(
                                                        <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                            <div><strong>Default:</strong> Follows profile visibility.</div>
                                                            <div><strong>Public:</strong> Visible to everyone.</div>
                                                            <div><strong>Registered:</strong> Visible only to logged-in users.</div>
                                                            <div><strong>Followers:</strong> Visible to users who follow you.</div>
                                                            <div><strong>Friends:</strong> Visible only to friends on your list.</div>
                                                            <div><strong>Private:</strong> Visible only to you.</div>
                                                        </div>
                                                    )}>
                                                        <span className="font-nerdfont text-sm"></span>
                                                    </Tooltip>
                                                </label>

                                                <TypeableDropdownInput
                                                    value={
                                                        data.foundedDateVisibility.charAt(0).toUpperCase() + data.foundedDateVisibility.slice(1).toLowerCase()
                                                    }
                                                    options={[
                                                        { id: "default", name: "Default" },
                                                        { id: "public", name: "Public" },
                                                        { id: "registered", name: "Registered" },
                                                        { id: "followers", name: "Followers" },
                                                        { id: "friends", name: "Friends" },
                                                        { id: "private", name: "Private" },
                                                    ]}
                                                    placeholder="Select Option"
                                                    typeable={false}
                                                    onChange={(option) =>
                                                        handleFieldChange(
                                                            "foundedDateVisibility",
                                                            option as VisibilityType
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="divider text-xs my-0 mt-3">
                                        <span className="flex gap-2">
                                            Social
                                        </span>
                                    </div>

                                    <CheckboxInput
                                        label="Recieve Friend Requests"
                                        checked={data.areFriendRequestsEnabled}
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        onChange={(checked) => handleFieldChange("areFriendRequestsEnabled", checked)}
                                    />

                                    <div className="flex gap-2">
                                        <div className="flex flex-col gap-1 mt-1">
                                            <label className="label flex gap-2">
                                                Direct Messages

                                                <Tooltip content={(
                                                    <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                        <div><strong>Public:</strong> Everyone can message you.</div>
                                                        <div><strong>Followers:</strong> Users who follow you can message you.</div>
                                                        <div><strong>Friends:</strong> Friends on your list can message you.</div>
                                                        <div><strong>Private:</strong> No one can message you.</div>
                                                    </div>
                                                )}>
                                                    <span className="font-nerdfont text-sm"></span>
                                                </Tooltip>
                                            </label>

                                            <TypeableDropdownInput
                                                value={
                                                    data.birthDateVisibility.charAt(0).toUpperCase() + data.birthDateVisibility.slice(1).toLowerCase()
                                                }
                                                options={[
                                                    { id: "public", name: "Public" },
                                                    { id: "followers", name: "Followers" },
                                                    { id: "friends", name: "Friends" },
                                                    { id: "private", name: "Private" },
                                                ]}
                                                placeholder="Select Option"
                                                typeable={false}
                                                onChange={(option) =>
                                                    handleFieldChange(
                                                        "birthDateVisibility",
                                                        option as VisibilityType
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1">
                                            <label className="label flex gap-2">
                                                Content Comments

                                                <Tooltip content={(
                                                    <div className="flex flex-col gap-2 tooltip-content bg-base-200 text-xs text-left border border-base-300 rounded shadow-2xl">
                                                        <div><strong>Public:</strong> Everyone can post comments.</div>
                                                        <div><strong>Followers:</strong> Users who follow you can post comments.</div>
                                                        <div><strong>Friends:</strong> Friends on your list can post comments.</div>
                                                        <div><strong>Private:</strong> Only you or collaborators can post comments.</div>
                                                    </div>
                                                )}>
                                                    <span className="font-nerdfont text-sm"></span>
                                                </Tooltip>
                                            </label>

                                            <TypeableDropdownInput
                                                value={
                                                    data.foundedDateVisibility.charAt(0).toUpperCase() + data.foundedDateVisibility.slice(1).toLowerCase()
                                                }
                                                options={[
                                                    { id: "public", name: "Public" },
                                                    { id: "followers", name: "Followers" },
                                                    { id: "friends", name: "Friends" },
                                                    { id: "private", name: "Private" },
                                                ]}
                                                placeholder="Select Option"
                                                typeable={false}
                                                onChange={(option) =>
                                                    handleFieldChange(
                                                        "foundedDateVisibility",
                                                        option as VisibilityType
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            )}

                            {activeTab === "preview" && (
                                <div className="md:hidden">
                                    <UserCard
                                        key={JSON.stringify(previewData)}
                                        data={previewData}
                                        isPreview={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center min-h-[500px] h-full w-full p-4 overflow-hidden">
                        <div className="flex items-center justify-center w-full max-w-[340px]">
                            <UserCard
                                key={JSON.stringify(previewData)}
                                data={previewData}
                                isPreview={true}
                            />
                        </div>
                    </div>
                </div>

                {(() => {
                    const hasChanges = Object.keys(getChangedData(data, initialData as GetUserItemType)).length > 0;

                    return (
                        <div className="flex items-center gap-2 sm:gap-3 flex-row w-full pt-4 z-10 shrink-0">
                            <button
                                type="button"
                                className="btn btn-neutral flex-1"
                                onClick={handleClose}
                            >
                                {t("words.Close")}
                            </button>

                            <button
                                type="button"
                                className={`btn flex-3 flex items-center justify-center border rounded gap-2 transition-colors ${
                                    !hasChanges 
                                        ? "bg-base-200 border-base-300 cursor-not-allowed opacity-60" 
                                        : "bg-success border-success text-white cursor-pointer"
                                }`}
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                            >
                                <span className={`font-nerdfont leading-none ${isSaving ? "loading w-6 h-6" : ""}`}>
                                    {!isSaving && (!hasChanges ? "" : "󰆓")}
                                </span>
                                {!isSaving && (hasChanges ? t("words.Save") : t("words.Saved"))}
                            </button>
                        </div>
                    );
                })()}
            </div>
        </dialog>
    );
});

EditUserProfileModal.displayName = "EditUserProfileModal";
export default EditUserProfileModal;

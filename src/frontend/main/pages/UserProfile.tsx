import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import Confetti from "react-confetti";
import { CSS } from "@dnd-kit/utilities";

import { formatNumber } from "kage-library/client";

import { useInteractions } from "../../_common/hooks/useInteractions.hook.js";
import { GetUserItemType } from "../../../_common/types/user.type.js";
import { apiBaseUrl, cdnBaseUrl } from "../../_common/scripts/domains.js";
import { GetPublishedCharacterItemType } from "../../../_common/types/character.type.js";
import { formatLongRelative, formatShortRelative, isBirthdayToday } from "../../_common/scripts/time.js";
import { GetAssetType } from "../../../_common/types/asset.type.js";
import Metadata from "../../_common/components/Metadata.js";
import { hexToRgba } from "../scripts/colors.js";
import Badges from "../../_common/components/Badges.js";
import { toast } from "../../_common/scripts/toast.js";
import { ContextMenuBuilder } from "../../_common/components/ContextMenuBuilder.js";
import { Tooltip } from "../../_common/components/Tooltip.js";
import Presence from "../../_common/components/Presence.js";
import ZoomableMedia from "../../_common/components/ZoomableMedia.js";
import Awards from "../../_common/components/Awards.js";
import { TypeableDropdownInput } from "../../_common/components/TypeableDropdownInput.js";
import AdvertisementBox from "../components/Advertisement.js";
import MarkdownEditor from "../../_common/components/markdown/Editor.js";
import CharacterCard from "../components/CharacterCard.js";
import { Pagination } from "../components/Pagination.js";
import { useUnsavedChangesWarning } from "../../_common/hooks/useUnsavedChangesWarning.hook.js";
import { useModals } from "../../_common/hooks/ModalContext.hook.js";
import ExternalLink from "../../_common/components/ExternalLink.js";

interface SortableCardProps {
    item: GetAssetType;
    children: (props: {
        dragHandleProps: {
            ref: (element: HTMLElement | null) => void;
            [key: string]: unknown;
        };
    }) => React.ReactNode;
}

function SortableCard({ item, children }: SortableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
    } = useSortable({
        id: item.id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            {children({
                dragHandleProps: {
                    ref: setActivatorNodeRef,
                    ...attributes,
                    ...listeners,
                },
            })}
        </div>
    );
}

export default function UserProfile() {
    const { id } = useParams();
    const { t, ready: isTranslationReady } = useTranslation();
    const navigate = useNavigate();
    const { editUserProfileModal } = useModals();
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get("query") || "";
    const sortBy = searchParams.get("sortBy") || "popularDesc";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    const { handleFollowInteraction } = useInteractions();

    const [activeTab, setActiveTab] = useState<string>("pinned");

    const [selectedStatistics, setSelectedStatistics] = useState<string>("total");
    
    const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);

    const [refetchData, setRefetchData] = useState<boolean>(false);
    const [data, setData] = useState<GetUserItemType>();
    const [isLoading, setIsLoading] = useState(true);

    const [isEditingAbout, setIsEditingAbout] = useState<boolean>(false);
    const [about, setAbout] = useState<string>();

    const [isContentLoading, setIsContentLoading] = useState(true);
    const [pageCount, setPageCount] = useState(0);

    const [characters, setCharacters] = useState<GetPublishedCharacterItemType[]>([]);
    const [areCharactersLoading, setAreCharactersLoading] = useState(true);
    const [areInitialCharacters, setAreInitialCharacters] = useState(false);

    const [refetchPins, setRefetchPins] = useState<boolean>(false);
    const [pins, setPins] = useState<GetAssetType[]>([]);
    const [arePinsLoading, setArePinsLoading] = useState(true);

    const [showConfetti, setShowConfetti] = useState(false);

    const [auraStyle, setAuraStyle] = useState<React.CSSProperties>({});
    const [primaryUsername, setPrimaryUsername] = useState<string | undefined>();

    const [isSensitive, setIsSensitive] = useState<boolean>(false);
    const [isMature, setIsMature] = useState<boolean>(false);
    const [isRevealed, setIsRevealed] = useState<boolean>(false);

    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [followCount, setFollowCount] = useState<number>(0);
    const [isFollowInteractionLoading, setIsFollowInteractionLoading] = useState<boolean>(false);

    const [isHidden, setIsHidden] = useState<boolean>(false);
    const [isHideInteractionLoading, setIsHideInteractionLoading] = useState<boolean>(false);

    const [isRestricted, setIsRestricted] = useState<boolean>(false);
    const [isRestrictInteractionLoading, setIsRestrictInteractionLoading] = useState<boolean>(false);

    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [isBlockInteractionLoading, setIsBlockInteractionLoading] = useState<boolean>(false);
    const [isBlockRevealed, setIsBlockRevealed] = useState<boolean>(false);

    useUnsavedChangesWarning(isEditingAbout);

    const tabs = useMemo(() => {
        if (!isTranslationReady) return [];

        const availableTabs: { id: string; label: string }[] = [];

        if (pins.length > 0) {
            availableTabs.push({ id: "pinned", label: t("words.Pinned") });
        }

        if (data?.markdown || window.session?.userId === data?.id) {
            availableTabs.push({ id: "about", label: t("words.About") });
        }

        if (areInitialCharacters) {
            availableTabs.push({ id: "characters", label: t("words.Characters") });
        }

        return availableTabs;
    }, [isTranslationReady, pins.length, data?.markdown, data?.id, areInitialCharacters, t]);

    const defaultTab = tabs[0]?.id || "about";

    const handleSearchChange = (newQuery: string) => {
        setSearchParams((prev) => {
            if (newQuery) {
                prev.set("query", newQuery);
            } else {
                prev.delete("query");
            }
            prev.delete("page");
            return prev;
        }, { replace: true });
    };

    const handlePageChange = (page: number) => {
        setSearchParams((prev) => {
            if (page === 1) {
                prev.delete("page");
            } else {
                prev.set("page", page.toString());
            }
            return prev;
        }, { replace: true });
    };

    const handleSortChange = (newSortBy: string) => {
        setSearchParams((prev) => {
            prev.set("sortBy", newSortBy);
            prev.delete("page");
            return prev;
        }, { replace: true });
    };

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const fetchPins = useCallback(async () => {
        if (!data?.id) return;

        setArePinsLoading(true);

        try {
            const res = await fetch(`${apiBaseUrl}/v3/pins/${data.id}`, {
                credentials: "include",
            });
            
            if (!res.ok) return;

            const json = await res.json();

            setPins(json.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setArePinsLoading(false);
            setRefetchPins(false);
        }
    }, [data?.id]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const fetchCharacters = useCallback(async () => {
        if (!data?.id) return;

        setAreCharactersLoading(true);

        try {
            const res = await fetch(
                `${apiBaseUrl}/v3/characters?owner=${data.id}&q=${encodeURIComponent(query)}&sortBy=${sortBy}&page=${currentPage}&includeMedia=true`, 
                { credentials: "include" }
            );

            if (!res.ok) return;

            const json = await res.json();

            if (json?.items?.length > 0) {
                setAreInitialCharacters(true);
            }
            
            setCharacters(json?.items || []);

            if (json?.pageCount !== undefined) {
                setPageCount(json.pageCount);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAreCharactersLoading(false);
        }
    }, [currentPage, data?.id, query, sortBy]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(
                    `${apiBaseUrl}/v3/users?id=${id}&includeLinks=true`, 
                    { credentials: "include" }
                );

                if (!res.ok) {
                    navigate("/404", { replace: true });
                    return;
                }

                const json = await res.json();
                const data: GetUserItemType = json?.items?.[0];

                if (!data && window.config.isProduction) {
                    navigate("/404", { replace: true });
                    return;
                }

                const primaryUsername = data?.usernames?.find(u => u.isPrimary)?.username;

                if (primaryUsername && id !== primaryUsername) {
                    navigate(`/user/${primaryUsername}`, { replace: true });
                    return;
                }
                
                setData(data);

                setAuraStyle(
                    data?.isAuraEnabled
                        ? {
                            ["--aura-type" as string]: `aura-${data?.auraType || "flow"}`,
                            ["--aura-primary" as string]: data?.auraPrimary || "var(--color-accent)",
                            ["--aura-secondary" as string]: data?.auraSecondary || "var(--color-accent)",
                        }
                        : {
                            border: "1px solid #222222",
                        }
                );

                setPrimaryUsername(primaryUsername);
                setAbout(data.markdown);
                setShowConfetti(isBirthdayToday(data?.birthDate) || false);
                setIsSensitive(data?.isSensitive);
                setIsMature(data?.isMature);
                setIsFollowing(data?.interactions?.follows?.hasInteracted || false);
                setFollowCount(data?.interactions?.follows?.count || 0);
                setIsHidden(data?.interactions?.hides?.hasInteracted || false);
                setIsRestricted(data?.interactions?.restricts?.hasInteracted || false);
                setIsBlocked(data?.interactions?.blocks?.hasInteracted || false);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
                setRefetchData(false);
            }
        };

        if (id) fetchUser();
    }, [id, navigate, refetchData]);

     useEffect(() => {
        if (!isLoading && !areCharactersLoading && !arePinsLoading) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsContentLoading(false);
        }
    }, [isLoading, areCharactersLoading, arePinsLoading]);

    useEffect(() => {
        if (data?.id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchPins();
        }
    }, [data?.id, fetchPins, refetchPins]);

    useEffect(() => {
        if (data?.id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchCharacters();
        }
    }, [data?.id, fetchCharacters]);

    useEffect(() => {
        if (tabs.length <= 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(defaultTab);
            
            return;
        }

        const updateTab = () => {
            const hashTab = window.location.hash.replace("#", "");
            const isTabValid = tabs.some((tab) => tab.id === hashTab);
            setActiveTab(isTabValid ? hashTab : defaultTab);
        };

        window.addEventListener("hashchange", updateTab);
        updateTab();

        return () => {
            window.removeEventListener("hashchange", updateTab);
        };
    }, [tabs, defaultTab]);

    const contextMenuBuilder = ContextMenuBuilder({
        data: data!,
        isContextMenuOpen,
        setIsContextMenuOpen,
        isFollowing,
        isFollowInteractionLoading,
        setIsFollowing,
        setIsFollowInteractionLoading,
        setFollowCount,
        isHidden,
        isHideInteractionLoading,
        setIsHidden,
        setIsHideInteractionLoading,
        isRestricted,
        isRestrictInteractionLoading,
        setIsRestricted,
        setIsRestrictInteractionLoading,
        isBlocked,
        isBlockInteractionLoading,
        setIsBlocked,
        setIsBlockInteractionLoading,
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData((prevData) => {
            if (!prevData) return prevData;

            return {
                ...prevData,
                interactions: {
                    ...prevData?.interactions,
                    follows: {
                        ...prevData?.interactions?.follows,
                        count: followCount,
                        hasInteracted: isFollowing,
                    }
                },
            } as GetUserItemType;
        });
    }, [followCount, isFollowing]);

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const oldIndex = pins.findIndex((item) => item.id === active.id);
        const newIndex = pins.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const updated = arrayMove(pins, oldIndex, newIndex);
        setPins(updated);

        try {
            await Promise.all(
                updated.map((item, index) =>
                    fetch(
                        `${apiBaseUrl}/v3/pins/${window.session?.userId}/${item.id}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                position: index + 1,
                            }),
                        }
                    )
                )
            );
        } catch (err) {
            console.error("Failed to sync pin reorder:", err);
        }
    };

    const setTab = (tab: string) => {
        if (tabs.length <= 1) {
            setActiveTab(tab);
            return;
        }

        const search = window.location.search;
        const hash = tab === defaultTab ? "" : `#${tab}`;
        const newUrl = `${window.location.pathname}${hash}${search}`;

        history.replaceState(null, "", newUrl);
        setActiveTab(tab);
    };

    const Banner = data?.banner ? ZoomableMedia : "div";
    const Avatar = (data?.avatar || data?.animatedAvatar) ? ZoomableMedia : "img";

    const buttonClassList = "flex flex-1 gap-2 h-8 px-3 text-sm btn btn-base-200 border-base-300";
    const buttonTextClassList = "text-base font-nerdfont w-4";

    const boxClassList = "bg-base-100 border border-base-300 p-6 base-200 rounded-lg h-fit z-1";
    const boxTextClassList = "w-full text-center text-lg font-bold mb-6";

    if (!isTranslationReady) return null;

    return (
        <>
            <Metadata
                favicon={`${cdnBaseUrl}/crop/circle?url=${cdnBaseUrl}${data?.avatar || window.config.metadata.assets.icon}`}
                title={data?.displayName || primaryUsername || data?.id}
                description={data?.about || t("defaults.noUserAbout")}
                keywords={data?.tags?.toString()}
                image={`${data?.avatar ? data?.avatar : `${cdnBaseUrl}${window.config.metadata.assets.icon}`}`}
                author={primaryUsername || data?.id}
            />

            {showConfetti && (
                <Confetti
                    numberOfPieces={250}
                    recycle={false}
                    onConfettiComplete={(confetti) => {
                        setShowConfetti(false);
                        confetti?.reset();
                    }}
                    style={{
                        zIndex: 4,
                        pointerEvents: "none",
                    }}
                />
            )}

            {isBlocked && !isBlockRevealed && (
                <div 
                    className="fixed inset-0 z-10 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
                    onClick={(e) => {                        
                        e.stopPropagation();
                        setIsBlockRevealed(true);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <span className="font-nerdfont text-7xl mb-3 leading-none flex items-center justify-center">
                        
                    </span>

                    <span className="text-sm font-semibold">
                        {t("components.cards.isBlocked")}
                    </span>

                    <span className="text-xs text-sub mt-1">
                        {t("components.cards.clickToReveal")}
                    </span>
                </div>
            )}

            {Boolean(isMature) && !isRevealed && (
                <div 
                    className="fixed inset-0 z-20 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
                    onClick={(e) => {                        
                        e.stopPropagation();
                        setIsRevealed(true);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <span className="font-nerdfont text-7xl mb-3 leading-none flex items-center justify-center">
                        
                    </span>

                    <span className="text-sm font-semibold">
                        {t("components.cards.isMature")}
                    </span>

                    <span className="text-xs text-sub mt-1">
                        {t("components.cards.clickToReveal")}
                    </span>
                </div>
            )}

            {(Boolean(isSensitive) && Boolean(!isMature)) && !isRevealed && (
                <div 
                    className="fixed inset-0 z-10 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
                    onClick={(e) => {                        
                        e.stopPropagation();
                        setIsRevealed(true);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <span className="font-nerdfont text-7xl mb-3 leading-none flex items-center justify-center">
                        󰈉
                    </span>

                    <span className="text-sm font-semibold">
                        {t("components.cards.isSensitive")}
                    </span>

                    <span className="text-xs text-sub mt-1">
                        {t("components.cards.clickToReveal")}
                    </span>
                </div>
            )}

            <div style={{backgroundColor: data?.isAuraEnabled ? hexToRgba(data?.auraPrimary, 0.05) : "transparent"}}>
                { data?.status && ( 
                    <div className="relative top-5 left-42 w-317">
                        <div className="absolute glass bg-[#00000085] rounded-full h-4 w-4 top-6 left-25.5 z-1" />
                        <div className="absolute glass bg-[#00000085] rounded-full h-3 w-3 top-10 left-23 z-1" />

                        <div className="absolute glass bg-[#00000085] rounded-lg p-3 left-30.5 z-1">
                            <div className="text-white text-sm line-clamp-1">
                                {data?.status}
                            </div>
                        </div>
                    </div>
                )}
                    
                <div className="hero">
                    <Banner
                        className="mask-graident absolute top-[64px] w-full object-cover h-96"
                        src={`${cdnBaseUrl}${data?.banner}`}
                        alt={t("words.banner")}
                    />
                </div>

                <div className="px-0 py-8 md:px-25 md:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-4">
                        <div className="flex flex-col gap-4">

                            <div 
                                className="aura-effect bg-base-100 rounded-lg z-1 p-6 h-fit" 
                                style={auraStyle}
                            >
                                {contextMenuBuilder && contextMenuBuilder.items([
                                    window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        contextMenuBuilder.quickActions([
                                            (props) => contextMenuBuilder.view(props),
                                            (props) => contextMenuBuilder.follow(props),
                                            (props) => contextMenuBuilder.message(props),
                                            (props) => contextMenuBuilder.share(props)
                                        ]),
                                    contextMenuBuilder.edit(),
                                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        window.session.userId === data?.id && 
                                        contextMenuBuilder.separator(),
                                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        contextMenuBuilder.view(),
                                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        contextMenuBuilder.follow(),
                                    contextMenuBuilder.friend(),
                                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        contextMenuBuilder.message(),
                                    window.session.userId && !isHidden && !isBlocked && 
                                        contextMenuBuilder.separator(),
                                    contextMenuBuilder.notifications(),
                                    contextMenuBuilder.mute(),
                                    isFollowing && window.session.userId !== data?.id && 
                                        contextMenuBuilder.separator(),
                                    contextMenuBuilder.notInterested(),
                                    isHidden && 
                                        contextMenuBuilder.separator(),
                                    contextMenuBuilder.restrict(),
                                    contextMenuBuilder.block(),
                                    contextMenuBuilder.report(),
                                    contextMenuBuilder.moderate(),
                                    contextMenuBuilder.manage(),
                                    (Boolean(window.session.user?.isDeveloper) || (!isBlocked && !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR"))) && 
                                        contextMenuBuilder.separator(),
                                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                                        contextMenuBuilder.share(),
                                    contextMenuBuilder.copyId()
                                ].filter(Boolean))}

                                <div className="relative flex flex-col items-center py-2 z-2">
                                    {(
                                        data?.fanflair === "true" &&
                                        (data?.id === "5719552362357773" ||
                                        data?.id === "5019646586243236")
                                    ) && (
                                        // DEVELOPER NEEDED: Disable id override and add fanflairs
                                        <div 
                                            className="absolute z-1 top-[-6px] cursor-pointer"
                                                onClick={() => {
                                                document.getElementById("avatar")?.click();
                                            }}
                                        >
                                            <Tooltip
                                                position="right"
                                                content={
                                                    <div className="tooltip-content bg-base-200 text-base-content border border-base-300 rounded shadow-2xl flex flex-col max-w-[300px] text-center p-1">
                                                        <div className="flex flex-col p-1 gap-3">
                                                            <div className="flex justify-center w-full">
                                                                <img
                                                                    className="h-32 w-32 object-contain"
                                                                    src={`${cdnBaseUrl}/uploads/942ba7b3-f359-4b06-8189-2223950b246c.png`}
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="font-bold text-sm">
                                                                    Cyeletal Crystals
                                                                </div>

                                                                <hr />
                                                                
                                                                <div className="text-xs text-sub">
                                                                    From <strong>J9 Studios</strong>
                                                                    <br/>
                                                                    <br/>
                                                                    {t("defaults.noFanflair")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <img
                                                    className="h-38 w-38 object-contain"
                                                    src={`${cdnBaseUrl}/uploads/942ba7b3-f359-4b06-8189-2223950b246c.png`}
                                                    alt={t("words.fanflair")}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}

                                    <div className="relative group pointer-events-auto">
                                            <Avatar
                                                className="rounded-full h-32 w-32 object-cover"
                                                id={"avatar"}
                                                src={data?.avatar ? `${cdnBaseUrl}${data?.avatar}` : `${cdnBaseUrl}${window.config.metadata.assets.noImage}`}
                                                alt={t("words.avatar")}
                                            />

                                            {data?.animatedAvatar && (
                                                <Avatar
                                                    className="absolute rounded-full top-0 h-32 w-32 object-cover"
                                                    id={"avatar"}
                                                    src={`${cdnBaseUrl}${data?.animatedAvatar}`}
                                                    alt={t("words.avatar")}
                                                />
                                            )}

                                        <Presence 
                                            data={data}
                                            largeIcons={true}
                                        />
                                    </div>

                                    <div className="flex items-center justify-center w-full mt-5 gap-2">
                                        <h1 className="truncate text-xl font-bold text-center">
                                            {data?.displayName || primaryUsername || data?.id}
                                        </h1>

                                        <Badges 
                                            data={data as GetAssetType} 
                                            assetType="USER" 
                                        />
                                    </div>

                                    <div className="flex items-center justify-center gap-2 w-full">
                                        <div className="truncate text-sm text-center text-sub">
                                            @{primaryUsername}{data?.pronouns ? ` • ${data?.pronouns}` : ""}
                                        </div>
                                    </div>

                                    {window.session.userId && (
                                        <div className="flex justify-between gap-2 flex-wrap w-full mt-4">
                                            {window.session.userId === data?.id && (
                                                <button
                                                    className={buttonClassList}
                                                    onClick={async () => {
                                                        await editUserProfileModal.open(data, () => {
                                                            setRefetchData(true);
                                                        });
                                                    }}
                                                >
                                                    <span className={buttonTextClassList}>
                                                        
                                                    </span>
                                                    
                                                    {t("words.EditProfile")}
                                                </button>
                                            )}

                                            {window.session.userId !== data?.id 
                                                && (data && data?.visibility !== "friends" && "isFriends" in data && !data.isFriends) 
                                            && (
                                                <button
                                                    className={buttonClassList}
                                                    onClick={async () => {
                                                        await handleFollowInteraction(
                                                            data,
                                                            isFollowing,
                                                            isFollowInteractionLoading,
                                                            setIsFollowing,
                                                            setIsFollowInteractionLoading,
                                                            setFollowCount
                                                        );
                                                    }}
                                                >
                                                    <span className={`${isFollowInteractionLoading ? "loading" : ""} ${buttonTextClassList}`}>
                                                        {isFollowing ? "" : ""}
                                                    </span>
                                                    {isFollowing ? t("words.Unfollow") : t("words.Follow")}
                                                </button>
                                            )}

                                            {data?.visibility === "friends" && !data?.isFriends && data?.sendMessages === "private" && (
                                                <button
                                                    className={buttonClassList}
                                                    onClick={() => { 
                                                        // friendModal.open(data);
                                                        // If friend, display modal to unfrend, else add a friend or cancel
                                                        toast.show(
                                                            "DEVELOPER NEEDED: Add friend modal", 
                                                            { type: "warning" }
                                                        );
                                                    }}
                                                >
                                                    <span className={buttonTextClassList}>
                                                        
                                                    </span>

                                                    {t("words.AddFriend")}
                                                </button>
                                            )}

                                            {
                                                window.session.userId !== data?.id
                                                && !isHidden 
                                                && !isBlocked
                                                && ((data?.sendMessages === "followers" && data?.interactions?.follows?.hasInteracted) ||
                                                (data?.sendMessages === "friends" && data?.isFriends) ||
                                                (data?.sendMessages !== "followers" && data?.sendMessages !== "friends" && data?.sendMessages !== "private"))
                                            && (
                                                <button
                                                    className={`${buttonClassList} tooltip tooltip-accent pointer-events-auto`}
                                                    data-tip={t("words.ComingSoon")}
                                                    disabled={true}
                                                >
                                                    <span className={buttonTextClassList}>
                                                        󰍡
                                                    </span>
                                                    {t("words.Message")}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {data?.about && (
                                        <p className="text-sm w-full mt-4">
                                            {data?.about}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-3 w-full mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-nerdfont leading-none text-base">󰃭</div>
                                            <div 
                                                className="text-sm tooltip"
                                                data-tip={`${t("words.Joined")} ${formatLongRelative(data?.createdDate)}`}
                                            >
                                                {formatShortRelative(data?.createdDate)}
                                            </div>
                                        </div>

                                        {
                                            (
                                                data?.birthDate && data?.type === "user" ||
                                                data?.birthDate && data?.type === "author"
                                            )
                                        && (
                                            <div className="flex items-center gap-2">
                                                <div className="font-nerdfont leading-none text-base">󰃫</div>
                                                <div 
                                                    className="text-sm tooltip"
                                                    data-tip={`${t("words.Born")} ${formatLongRelative(data?.birthDate)}`}
                                                >
                                                    {formatShortRelative(data?.birthDate)}
                                                </div>

                                                {data?.birthDateVisibility === "friends" && (
                                                    <div 
                                                        className="tooltip"
                                                        data-tip={t("defaults.onlyFriends")}
                                                    >
                                                        <span className="font-nerdfont leading-none text-sub text-sm cursor-default">
                                                            
                                                        </span>
                                                    </div>
                                                )}

                                                {data?.birthDateVisibility === "private" && (
                                                    <div 
                                                        className="tooltip"
                                                        data-tip={t("defaults.onlyYou")}
                                                    >
                                                        <span className="font-nerdfont leading-none text-sub text-sm cursor-default">
                                                            
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {data?.foundedDate && data?.type === "publisher" && (
                                            <div className="flex items-center gap-2">
                                                <div className="font-nerdfont leading-none text-base"></div>
                                                <div 
                                                    className="text-sm tooltip"
                                                    data-tip={`${t("words.Founded")} ${formatLongRelative(data?.foundedDate)}`}
                                                >
                                                    {formatShortRelative(data?.foundedDate)}
                                                </div>

                                                {data?.foundedDateVisibility === "friends" && (
                                                    <div 
                                                        className="tooltip"
                                                        data-tip={t("defaults.onlyFriends")}
                                                    >
                                                        <span className="font-nerdfont leading-none text-sub text-sm cursor-default">
                                                            
                                                        </span>
                                                    </div>
                                                )}

                                                {data?.foundedDateVisibility === "private" && (
                                                    <div 
                                                        className="tooltip"
                                                        data-tip={t("defaults.onlyYou")}
                                                    >
                                                        <span className="font-nerdfont leading-none text-sub text-sm cursor-default">
                                                            
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {data?.location && (
                                            <div className="flex items-center gap-2">
                                                <div className="font-nerdfont leading-none text-base"></div>
                                                <div className="text-sm">{data?.location}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {data?.id && (
                                <AdvertisementBox
                                    className={boxClassList}
                                    adSlot={`user-profile-${data?.id}`}
                                />
                            )}

                            {data && data?.links?.length > 0 && (
                                <div className={boxClassList}>
                                    <div className={boxTextClassList}>
                                        {t("words.ExternalLinks")}
                                    </div>

                                    <div className="flex justify-center gap-2 px-2 text-xs font-normal flex-wrap">
                                        {[...data.links]
                                            .map((link) => (
                                                <ExternalLink
                                                    key={link.url}
                                                    url={link.url}
                                                />
                                            ))}
                                    </div>
                                </div>
                            )}
                            
                            {data && data?.awards?.length > 0 && (
                                <div className={boxClassList}>
                                    <div className={boxTextClassList}>
                                        {t("words.Awards")}
                                    </div>

                                    <Awards 
                                        data={data as GetUserItemType} 
                                    />
                                </div>
                            )}

                            <div className={boxClassList}>
                                <div className={boxTextClassList}>Statistics</div>

                                <div className="mb-6">
                                    <TypeableDropdownInput
                                        value={selectedStatistics}
                                        options={[
                                            { id: "total", name: "Total" },
                                            { id: "user", name: "User Profile" },
                                            { id: "content", name: "Content" }
                                        ]}
                                        placeholder="Filter Statistics"
                                        typeable={false}
                                        defaultOpenAbove={true}
                                        onChange={(id) => setSelectedStatistics(id as string)}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 w-full text-center">
                                    {selectedStatistics === "total" && (
                                        <>
                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(
                                                        (data?.interactions?.views?.count || 0) +
                                                        (data?.statistics?.views || 0)
                                                    )
                                                    .short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Views")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.reads || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Reads")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.likes || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Likes")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(
                                                        (data?.interactions?.follows?.count || 0) +
                                                        (data?.statistics?.followers || 0)
                                                    )
                                                    .short}
                                                </div>

                                                <div className="text-xs text-sub">
                                                    {t("words.Followers")}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(
                                                        (data?.interactions?.shares?.count || 0) +
                                                        (data?.statistics?.shares || 0)
                                                    )
                                                    .short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Shares")}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedStatistics === "user" && (
                                        <>
                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.interactions?.views?.count || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Views")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.interactions?.follows?.count || 0).short}
                                                </div>

                                                <div className="text-xs text-sub">
                                                    {t("words.Followers")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.interactions?.shares?.count || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Shares")}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedStatistics === "content" && (
                                        <>
                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.views || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Views")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.reads || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Reads")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.likes || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Likes")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.followers || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Followers")}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold">
                                                    {formatNumber(data?.statistics?.shares || 0).short}
                                                </div>
                                                <div className="text-xs text-sub">
                                                    {t("words.Shares")}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`${isContentLoading ? "skeleton" : ""} bg-base-100 border border-base-300 rounded-lg z-1`}>
                            {!isContentLoading && (
                                <>
                                    {tabs.length > 1 && (
                                        <div className="tabs tabs-border">
                                            {/* DEVELOPER NEEDED: Later on add universes, collections, titles, and collaborations */}
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    disabled={isEditingAbout}
                                                    className={`tab flex-1 ${activeTab === tab.id ? "tab-active" : ""}`}
                                                    onClick={() => setTab(tab.id)}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-2 md:p-4">
                                        {activeTab === "pinned" && (
                                            <DndContext
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={pins.map(item => item.id)}
                                                    strategy={rectSortingStrategy}
                                                >
                                                    <div className="p-4 flex flex-wrap gap-4">

                                                        {pins.map((data) => (
                                                            <SortableCard
                                                                key={data.id}
                                                                item={data}
                                                            >
                                                                {({ dragHandleProps }) => (
                                                                    <CharacterCard
                                                                        key={data.id}
                                                                        data={data as GetPublishedCharacterItemType}
                                                                        isPinVisible={true}
                                                                        doesUnpinDismiss={true}
                                                                        setRefetchPins={setRefetchPins}
                                                                        isUserProfile={true}
                                                                        dragHandleProps={dragHandleProps}
                                                                    />
                                                                )}
                                                            </SortableCard>
                                                        ))}

                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                        
                                        {activeTab === "about" && (
                                            <div className="px-0 mt-3.5 md:px-4">
                                                {window.session.userId === data?.id && (
                                                    <button
                                                        className={`${buttonClassList} w-full mt-2 mb-4`}
                                                        onClick={() => {
                                                            setIsEditingAbout(!isEditingAbout);
                                                        }}
                                                    >
                                                        <span className={buttonTextClassList}>
                                                            {isEditingAbout ? "" : ""}
                                                        </span>

                                                        {isEditingAbout ? t("words.CloseEditor") : t("words.OpenEditor")}
                                                    </button>
                                                )}

                                                <MarkdownEditor
                                                    initialContent={about}
                                                    isEditing={isEditingAbout}
                                                    onSave={async (newMarkdown) => {
                                                        setAbout(newMarkdown);

                                                        try {
                                                            const response = await fetch(`${apiBaseUrl}/v3/users/update/${data?.id}`, {
                                                                credentials: "include", 
                                                                method: "POST", 
                                                                headers: { "Content-Type": "application/json" }, 
                                                                body: JSON.stringify({
                                                                    data: {
                                                                        markdown: newMarkdown
                                                                    }
                                                                })
                                                            });

                                                            const responseData = await response.json();

                                                            if (response.ok) {
                                                                toast.show(
                                                                    t("defaults.savedYourProfile"),
                                                                    { type: "success" }
                                                                );
                                                            } else {
                                                                toast.show(
                                                                    t("defaults.failedToSaveProfile"),
                                                                    {
                                                                        subtext: `${responseData.id || ""}${responseData.id ? ": " : ""}${responseData.message}`,
                                                                        type: "error",
                                                                    }
                                                                );
                                                            }
                                                        } catch (error) {
                                                            console.error(`Failed to save markdown:`, error);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
        
                                        {activeTab === "characters" && (
                                            <>
                                                <div className="px-0 md:px-4 flex flex-row gap-3">
                                                    <fieldset className="fieldset flex-4">
                                                        <legend className="fieldset-legend">{t("words.Search")}</legend>
                                                        <label className="input mb-4 w-full">
                                                            <span className="font-nerdfont text-base mr-1"></span>
                                                            <input 
                                                                type="search" 
                                                                placeholder={t("pages.userProfile.searchCharacters")}
                                                                value={query}
                                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                            />
                                                        </label>
                                                    </fieldset>

                                                    <fieldset className="fieldset flex-1">
                                                        <legend className="fieldset-legend">Filter</legend>
                                                        <TypeableDropdownInput
                                                            value={sortBy}
                                                            options={[
                                                                { id: "popularDesc", name: "Most Popular" },
                                                                { id: "popularAsc", name: "Least Popular" },
                                                                { id: "newest", name: "Newest First" },
                                                                { id: "oldest", name: "Oldest First" },
                                                                { id: "nameAsc", name: "Name (A-Z)" },
                                                                { id: "nameDesc", name: "Name (Z-A)" }
                                                            ]}
                                                            placeholder="Filter Results"
                                                            typeable={false}
                                                            onChange={(id) => handleSortChange(id as string)}
                                                        />
                                                    </fieldset>
                                                </div>
                                                
                                                <div className="px-0 md:px-4 flex flex-wrap gap-4">
                                                    {characters?.map((data) => (
                                                        <CharacterCard
                                                            key={data.id}
                                                            data={data as GetPublishedCharacterItemType}
                                                            isPinVisible={pins.some((pin) => pin.id === data.id)}
                                                            setRefetchPins={setRefetchPins}
                                                            isUserProfile={true}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="px-0 md:px-4 text-center mt-24 text-xl">{t("pages.userProfile.end")}</div>
                                                <div className="px-0 md:px-4 text-center mb-24 mt-2 text-sm text-sub">{t("words.Follow")} {data?.displayName} {t("pages.userProfile.endSub")}</div>

                                                <Pagination 
                                                    pageCount={pageCount} 
                                                    currentPage={currentPage}
                                                    onPageChange={(page) => handlePageChange(page)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

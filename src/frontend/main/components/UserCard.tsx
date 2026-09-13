import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber } from "kage-library/client";

import { GetUserItemType } from "../../../_common/types/user.type.js";
import { useInteractions } from "../../_common/hooks/useInteractions.hook.js";
import { ContextMenuBuilder } from "../../_common/components/ContextMenuBuilder.js";
import { cdnBaseUrl } from "../../_common/scripts/domains.js";
import Badges from "../../_common/components/Badges.js";
import Presence from "../../_common/components/Presence.js";

type Props = {
    data: GetUserItemType;
    isPreview?: boolean;
};

export default function UserCard({
    data: rawData,
    isPreview = false
}: Props) {
    const { t, ready: isTranslationReady } = useTranslation();

    const { handleFollowInteraction } = useInteractions();

    const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);
    const [data, setData] = useState<GetUserItemType>(rawData);

    const [isSensitive] = useState<boolean>(Boolean(data.isSensitive));
    const [isMature] = useState<boolean>(Boolean(data.isMature));
    const [isRevealed, setIsRevealed] = useState<boolean>(false);

    const [isFollowing, setIsFollowing] = useState<boolean>(Boolean(data.interactions?.follows?.hasInteracted));
    const [followCount, setFollowCount] = useState<number>(data.interactions?.follows?.count || 0);
    const [isFollowInteractionLoading, setIsFollowInteractionLoading] = useState<boolean>(false);

    const [isHidden, setIsHidden] = useState<boolean>(Boolean(data.interactions?.hides?.hasInteracted));
    const [isHideInteractionLoading, setIsHideInteractionLoading] = useState<boolean>(false);

    const [isRestricted, setIsRestricted] = useState<boolean>(Boolean(data.interactions?.restricts?.hasInteracted));
    const [isRestrictInteractionLoading, setIsRestrictInteractionLoading] = useState<boolean>(false);

    const [isBlocked, setIsBlocked] = useState<boolean>(Boolean(data.interactions?.blocks?.hasInteracted));
    const [isBlockInteractionLoading, setIsBlockInteractionLoading] = useState<boolean>(false);
    const [isBlockRevealed, setIsBlockRevealed] = useState<boolean>(false);

    const contextMenuBuilder = ContextMenuBuilder({
        data,
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
        setIsBlockInteractionLoading
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData((prevData) => {
            const currentData = prevData ?? rawData;
            if (!currentData) return currentData;

            return {
                ...currentData,
                interactions: {
                    ...currentData.interactions,
                    follows: {
                        ...currentData.interactions?.follows,
                        count: followCount,
                        hasInteracted: isFollowing,
                    }
                },
            } as GetUserItemType;
        });
    }, [followCount, isFollowing, rawData]);

    if (!data.id || !isTranslationReady || !contextMenuBuilder) return null;

    const auraStyle: React.CSSProperties = data.isAuraEnabled
        ? {
            ["--aura-type" as string]: `aura-${data.auraType || "flow"}`,
            ["--aura-primary" as string]: data.auraPrimary || "var(--color-accent)",
            ["--aura-secondary" as string]: data.auraSecondary || "var(--color-accent)",
        }
        : {
            border: "1px solid #222222",
        };
    
    const primaryUsername = data.usernames.find(u => u.isPrimary)?.username;

    const Banner = data.banner ? "img" : "div";
    const bannerClassList = "mask-graident absolute z-1 top-0 left-0 rounded-t-lg h-[118px] w-full object-cover";

    return (
        <div
            className={`group aura-effect user-card relative p-4 shadow-sm ${!isPreview ? "cursor-pointer" : ""} transition-all duration-100 ${
                isHidden ? "grayscale opacity-50" : "grayscale-0"
            }`}
            style={auraStyle}
            onContextMenu={(e) => {
                e.preventDefault();
                setIsContextMenuOpen(true);

                const popover = document.getElementById(
                    `more-dropdown-${data.id}`
                ) as HTMLElement | null;

                if (!popover) return;

                popover.showPopover?.();

                requestAnimationFrame(() => {
                    const rect = popover.getBoundingClientRect();

                    popover.style.left = `${Math.min(
                        e.clientX,
                        window.innerWidth - rect.width - 8
                    )}px`;

                    popover.style.top = `${Math.min(
                        e.clientY,
                        window.innerHeight - rect.height - 8
                    )}px`;
                });
            }}
        >

            {!isPreview && (
                <Link
                    to={`/user/${primaryUsername || data.id}`}
                    className="absolute inset-0 z-0 rounded-lg"
                    aria-label={data.displayName || primaryUsername || data.id}
                />
            )}

            {Boolean(isMature) && !isRevealed && (
                <div 
                    className="absolute inset-0 z-20 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
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
                    className="absolute inset-0 z-10 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
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

            {isBlocked && !isBlockRevealed && (
                <div 
                    className="absolute inset-0 z-10 rounded-lg flex flex-col items-center justify-center glass cursor-pointer transition-all select-none"
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
            
            {!isPreview && 
                contextMenuBuilder.items([
                    window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                        contextMenuBuilder.quickActions([
                            (props) => contextMenuBuilder.view(props),
                            (props) => contextMenuBuilder.follow(props),
                            (props) => contextMenuBuilder.message(props),
                            (props) => contextMenuBuilder.share(props)
                        ]),
                    contextMenuBuilder.edit(),
                    !window.session.user?.flags?.includes("QUICK_ACTIONS_BAR") && 
                        window.session.userId === data.id && 
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
                    isFollowing && window.session.userId !== data.id && 
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
                ].filter(Boolean))
            }

            <div className="absolute inset-0 pointer-events-none">
                <Banner
                    className={bannerClassList}
                    src={
                        data.banner?.startsWith("blob:")
                            ? data.banner
                            : `${cdnBaseUrl}${data.banner}`
                    }
                    alt={t("words.banner")}
                />
            </div>

            <div className="group/avatar absolute z-2 pointer-events-none h-26 w-26">
                {(
                    data?.fanflair === "true" &&
                    (data?.id === "5719552362357773" ||
                    data?.id === "5019646586243236")
                ) && (
                    // DEVELOPER NEEDED: Disable id override and add fanflairs
                    <img
                        className="absolute top-[-9px] left-[-9px] h-25 w-25 z-2 object-contain"
                        src={`${cdnBaseUrl}/uploads/942ba7b3-f359-4b06-8189-2223950b246c.png`}
                        alt={t("words.fanflair")}
                    />
                )}

                <img
                    className="absolute rounded-full h-21 w-21 object-cover transition-opacity duration-200"
                    src={
                        data.avatar?.startsWith("blob:")
                            ? data.avatar
                            : `${cdnBaseUrl}${data.avatar || window.config.metadata.assets.noImage}`
                    }
                    alt={t("words.avatar")}
                />

                {data.animatedAvatar && (
                    <img
                        className="absolute rounded-full h-21 w-21 object-cover transition-opacity duration-200 opacity-0 group-hover:opacity-100 group-hover/avatar:opacity-100"
                        src={
                            data.animatedAvatar?.startsWith("blob:")
                                ? data.animatedAvatar
                                : `${cdnBaseUrl}${data.animatedAvatar}`
                        }
                        alt={t("words.avatar")}
                    />
                )}

                {data.presence && (
                    <div className="pointer-events-auto absolute bottom-5 right-5">
                        <Presence
                            data={data} 
                        />
                    </div>
                )}
            </div>

            { data.status && ( 
                <>
                    <div className="absolute glass bg-[#00000085] rounded-full h-3 w-3 top-6.5 left-27 z-1 pointer-events-none" />
                    <div className="absolute glass bg-[#00000085] rounded-full h-2 w-2 top-9 left-25 z-1 pointer-events-none" />

                    <div className="absolute glass bg-[#00000085] rounded-lg p-2 left-30.5 max-w-[289px] z-1 pointer-events-none">
                        <div className="text-white text-xs line-clamp-3">
                            {data.status}
                        </div>
                    </div>
                </>
            )}

            <div className="relative top-22 flex flex-col h-46 w-full z-2 pointer-events-none">
                <div className="flex justify-between gap-2">
                    <div className="flex min-w-0 items-center overflow-hidden">
                        <span className="font-bold truncate leading-snug">
                            {data.displayName || primaryUsername || data.id}
                        </span>
                    </div>

                    {
                        window.session.userId !== data.id &&
                        (data.visibility !== "friends" && data.createdDate)
                    && (
                        <button
                            className="flex gap-2 h-7 px-3 text-xs btn btn-base-200 border-base-300 uppercase pointer-events-auto"
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                await handleFollowInteraction(
                                    data,
                                    isFollowing,
                                    isFollowInteractionLoading,
                                    setIsFollowing,
                                    setIsFollowInteractionLoading,
                                    setFollowCount
                                )
                            }}
                        >
                            <span className={`${isFollowInteractionLoading ? "loading" : ""} text-base font-nerdfont w-3`}>
                                {isFollowing ? "" : ""}
                            </span>
                            {isFollowing ? t("words.Unfollow") : t("words.Follow")}
                        </button>
                    )}

                    <div 
                        className="ml-auto flex shrink-0 pointer-events-auto"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <Badges 
                            data={data}
                            assetType={"USER"}
                            hasBackground={true}
                        />
                    </div>
                </div>

                <div className="flex min-w-0 mt-1 items-center overflow-hidden">
                    <span className="truncate text-xs leading-snug">
                        @{primaryUsername || data.id}
                        {data.visibility !== "friends" && "isFriends" in data && !data.isFriends ? ` • ${formatNumber(followCount).short} Follower${followCount !== 1 && "s"}` : ""}
                    </span>
                </div>

                <div className="text-xs line-clamp-3 my-2">
                    {(() => {
                        if (data.visibility === "friends" && (!data.about || window.session.userId !== data.id)) {
                            return `${t("words.Add")} ${data.displayName || primaryUsername || data.id} ${t("defaults.noFriendView")}`;
                        }

                        return data.about || t("defaults.noUserAbout");
                    })()}
                </div>
            </div>
        </div>
    );
}

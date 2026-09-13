import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatLongRelative } from "../scripts/time.js";
import { GetUserItemType } from "../../../_common/types/user.type.js";
import { usePresenceStore } from "../stores/presenceStore.js";

type Props = {
    data?: GetUserItemType;
    largeIcons?: boolean;
};

export default function Presence({ data, largeIcons = false }: Props) {
    const { t, ready: isTranslationReady } = useTranslation();

    const [, setTick] = useState(0);

    const livePresence = usePresenceStore((state) => 
        data?.id ? state.presenceMap[data.id] : undefined
    );

    const currentPresence = data?.isOnline ? livePresence?.presence || data?.presence : "offline";
    const currentLastActive = livePresence?.lastActive || data?.lastActive;

    useEffect(() => {
        if (currentPresence !== "offline" || !currentLastActive) return;

        const interval = setInterval(() => {
            setTick((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [currentPresence, currentLastActive]);

    const presenseClassList = `absolute rounded-full ${largeIcons ? "h-8 w-8 border-6" : "h-6 w-6 border-4"} bottom-0 right-0 border-base-100 z-2 tooltip tooltip-top`;

    if (!isTranslationReady) return null;

    switch (currentPresence) {
        case "online":
            return (
                <div
                    className={`${presenseClassList} bg-success`}
                    id={`presence-${data?.id}`}
                    data-tip={t("words.Online")}
                />
            );
        case "idle":
            return (
                <div
                    className={`${presenseClassList} bg-base-100`}
                    id={`presence-${data?.id}`}
                    data-tip={t("words.Idle")}
                >
                    <svg
                        className="relative top-0.25 left-0.25"
                        width={largeIcons ? "19" : "15"}
                        height={largeIcons ? "19" : "15"}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M14.0845 1.32397C14.0845 0.967041 14.2159 0.657227 14.4789 0.394287C14.7418 0.131348 15.0516 0 15.4084 0C15.5775 0 15.7277 0.0280762 15.8592 0.0844727C18.2817 0.967041 20.2441 2.46021 21.7465 4.56348C23.2488 6.66675 24 9.03296 24 11.6619C24 15.0798 22.7982 17.9907 20.3944 20.3943C17.9906 22.7981 15.0798 24 11.662 24C9.0329 24 6.65729 23.2488 4.53522 21.7466C2.41315 20.2441 0.920166 18.2817 0.0563354 15.8591C0.0187988 15.7654 0 15.615 0 15.4084C0 15.0518 0.13147 14.7417 0.394348 14.479C0.657288 14.2161 0.967163 14.0845 1.32397 14.0845C1.49298 14.0845 1.64319 14.1128 1.77466 14.1689C2.90143 14.5635 4 14.7605 5.07043 14.7605C7.73712 14.7605 10.0094 13.8215 11.8873 11.9436C13.7653 10.0657 14.7136 7.77466 14.7324 5.07031C14.7324 3.9436 14.5446 2.84497 14.169 1.77466C14.1127 1.62451 14.0845 1.47412 14.0845 1.32397L14.0845 1.32397Z"
                            fill="var(--color-premium)"
                            fillRule="evenodd"
                        />
                    </svg>
                </div>
            );
        case "dnd":
            return (
                <div
                    className={`${presenseClassList} bg-accent`}
                    id={`presence-${data?.id}`}
                    data-tip={t("words.DND")}
                >
                    <div
                        className={`
                            ${largeIcons ? "text-xl" : "text-base"} 
                            text-base-100 font-nerdfont leading-none w-full text-center
                        `}
                    >
                        󱘹
                    </div>
                </div>
            );
        case "offline":
            return (
                <div
                    className={`${presenseClassList} bg-base-300`}
                    id={`presence-${data?.id}`}
                >
                    <div className="tooltip-content">
                        <div className="font-bold">{t("words.LastActive")}</div>
                        <div className="text-xs">
                            {formatLongRelative(currentLastActive as string)}
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
}

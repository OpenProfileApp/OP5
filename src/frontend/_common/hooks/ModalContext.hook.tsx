import { createContext, useContext, useRef, ReactNode, useMemo } from "react";

import NotificationsModal, { NotificationsModalRef } from "../components/modals/NotificationsModal.js";
import MuteModal, { MuteModalRef } from "../components/modals/MuteModal.js";
import RestrictModal, { RestrictModalRef } from "../components/modals/RestrictModal.js";
import BlockModal, { BlockModalRef } from "../components/modals/BlockModal.js";
import ReportModal, { ReportModalRef } from "../components/modals/ReportModal.js";
import ShareModal, { ShareModalRef } from "../components/modals/ShareModal.js";
import CharacterModal, { CharacterModalRef } from "../components/modals/CharacterModal.js";
import EditUserProfileModal, { EditUserProfileModalRef } from "../../main/components/modals/EditUserProfileModal.js";
import { GetUserItemType } from "../../../_common/types/user.type.js";

interface ModalContextType {
    notificationsModal: {
        open: (...args: Parameters<NotificationsModalRef["open"]>) => void;
        close: () => void;
    };
    muteModal: {
        open: (...args: Parameters<MuteModalRef["open"]>) => void;
        close: () => void;
    };
    restrictModal: {
        open: (...args: Parameters<RestrictModalRef["open"]>) => void;
        close: () => void;
    };
    blockModal: {
        open: (...args: Parameters<BlockModalRef["open"]>) => void;
        close: () => void;
    };
    reportModal: {
        open: (...args: Parameters<ReportModalRef["open"]>) => void;
        close: () => void;
    };
    shareModal: {
        open: (...args: Parameters<ShareModalRef["open"]>) => void;
        close: () => void;
    };
    characterModal: {
        open: (...args: Parameters<CharacterModalRef["open"]>) => void;
        close: () => void;
    };
    editUserProfileModal: {
        open: (data: GetUserItemType, onSave?: (updatedData: GetUserItemType) => void) => Promise<GetUserItemType | null | undefined>;
        close: () => void;
    };
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
    const notificationsModalRef = useRef<NotificationsModalRef>(null);
    const muteModalRef = useRef<MuteModalRef>(null);
    const restrictModalRef = useRef<RestrictModalRef>(null);
    const blockModalRef = useRef<BlockModalRef>(null);
    const reportModalRef = useRef<ReportModalRef>(null);
    const shareModalRef = useRef<ShareModalRef>(null);
    const characterModalRef = useRef<CharacterModalRef>(null);
    const editUserProfileModalRef = useRef<EditUserProfileModalRef>(null);

    const value = useMemo(
        () => ({
            notificationsModal: {
                open: (...args: Parameters<NotificationsModalRef["open"]>) => {
                    notificationsModalRef.current?.open(...args);
                },
                close: () => {
                    notificationsModalRef.current?.close();
                },
            },
            muteModal: {
                open: (...args: Parameters<MuteModalRef["open"]>) => {
                    muteModalRef.current?.open(...args);
                },
                close: () => {
                    muteModalRef.current?.close();
                },
            },
            restrictModal: {
                open: (...args: Parameters<RestrictModalRef["open"]>) => {
                    restrictModalRef.current?.open(...args);
                },
                close: () => {
                    restrictModalRef.current?.close();
                },
            },
            blockModal: {
                open: (...args: Parameters<BlockModalRef["open"]>) => {
                    blockModalRef.current?.open(...args);
                },
                close: () => {
                    blockModalRef.current?.close();
                },
            },
            reportModal: {
                open: (...args: Parameters<ReportModalRef["open"]>) => {
                    reportModalRef.current?.open(...args);
                },
                close: () => {
                    reportModalRef.current?.close();
                },
            },
            shareModal: {
                open: (...args: Parameters<ShareModalRef["open"]>) => {
                    shareModalRef.current?.open(...args);
                },
                close: () => {
                    shareModalRef.current?.close();
                },
            },
            characterModal: {
                open: (...args: Parameters<CharacterModalRef["open"]>) => {
                    characterModalRef.current?.open(...args);
                },
                close: () => {
                    characterModalRef.current?.close();
                },
            },
            editUserProfileModal: {
                open: async (data: GetUserItemType, onSave?: (updatedData: GetUserItemType) => void) => {
                    return editUserProfileModalRef.current?.open(data, onSave);
                },
                close: () => {
                    editUserProfileModalRef.current?.close();
                },
            }
        }),
        []
    );

    return (
        <ModalContext.Provider value={value}>
            <NotificationsModal ref={notificationsModalRef} />
            <MuteModal ref={muteModalRef} />
            <RestrictModal ref={restrictModalRef} />
            <BlockModal ref={blockModalRef} />
            <ReportModal ref={reportModalRef} />
            <ShareModal ref={shareModalRef} />
            <CharacterModal ref={characterModalRef} />
            <EditUserProfileModal ref={editUserProfileModalRef} />

            {children}
        </ModalContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModals() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModals must be used within a ModalProvider");
    }
    return context;
}

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { toast, Toast } from "../scripts/toast.js";
import { AnimatePresence, motion } from "framer-motion";

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const toastClasses: Record<Toast["type"], string> = {
        info: "bg-base-200 border-base-300 text-base-content",
        success: "bg-success text-success-content border-success",
        warning: "bg-warning text-warning-content border-warning",
        error: "bg-error text-error-content border-error",
    };

    const defaultIcons: Record<Toast["type"], string> = {
        info: "",
        success: "",
        warning: "",
        error: "",
    };

    const removeToast = (id: number) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setToasts((prev) => prev.filter((x) => x.id !== id));
    };

    const getActivePortalTarget = () => {
        const openDialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
        if (openDialogs.length > 0) {
            return openDialogs[openDialogs.length - 1];
        }
        return document.body;
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPortalTarget(getActivePortalTarget());

        const unsubscribe = toast.subscribe((t) => {
            setPortalTarget(getActivePortalTarget());
            setToasts((prev) => [...prev, t]);
        });

        return () => {
            unsubscribe();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const activeToast = toasts[0];

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isHovered || !activeToast) return;

        const duration = activeToast.duration;

        timerRef.current = setTimeout(() => {
            removeToast(activeToast.id);
        }, duration);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [activeToast, isHovered]);

    if (!portalTarget) return null;

    return createPortal(
        <div
            className="fixed inset-x-0 top-4 z-[99999999] flex justify-center pointer-events-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                {activeToast && (
                    <motion.div
                        key={activeToast.id}
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className={`
                            alert origin-center flex items-center justify-between py-3.5 shadow-2xl w-max max-w-md pointer-events-auto
                            ${toastClasses[activeToast.type]}
                        `}
                    >
                        <div className="flex items-center gap-4 mx-auto">
                            {(activeToast.icon || defaultIcons[activeToast.type]) && (
                                <span className="flex items-center justify-center w-4 text-lg font-nerdfont leading-none shrink-0">
                                    {activeToast.icon || defaultIcons[activeToast.type]}
                                </span>
                            )}

                            <div className="flex flex-col text-center">
                                <span className="font-medium text-sm leading-snug">
                                    {activeToast.message}
                                </span>
                                {activeToast.subtext && (
                                    <span className="text-xs opacity-80 leading-snug mt-0.5">
                                        {activeToast.subtext}
                                    </span>
                                )}
                            </div>

                            <span 
                                className="flex items-center justify-center w-4 text-base font-nerdfont leading-none shrink-0 cursor-pointer"
                                onClick={() => 
                                    removeToast(activeToast.id)
                                }
                            >
                                
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        portalTarget
    );
}

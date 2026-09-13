import React, { useState, useEffect } from "react";
import { Tooltip } from "./Tooltip.js";
import { apiBaseUrl } from "../scripts/domains.js";
import { MetadataType } from "../../../_common/types/metadata.type.js";

import { URL } from "kage-library/client";

export interface Props {
    url: string;
    hideTooltip?: boolean;
    isPreview?: boolean;
    renderAsEmbed?: boolean;
}

export default function ExternalLink({
    url,
    hideTooltip = false,
    isPreview = false,
    renderAsEmbed = false,
}: Props) {
    const [metadata, setMetadata] = useState<MetadataType | null>(null);
    const [domain, setDomain] = useState<string | null>(null);
    
    const [isMainImageError, setIsMainImageError] = useState<boolean>(false);
    const [isTooltipImageError, setIsTooltipImageError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMainImageError(false);
        setIsTooltipImageError(false);

        async function fetchMetadata() {
            try {
                const urlObject = new URL(url);
                const parsedDomain = `${urlObject.subdomain}${urlObject.subdomain ? "." : ""}${urlObject.domain}`;

                const response = await fetch(
                    `${apiBaseUrl}/v3/metadata?url=${encodeURIComponent(url)}`,
                    { credentials: "include" }
                );

                if (isMounted) {
                    setDomain(parsedDomain);
                    if (response.ok) {
                        const data: MetadataType = await response.json();
                        setMetadata(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch external link metadata:", error);
            }
        }

        if (url) {
            fetchMetadata();
        }

        return () => {
            isMounted = false;
        };
    }, [url]);

    const isBrandFetchExperiment = window.session.user?.flags.includes("USE_BRANDFETCH_ICONS");

    const siteName = metadata?.siteName || "Website";
    const title = metadata?.title || domain;

    const getFallbackNode = (transparentBg = false) => (
        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 text-lg-content ${transparentBg ? "" : "bg-base-300"}`}>
            <span className={`font-nerdfont leading-none ${transparentBg ? "text-2xl" : "text-lg"}`}>
                
            </span>
        </div>
    );

    const handleLoad = (setError: React.Dispatch<React.SetStateAction<boolean>>) => (
        e: React.SyntheticEvent<HTMLImageElement>
    ) => {
        const img = e.currentTarget;
        const minSize = isBrandFetchExperiment ? 40 : 1;
        if (img.naturalWidth <= minSize || img.naturalHeight <= minSize) {
            setError(true);
        }
    };

    const tooltipImgSrc = metadata?.icon || metadata?.image;
    const tooltipImage = domain && tooltipImgSrc && !isTooltipImageError ? (
        <img
            key={`tooltip-${domain}`}
            className="w-10 h-10 rounded shrink-0 object-cover"
            src={tooltipImgSrc as string}
            onLoad={handleLoad(setIsTooltipImageError)}
            onError={() => setIsTooltipImageError(true)}
        />
    ) : (
        getFallbackNode(true)
    );

    const mainImgSrc = isBrandFetchExperiment 
        ? `https://cdn.brandfetch.io/${domain}?c=${window.config.integrations.brandfetch}` 
        : metadata?.icon || metadata?.image;

    const image = domain && mainImgSrc && !isMainImageError ? (
        <img
            key={`main-${domain}`}
            className="w-10 h-10 rounded shrink-0 object-cover"
            src={mainImgSrc as string}
            onLoad={handleLoad(setIsMainImageError)}
            onError={() => setIsMainImageError(true)}
        />
    ) : (
        getFallbackNode(false)
    );

    if (renderAsEmbed) {
        const renderAsEmbedContent = (
            <div className="flex items-center gap-4 border border-base-300 bg-base-200 hover:bg-base-300/50 rounded p-4 transition-colors w-full">
                {image}

                <div className="flex flex-col min-w-0">
                    <div className="font-medium">
                        <span className="truncate block">
                            {siteName}
                        </span>
                    </div>

                    {title && (
                        <span className="text-xs text-sub truncate block">
                            {title}
                        </span>
                    )}
                </div>
            </div>
        );

        if (isPreview) {
            return renderAsEmbedContent;
        }

        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full">
                {renderAsEmbedContent}
            </a>
        );
    }

    const innerElements = !hideTooltip ? (
        <div className="tooltip flex items-center justify-center">
            <Tooltip
                content={
                    <div className="tooltip-content bg-base-200 text-base-content border border-base-300 rounded shadow-2xl flex flex-col max-w-[300px] text-center p-1 items-center">
                        <div className="flex flex-col items-center p-1 gap-2 w-full">
                            {tooltipImage}

                            <div className="flex flex-col items-center w-full">
                                <div className="font-bold text-sm text-center">
                                    {siteName}
                                </div>

                                {title && (
                                    <>
                                        <hr className="w-full my-1" />
                                        <div className="text-xs text-sub text-center">
                                            {title}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                }
            >
                {image}
            </Tooltip>
        </div>
    ) : (
        image
    );

    if (isPreview) {
        return innerElements;
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer">
            {innerElements}
        </a>
    );
}

import { useRef, useState, useEffect } from "react";
import { parseGIF, decompressFrames } from "gifuct-js";

import { useObjectURL } from "../hooks/useObjectURL.hook.js";
import CropModal from "../../main/components/modals/CropImageModal.js";

type Props = {
    value: File | null;
    defaultUrl?: string | null;
    animatedDefaultUrl?: string | null;
    onChange: (
        file: File | null,
        base64Url: string | null,
        staticPreviewFile?: File | null,
        staticPreviewBase64?: string | null
    ) => void;
    accept: string;
    aspectRatio?: number;
    height?: string;
    width?: string;
    label?: string;
    className?: string;
};

function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export default function ImageInput({
    value,
    defaultUrl,
    animatedDefaultUrl,
    onChange,
    accept,
    aspectRatio,
    height,
    width,
    label,
    className = "",
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [rawFile, setRawFile] = useState<File | null>(null);
    const [rawImage, setRawImage] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isCleared, setIsCleared] = useState(false);

    const [staticFrameUrl, setStaticFrameUrl] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const fileUrl = useObjectURL(value);

    const previewUrl = isCleared
        ? null
        : fileUrl || (value === null && defaultUrl ? defaultUrl : null);

    const animatedUrl = isCleared
        ? null
        : (value && value.type === "image/gif" ? fileUrl : null) ||
          animatedDefaultUrl ||
          fileUrl ||
          defaultUrl;

    const isGif =
        value?.type === "image/gif" ||
        rawFile?.type === "image/gif" ||
        (previewUrl ? /^data:image\/gif/i.test(previewUrl) : false) ||
        (previewUrl ? /\.gif($|\?)/i.test(previewUrl) : false) ||
        (animatedDefaultUrl ? /\.gif($|\?)/i.test(animatedDefaultUrl) : false);

    useEffect(() => {
        const sourceForStaticFrame = animatedUrl || previewUrl;

        if (!sourceForStaticFrame) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStaticFrameUrl(null);
            return;
        }

        let isMounted = true;

        const generateStaticFrame = async () => {
            try {
                if (isGif) {
                    const response = await fetch(sourceForStaticFrame);
                    const arrayBuffer = await response.arrayBuffer();
                    const gif = parseGIF(arrayBuffer);
                    const frames = decompressFrames(gif, true);

                    if (!frames || frames.length === 0 || !isMounted) return;

                    const frame = frames[0];
                    const canvas = document.createElement("canvas");
                    canvas.width = gif.lsd.width;
                    canvas.height = gif.lsd.height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    const patchCanvas = document.createElement("canvas");
                    patchCanvas.width = frame.dims.width;
                    patchCanvas.height = frame.dims.height;
                    const patchCtx = patchCanvas.getContext("2d");

                    if (patchCtx) {
                        const patchData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
                        patchData.data.set(frame.patch);
                        patchCtx.putImageData(patchData, 0, 0);
                        ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

                        if (isMounted) {
                            setStaticFrameUrl(canvas.toDataURL("image/png"));
                        }
                    }
                } else {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = sourceForStaticFrame;

                    img.onload = () => {
                        if (!isMounted) return;

                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;

                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            setStaticFrameUrl(canvas.toDataURL("image/png"));
                        }
                    };

                    img.onerror = () => {
                        if (isMounted) setHasError(true);
                    };
                }
            } catch (err) {
                console.error("Failed to generate static frame:", err);
                if (isMounted) setHasError(true);
            }
        };

        generateStaticFrame();

        return () => {
            isMounted = false;
        };
    }, [previewUrl, animatedUrl, isGif]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCleared(false);
        setHasError(false);
    }, [defaultUrl]);

    const resetInput = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    const cleanupRawImage = () => {
        if (rawImage) {
            URL.revokeObjectURL(rawImage);
            setRawImage(null);
            setRawFile(null);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCleared(true);
        setStaticFrameUrl(null);

        onChange(null, null, null, null);
        resetInput();
    };

    const handleCropComplete = async (croppedFile: File) => {
        setIsCleared(false);
        setHasError(false);

        let staticFile: File | null = null;
        let staticBase64Url: string | null = null;

        if (croppedFile.type === "image/gif") {
            try {
                const objectUrl = URL.createObjectURL(croppedFile);
                const response = await fetch(objectUrl);
                const arrayBuffer = await response.arrayBuffer();
                const gif = parseGIF(arrayBuffer);
                const frames = decompressFrames(gif, true);

                if (frames && frames.length > 0) {
                    const frame = frames[0];
                    const canvas = document.createElement("canvas");
                    canvas.width = gif.lsd.width;
                    canvas.height = gif.lsd.height;

                    const ctx = canvas.getContext("2d");
                    const patchCanvas = document.createElement("canvas");
                    patchCanvas.width = frame.dims.width;
                    patchCanvas.height = frame.dims.height;
                    const patchCtx = patchCanvas.getContext("2d");

                    if (ctx && patchCtx) {
                        const patchData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
                        patchData.data.set(frame.patch);
                        patchCtx.putImageData(patchData, 0, 0);
                        ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

                        staticBase64Url = canvas.toDataURL("image/png");
                        staticFile = dataURLtoFile(staticBase64Url, "preview_static.png");
                        setStaticFrameUrl(staticBase64Url);
                    }
                }
                URL.revokeObjectURL(objectUrl);
            } catch (err) {
                console.error("Failed to produce static preview file:", err);
            }
        }

        const mainBase64Url = await fileToBase64(croppedFile);

        onChange(croppedFile, mainBase64Url, staticFile, staticBase64Url);

        setShowCrop(false);
        cleanupRawImage();
    };

    const sizeClasses = `${height ? `h-${height}` : ""} ${width ? `w-${width}` : ""}`.trim();

    const displayImageSrc = isHovered 
        ? animatedUrl || previewUrl 
        : staticFrameUrl || previewUrl;

    return (
        <>
            <div
                className={`relative group cursor-pointer border-2 border-base-300 border-dashed rounded flex items-center justify-center overflow-hidden ${sizeClasses} ${className}`.trim()}
                onClick={openFilePicker}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {previewUrl && !hasError ? (
                    <>
                        <img
                            src={displayImageSrc ?? undefined}
                            alt={label ?? "image"}
                            className="h-full w-full object-cover rounded"
                            onError={() => setHasError(true)}
                        />

                        <button
                            type="button"
                            className="absolute top-0 right-1 p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
                            onClick={handleClear}
                        >
                            <span className="font-nerdfont text-base"></span>
                        </button>
                    </>
                ) : (
                    <span className="flex items-center justify-center opacity-60 hover:opacity-100 transition h-full w-full">
                        <span className="font-nerdfont text-xl"></span>
                    </span>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        resetInput();

                        const cropPreviewUrl = URL.createObjectURL(file);
                        setRawFile(file);
                        setRawImage(cropPreviewUrl);
                        setShowCrop(true);
                    }}
                />
            </div>

            {showCrop && rawImage && (
                <CropModal
                    image={rawImage}
                    fileType={rawFile?.type}
                    onCancel={() => {
                        setShowCrop(false);
                        cleanupRawImage();
                    }}
                    onComplete={handleCropComplete}
                    aspectRatio={aspectRatio || 0}
                />
            )}
        </>
    );
}

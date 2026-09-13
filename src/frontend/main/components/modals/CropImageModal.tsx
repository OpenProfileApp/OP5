import { useRef, useState } from "react";
import { CropperRef, Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { parseGIF, decompressFrames } from "gifuct-js";

async function cropAnimatedGif(
    imageUrl: string,
    crop: { left: number; top: number; width: number; height: number }
): Promise<Blob> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const gifshot = (await import("gifshot")).default;

    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();

    const gif = parseGIF(arrayBuffer);
    const frames = decompressFrames(gif, true);

    if (!frames || frames.length === 0) {
        throw new Error("Failed to decode GIF frames.");
    }

    const croppedFrames: string[] = [];

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = gif.lsd.width;
    fullCanvas.height = gif.lsd.height;
    const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true })!;

    const patchCanvas = document.createElement("canvas");
    const patchCtx = patchCanvas.getContext("2d")!;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.round(crop.width);
    cropCanvas.height = Math.round(crop.height);
    const cropCtx = cropCanvas.getContext("2d")!;

    for (const frame of frames) {
        const { width, height, left, top } = frame.dims;

        patchCanvas.width = width;
        patchCanvas.height = height;

        const patchData = patchCtx.createImageData(width, height);
        patchData.data.set(frame.patch);
        patchCtx.putImageData(patchData, 0, 0);

        fullCtx.drawImage(patchCanvas, left, top);

        cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        cropCtx.drawImage(
            fullCanvas,
            crop.left, crop.top, crop.width, crop.height,
            0, 0, cropCanvas.width, cropCanvas.height
        );

        croppedFrames.push(cropCanvas.toDataURL("image/png"));
    }

    return new Promise((resolve, reject) => {
        gifshot.createGIF(
            {
                images: croppedFrames,
                gifWidth: Math.round(crop.width),
                gifHeight: Math.round(crop.height),
                interval: (frames[0]?.delay || 100) / 1000,
            },
            (obj: { error: unknown; image: string | URL | Request; }) => {
                if (!obj.error) {
                    fetch(obj.image)
                        .then((res) => res.blob())
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(obj.error);
                }
            }
        );
    });
}

type Props = {
    image: string;
    fileType?: string;
    onCancel: () => void;
    onComplete: (file: File) => void;
    aspectRatio: number;
};

export default function CropModal({
    image,
    fileType,
    onCancel,
    onComplete,
    aspectRatio,
}: Props) {
    const cropperRef = useRef<CropperRef>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const getTargetFormat = () => {
        if (fileType === "image/png" || image.includes("image/png")) {
            return { type: "image/png", ext: "png" };
        }
        if (fileType === "image/webp" || image.includes("image/webp")) {
            return { type: "image/webp", ext: "webp" };
        }
        return { type: "image/jpeg", ext: "jpg" };
    };

    const handleSave = async () => {
        const cropper = cropperRef.current;
        if (!cropper) return;

        const coordinates = cropper.getCoordinates();
        const canvas = cropper.getCanvas();
        if (!coordinates || !canvas) return;

        setIsProcessing(true);

        const isGif = 
            fileType === "image/gif" || 
            image.startsWith("data:image/gif") || 
            image.includes("image/gif");

        const target = getTargetFormat();

        try {
            if (isGif) {
                const blob = await cropAnimatedGif(image, {
                    left: coordinates.left,
                    top: coordinates.top,
                    width: coordinates.width,
                    height: coordinates.height,
                });
                const filename = `cropped_${Date.now()}.gif`;
                const file = new File([blob], filename, { type: "image/gif" });
                onComplete(file);
            } else {
                canvas.toBlob((blob) => {
                    if (!blob) return;
                    const filename = `cropped_${Date.now()}.${target.ext}`;
                    const file = new File([blob], filename, { type: target.type });
                    onComplete(file);
                }, target.type);
            }
        } catch (err) {
            console.error("GIF Cropping error, falling back to static export:", err);
            canvas.toBlob((blob) => {
                if (!blob) return;
                const filename = `cropped_${Date.now()}.${target.ext}`;
                const file = new File([blob], filename, { type: target.type });
                onComplete(file);
            }, target.type);
        } finally {
            setIsProcessing(false);
        }
    };

    const cropperAspectRatio =
        aspectRatio > 0
            ? { minimum: aspectRatio, maximum: aspectRatio }
            : undefined;

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
            <Cropper
                ref={cropperRef}
                src={image}
                className="h-full w-full rounded"
                stencilProps={{
                    aspectRatio: cropperAspectRatio,
                    grid: true,
                    lines: true,
                    handlers: {
                        eastNorth: true,
                        westNorth: true,
                        eastSouth: true,
                        westSouth: true,
                    },
                }}
                defaultSize={({ imageSize, visibleArea }) => ({
                    width: (visibleArea || imageSize).width,
                    height: (visibleArea || imageSize).height,
                })}
            />

            <div className="flex items-center justify-center gap-3 mx-4 mt-4 w-full">
                <button
                    className="btn flex-1"
                    onClick={onCancel}
                    disabled={isProcessing}
                >
                    Cancel
                </button>

                <button
                    className="btn btn-accent flex-4"
                    onClick={handleSave}
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Crop"}
                </button>
            </div>
        </div>
    );
}

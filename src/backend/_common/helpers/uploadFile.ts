import https from "https";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { AdvancedError } from "kage-library";

import { config } from "../../../../app.config.js";
import { assertNotNull } from "../../../_common/asserts/notNull.assert.js";
import { i18n, id } from "../instances.js";

export interface UploadOptions {
    folder: string;
    fileInput: string;
    name?: string;
}

export interface UploadResult {
    path: string;
    filename: string | null;
    size: number | null;
    mime: string | null;
}

async function compressToFitLimit(
    buffer: Buffer,
    mimeType: string
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
    let quality = 80;
    let maxDimension = 1920;
    let currentBuffer = buffer;

    const outputMime = mimeType;
    const ext = mimeType === "image/jpeg" ? "jpg" : "webp";

    while (currentBuffer.length > config.limits.uploadSize && quality >= 20) {
        const pipeline = sharp(currentBuffer).resize({
            width: maxDimension,
            height: maxDimension,
            fit: "inside",
            withoutEnlargement: true
        });

        if (mimeType === "image/jpeg") {
            currentBuffer = await pipeline.jpeg({ quality, progressive: true }).toBuffer();
        } else {
            currentBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
        }

        quality -= 15;
        maxDimension = Math.floor(maxDimension * 0.8);
    }

    return {
        buffer: currentBuffer,
        ext,
        mime: outputMime
    };
}

/**
 * Uploads a file and enforces the max size from config
 */
export default async function uploadFile({
    folder,
    fileInput,
    name,
}: UploadOptions): Promise<UploadResult | null> {
    assertNotNull([folder, fileInput]);

    let fileBuffer: Buffer;

    if (fileInput.startsWith("http://") || fileInput.startsWith("https://")) {
        const agent = fileInput.startsWith("https://") && !config.isProduction
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined;

        const response = await fetch(fileInput, { agent });

        if (!response.ok) {
            throw new AdvancedError({
                code: 404,
                message: i18n.t("responses.fileNotFound")
            });
        }

        fileBuffer = Buffer.from(await response.arrayBuffer());
    } else {
        const base64Data = fileInput.includes(",") ? fileInput.split(",")[1] : fileInput;

        fileBuffer = Buffer.from(base64Data, "base64");
    }

    const type = await fileTypeFromBuffer(fileBuffer);

    if (!type) {
        throw new AdvancedError({
            code: 400,
            message: i18n.t("responses.fileUnknown")
        });
    }

    const allowedMediaTypes = ["image", "audio", "video"];

    if (!allowedMediaTypes.some((t) => type.mime.startsWith(t))) {
        throw new AdvancedError({
            code: 400,
            message: i18n.t("responses.fileUnknown")
        });
    }

    let finalBuffer = fileBuffer;
    let finalExt = type.ext;
    let finalMime = type.mime;

    if (type.mime === "image/gif") {
        if (fileBuffer.length > config.limits.uploadSize) {
            throw new AdvancedError({
                code: 400,
                message: i18n.t("responses.fileTooLarge")
            });
        }
        finalExt = "gif";
        finalMime = "image/gif";
    } else if (type.mime.startsWith("image")) {
        const imageInstance = sharp(fileBuffer, { failOn: "none", limitInputPixels: false });
        const metadata = await imageInstance.metadata();

        let pipeline = imageInstance;

        if (metadata.orientation) {
            pipeline = pipeline.rotate();
        } else {
            pipeline = pipeline.rotate();
        }

        finalBuffer = await pipeline
            .resize({
                width: 1920,
                height: 1920,
                fit: "inside",
                withoutEnlargement: true
            })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

        finalExt = "webp";
        finalMime = "image/webp";

        if (finalBuffer.length > config.limits.uploadSize) {
            const compressed = await compressToFitLimit(finalBuffer, finalMime);
            finalBuffer = compressed.buffer;
            finalExt = compressed.ext;
            finalMime = compressed.mime;
        }
    } else if (fileBuffer.length > config.limits.uploadSize) {
        throw new AdvancedError({
            code: 400,
            message: i18n.t("responses.fileTooLarge")
        });
    }

    if (finalBuffer.length > config.limits.uploadSize) {
        throw new AdvancedError({
            code: 400,
            message: i18n.t("responses.fileTooLarge")
        });
    }

    const fileName = `${name || id.gen("HASH")}.${finalExt}`;
    const filePath = path.join(config.folders.data, "uploads", folder, fileName);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, finalBuffer);

    return {
        path: `/uploads/${folder}/${fileName}`,
        filename: fileName,
        size: finalBuffer.length,
        mime: finalMime
    };
}

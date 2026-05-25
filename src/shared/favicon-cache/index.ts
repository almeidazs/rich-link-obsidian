import { type App, normalizePath, requestUrl } from "obsidian";

const ICON_FOLDER_ROOT = "_rich-link-resolver";
const ICON_FOLDER = `${ICON_FOLDER_ROOT}/icons`;
const ICON_SIZE = 16;

export async function cacheResizedFavicon(
	app: App,
	iconUrl: string | null,
): Promise<string | null> {
	if (!iconUrl) {
		return null;
	}

	const iconPath = await ensureLocalIcon(app, iconUrl);
	if (!iconPath) {
		return null;
	}

	const file = app.vault.getFileByPath(iconPath);
	return file ? app.vault.getResourcePath(file) : null;
}

async function ensureLocalIcon(
	app: App,
	iconUrl: string,
): Promise<string | null> {
	const iconHash = await hashValue(iconUrl);
	const iconPath = normalizePath(`${ICON_FOLDER}/${iconHash}.png`);

	if (app.vault.getFileByPath(iconPath)) {
		return iconPath;
	}

	await ensureFolder(app, ICON_FOLDER_ROOT);
	await ensureFolder(app, ICON_FOLDER);

	try {
		const response = await requestUrl({
			url: iconUrl,
			headers: {
				Accept: "image/*",
			},
			throw: false,
		});

		if (response.status >= 400) {
			return null;
		}

		const resizedIcon = await resizeImage(response.arrayBuffer, ICON_SIZE);
		if (!resizedIcon) {
			return null;
		}

		if (await app.vault.adapter.exists(iconPath)) {
			return iconPath;
		}

		await app.vault.createBinary(iconPath, resizedIcon);
		return iconPath;
	} catch {
		return null;
	}
}

async function ensureFolder(app: App, path: string): Promise<void> {
	if (await app.vault.adapter.exists(path)) {
		return;
	}

	await app.vault.createFolder(path);
}

async function resizeImage(
	imageData: ArrayBuffer,
	size: number,
): Promise<ArrayBuffer | null> {
	try {
		const blob = new Blob([imageData]);
		const imageUrl = URL.createObjectURL(blob);

		try {
			const image = await loadImage(imageUrl);
			const canvas = document.createElement("canvas");
			canvas.width = size;
			canvas.height = size;

			const context = canvas.getContext("2d");
			if (!context) {
				return null;
			}

			context.clearRect(0, 0, size, size);
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = "high";
			context.drawImage(image, 0, 0, size, size);

			const resultBlob = await canvasToBlob(canvas);
			return await resultBlob.arrayBuffer();
		} finally {
			URL.revokeObjectURL(imageUrl);
		}
	} catch {
		return null;
	}
}

function loadImage(source: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Unable to load image"));
		image.src = source;
	});
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error("Unable to convert canvas to blob"));
				return;
			}

			resolve(blob);
		}, "image/png");
	});
}

async function hashValue(value: string): Promise<string> {
	const encoded = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", encoded);

	return Array.from(new Uint8Array(digest))
		.map((part) => part.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 16);
}

import sharp from "sharp";
import { safeAwait } from "./error.js";
import type { AnimeResponse } from "../helpers/anime.js";
import { writeFileSync } from "fs";

export const getSmallImage = async (image: AnimeResponse) => {
  const { result: response } = await safeAwait(fetch(image.url));
  if (!response) return;
  const { result: buffer } = await safeAwait(response.arrayBuffer());
  if (!buffer) return;
  const maxSize = 1280;
  const aspectRatio = image.width / image.height;
  let newWidth, newHeight;

  if (image.width > image.height) {
    newWidth = maxSize;
    newHeight = Math.round(maxSize / aspectRatio);
  } else {
    newHeight = maxSize;
    newWidth = Math.round(maxSize * aspectRatio);
  }
  const { result: imageBlob } = await safeAwait(
    sharp(buffer)
      .resize(newWidth, newHeight)
      .toFormat("webp", { quality: 80 })
      .toBuffer()
  );
  if (!imageBlob) return;
  return imageBlob;
};

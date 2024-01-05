import { safeAwait } from "../utils/error.js";
import * as z from "zod";
const AnimeResponseSchema = z.object({
  extension: z.string(),
  image_id: z.number(),
  source: z.string(),
  width: z.number(),
  height: z.number(),
  url: z.string(),
  preview_url: z.string(),
});
export type AnimeResponse = z.infer<typeof AnimeResponseSchema>;
export const getAnime = async () => {
  const Link = "https://api.waifu.im/search/";
  const { result: response } = await safeAwait(fetch(Link));
  if (!response) return;
  const { result: data } = await safeAwait(response.json());
  if (
    !data ||
    typeof data != "object" ||
    !("images" in data) ||
    !Array.isArray(data.images) ||
    !data.images[0]
  )
    return;
  const { result: image } = await safeAwait(
    AnimeResponseSchema.parseAsync(data.images[0])
  );
  if (!image) return;
  return image;
};

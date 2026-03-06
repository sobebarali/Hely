import { z } from "zod";

export const uploadBrandingAssetSchema = z.object({
	body: z.object({
		image: z
			.string()
			.min(1, "Base64 image data is required")
			.regex(
				/^data:image\/(jpeg|png|jpg|svg\+xml|x-icon|vnd\.microsoft\.icon);base64,/,
				"Must be a valid base64-encoded image (JPEG, PNG, SVG, or ICO)",
			),
	}),
	params: z.object({
		type: z.enum(["logo", "favicon"], {
			message: "Type must be 'logo' or 'favicon'",
		}),
	}),
});

export type UploadBrandingAssetInput = z.infer<
	typeof uploadBrandingAssetSchema
>;

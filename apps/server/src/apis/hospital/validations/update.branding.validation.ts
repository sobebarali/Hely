import { z } from "zod";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const updateBrandingSchema = z.object({
	body: z.object({
		appName: z.string().min(1).max(100).optional(),
		logoUrl: z.string().url().optional(),
		faviconUrl: z.string().url().optional(),
		supportEmail: z.string().email().optional(),
		primaryColor: z
			.string()
			.regex(hexColorRegex, "Must be a valid hex color (e.g. #d97706)")
			.optional(),
		accentColor: z
			.string()
			.regex(hexColorRegex, "Must be a valid hex color (e.g. #d97706)")
			.optional(),
		customDomain: z
			.string()
			.min(1)
			.max(253)
			.regex(
				/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/,
				"Must be a valid domain",
			)
			.optional()
			.nullable(),
	}),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>["body"];

export type { BrandingOutput } from "./branding.types";

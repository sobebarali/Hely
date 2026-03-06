import { z } from "zod";

export const getProblemsSchema = z.object({
	params: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
	}),
	query: z.object({
		status: z.enum(["ACTIVE", "RESOLVED", "ALL"]).default("ACTIVE"),
	}),
});

export type GetProblemsParams = z.infer<typeof getProblemsSchema>["params"];
export type GetProblemsQuery = z.infer<typeof getProblemsSchema>["query"];

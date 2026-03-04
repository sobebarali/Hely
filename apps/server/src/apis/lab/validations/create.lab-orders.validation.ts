import { z } from "zod";

export const createLabOrderSchema = z.object({
	body: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
		doctorId: z.string().min(1, "Doctor ID is required"),
		tests: z
			.array(
				z.object({
					testId: z.string().min(1, "Test ID is required"),
					priority: z.enum(["ROUTINE", "URGENT", "STAT"]).default("ROUTINE"),
					clinicalNotes: z.string().optional(),
				}),
			)
			.min(1, "At least one test is required"),
		appointmentId: z.string().optional(),
		admissionId: z.string().optional(),
		diagnosis: z.string().optional(),
		notes: z.string().optional(),
	}),
});

export type CreateLabOrderInput = z.infer<
	typeof createLabOrderSchema.shape.body
>;

export interface CreateLabOrderOutput {
	id: string;
	orderId: string;
	patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	};
	doctor: {
		id: string;
		employeeId: string;
		firstName: string;
		lastName: string;
	};
	tests: Array<{
		testId: string;
		testName: string;
		testCode: string;
		priority: string;
		status: string;
		clinicalNotes?: string;
	}>;
	status: string;
	diagnosis?: string;
	notes?: string;
	createdAt: string;
}

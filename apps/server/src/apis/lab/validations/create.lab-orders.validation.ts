import { z } from "zod";

const TestPriorityEnum = z.enum(["ROUTINE", "URGENT", "STAT"]);

export const createLabOrderSchema = z.object({
	body: z.object({
		patientId: z.string().min(1, "Patient ID is required"),
		doctorId: z.string().min(1, "Doctor ID is required"),
		tests: z
			.array(
				z.object({
					testId: z.string().min(1, "Test ID is required"),
					priority: TestPriorityEnum.default("ROUTINE"),
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

export interface PatientSummary {
	id: string;
	patientId: string;
	firstName: string;
	lastName: string;
}

export interface DoctorSummary {
	id: string;
	employeeId: string;
	firstName: string;
	lastName: string;
}

export interface TestItemSummary {
	testId: string;
	testName: string;
	testCode: string;
	priority: string;
	status: string;
	clinicalNotes?: string;
}

export interface CreateLabOrderOutput {
	id: string;
	orderId: string;
	patient: PatientSummary;
	doctor: DoctorSummary;
	tests: TestItemSummary[];
	status: string;
	diagnosis?: string;
	notes?: string;
	createdAt: string;
}

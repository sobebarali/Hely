/**
 * EMR (Electronic Medical Records) API Client
 *
 * This client interfaces with the /api/emr/* endpoints on the server.
 */

import { authenticatedRequest } from "./api-client";

// Re-export ApiError for backward compatibility
export type { ApiError } from "./api-client";

// ===== Type Definitions =====

// Clinical note types
export type ClinicalNoteType =
	| "SOAP"
	| "PROGRESS"
	| "PROCEDURE"
	| "DISCHARGE"
	| "CONSULTATION"
	| "OPERATIVE";

export type ClinicalNoteStatus = "DRAFT" | "SIGNED" | "AMENDED";

export type DiagnosisType = "PRIMARY" | "SECONDARY";

export type ProblemStatus = "ACTIVE" | "RESOLVED" | "ALL";

export type TimelineEventType =
	| "NOTE"
	| "VITALS"
	| "LAB"
	| "PRESCRIPTION"
	| "APPOINTMENT"
	| "ADMISSION";

export type AllergySeverity = "MILD" | "MODERATE" | "SEVERE";

// Sub-types

export interface Diagnosis {
	code: string;
	description: string;
	type: DiagnosisType;
}

export interface Procedure {
	code: string;
	description: string;
}

export interface Amendment {
	reason: string;
	content: string;
	amendedBy: string;
	amendedAt: string;
}

export interface Allergy {
	allergen: string;
	reaction?: string;
	severity?: AllergySeverity;
}

export interface Medication {
	name: string;
	dosage?: string;
	frequency?: string;
	startDate?: string;
	endDate?: string;
}

export interface SurgicalHistoryEntry {
	procedure: string;
	date?: string;
	notes?: string;
}

export interface FamilyHistoryEntry {
	condition: string;
	relationship?: string;
	notes?: string;
}

export interface SocialHistory {
	smoking?: string;
	alcohol?: string;
	exercise?: string;
	occupation?: string;
	notes?: string;
}

export interface Immunization {
	vaccine: string;
	date?: string;
	notes?: string;
}

export interface PastMedicalHistoryEntry {
	condition: string;
	diagnosedDate?: string;
	status?: string;
	notes?: string;
}

export interface Problem {
	id: string;
	code: string;
	description: string;
	status: string;
	onsetDate?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

// ===== Input Types =====

export interface CreateClinicalNoteInput {
	patientId: string;
	encounterId?: string;
	admissionId?: string;
	type: ClinicalNoteType;
	chiefComplaint?: string;
	subjective?: string;
	objective?: string;
	assessment?: string;
	plan?: string;
	content?: string;
	diagnosis?: Diagnosis[];
	procedures?: Procedure[];
}

export interface UpdateClinicalNoteInput {
	chiefComplaint?: string;
	subjective?: string;
	objective?: string;
	assessment?: string;
	plan?: string;
	content?: string;
	diagnosis?: Diagnosis[];
	procedures?: Procedure[];
}

export interface ListClinicalNotesParams {
	page?: number;
	limit?: number;
	patientId?: string;
	type?: ClinicalNoteType;
	status?: ClinicalNoteStatus;
	authorId?: string;
	startDate?: string;
	endDate?: string;
	search?: string;
	sortBy?: "createdAt" | "updatedAt" | "type" | "status";
	sortOrder?: "asc" | "desc";
}

export interface AmendNoteInput {
	reason: string;
	content: string;
}

export interface UpdateMedicalHistoryInput {
	allergies?: Allergy[];
	medications?: Medication[];
	surgicalHistory?: SurgicalHistoryEntry[];
	familyHistory?: FamilyHistoryEntry[];
	socialHistory?: SocialHistory;
	immunizations?: Immunization[];
	pastMedicalHistory?: PastMedicalHistoryEntry[];
}

export interface AddProblemInput {
	code: string;
	description: string;
	onsetDate?: string;
	notes?: string;
}

export interface ListProblemsParams {
	status?: ProblemStatus;
}

export interface ListTimelineParams {
	page?: number;
	limit?: number;
	type?: TimelineEventType;
	startDate?: string;
	endDate?: string;
}

// ===== Output Types =====

export interface CreateClinicalNoteOutput {
	id: string;
	noteId: string;
	patientId: string;
	type: ClinicalNoteType;
	status: ClinicalNoteStatus;
	authorId: string;
	createdAt: string;
}

export interface ClinicalNoteListItem {
	id: string;
	noteId: string;
	patientId: string;
	type: ClinicalNoteType;
	status: ClinicalNoteStatus;
	authorId: string;
	chiefComplaint?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ListClinicalNotesOutput {
	data: ClinicalNoteListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface ClinicalNoteDetail {
	id: string;
	noteId: string;
	patientId: string;
	encounterId?: string;
	type: ClinicalNoteType;
	chiefComplaint?: string;
	subjective?: string;
	objective?: string;
	assessment?: string;
	plan?: string;
	content?: string;
	diagnosis?: Diagnosis[];
	procedures?: Procedure[];
	status: ClinicalNoteStatus;
	authorId: string;
	signedBy?: string;
	signedAt?: string;
	amendments?: Amendment[];
	createdAt: string;
	updatedAt: string;
}

export interface MedicalHistory {
	allergies?: Allergy[];
	medications?: Medication[];
	surgicalHistory?: SurgicalHistoryEntry[];
	familyHistory?: FamilyHistoryEntry[];
	socialHistory?: SocialHistory;
	immunizations?: Immunization[];
	pastMedicalHistory?: PastMedicalHistoryEntry[];
}

export interface TimelineEvent {
	id: string;
	type: TimelineEventType;
	date: string;
	[key: string]: unknown;
}

export interface ListTimelineOutput {
	data: TimelineEvent[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// ===== EMR API Functions =====

// --- Clinical Notes ---

/**
 * Create a new clinical note
 */
export async function createClinicalNote(
	input: CreateClinicalNoteInput,
): Promise<CreateClinicalNoteOutput> {
	return authenticatedRequest<CreateClinicalNoteOutput>("/api/emr/notes", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

/**
 * List clinical notes with pagination and filters
 */
export async function listClinicalNotes(
	params: ListClinicalNotesParams = {},
): Promise<ListClinicalNotesOutput> {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.patientId) searchParams.set("patientId", params.patientId);
	if (params.type) searchParams.set("type", params.type);
	if (params.status) searchParams.set("status", params.status);
	if (params.authorId) searchParams.set("authorId", params.authorId);
	if (params.startDate) searchParams.set("startDate", params.startDate);
	if (params.endDate) searchParams.set("endDate", params.endDate);
	if (params.search) searchParams.set("search", params.search);
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);
	if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

	const queryString = searchParams.toString();
	const endpoint = `/api/emr/notes${queryString ? `?${queryString}` : ""}`;

	return authenticatedRequest<ListClinicalNotesOutput>(endpoint);
}

/**
 * Get a clinical note by ID
 */
export async function getClinicalNote(
	noteId: string,
): Promise<ClinicalNoteDetail> {
	return authenticatedRequest<ClinicalNoteDetail>(`/api/emr/notes/${noteId}`);
}

/**
 * Update a clinical note (draft only)
 */
export async function updateClinicalNote({
	noteId,
	data,
}: {
	noteId: string;
	data: UpdateClinicalNoteInput;
}): Promise<ClinicalNoteDetail> {
	return authenticatedRequest<ClinicalNoteDetail>(`/api/emr/notes/${noteId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

/**
 * Sign a clinical note
 */
export async function signClinicalNote(
	noteId: string,
): Promise<ClinicalNoteDetail> {
	return authenticatedRequest<ClinicalNoteDetail>(
		`/api/emr/notes/${noteId}/sign`,
		{
			method: "POST",
		},
	);
}

/**
 * Amend a signed clinical note
 */
export async function amendClinicalNote({
	noteId,
	data,
}: {
	noteId: string;
	data: AmendNoteInput;
}): Promise<ClinicalNoteDetail> {
	return authenticatedRequest<ClinicalNoteDetail>(
		`/api/emr/notes/${noteId}/amend`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
}

// --- Patient Medical History ---

/**
 * Get medical history for a patient
 */
export async function getMedicalHistory(
	patientId: string,
): Promise<MedicalHistory> {
	return authenticatedRequest<MedicalHistory>(
		`/api/emr/patients/${patientId}/history`,
	);
}

/**
 * Update medical history for a patient
 */
export async function updateMedicalHistory({
	patientId,
	data,
}: {
	patientId: string;
	data: UpdateMedicalHistoryInput;
}): Promise<MedicalHistory> {
	return authenticatedRequest<MedicalHistory>(
		`/api/emr/patients/${patientId}/history`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
}

// --- Patient Problems ---

/**
 * Get problem list for a patient
 */
export async function getProblems(
	patientId: string,
	params: ListProblemsParams = {},
): Promise<Problem[]> {
	const searchParams = new URLSearchParams();

	if (params.status) searchParams.set("status", params.status);

	const queryString = searchParams.toString();
	const endpoint = `/api/emr/patients/${patientId}/problems${queryString ? `?${queryString}` : ""}`;

	return authenticatedRequest<Problem[]>(endpoint);
}

/**
 * Add a problem to a patient's problem list
 */
export async function addProblem({
	patientId,
	data,
}: {
	patientId: string;
	data: AddProblemInput;
}): Promise<Problem> {
	return authenticatedRequest<Problem>(
		`/api/emr/patients/${patientId}/problems`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
}

// --- Patient Timeline ---

/**
 * Get patient timeline
 */
export async function getTimeline(
	patientId: string,
	params: ListTimelineParams = {},
): Promise<ListTimelineOutput> {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.type) searchParams.set("type", params.type);
	if (params.startDate) searchParams.set("startDate", params.startDate);
	if (params.endDate) searchParams.set("endDate", params.endDate);

	const queryString = searchParams.toString();
	const endpoint = `/api/emr/patients/${patientId}/timeline${queryString ? `?${queryString}` : ""}`;

	return authenticatedRequest<ListTimelineOutput>(endpoint);
}

// EMR client object for convenience
export const emrClient = {
	createClinicalNote,
	listClinicalNotes,
	getClinicalNote,
	updateClinicalNote,
	signClinicalNote,
	amendClinicalNote,
	getMedicalHistory,
	updateMedicalHistory,
	getProblems,
	addProblem,
	getTimeline,
};

export default emrClient;

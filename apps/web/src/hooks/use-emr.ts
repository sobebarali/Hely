/**
 * React hooks for EMR client using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type AddProblemInput,
	type AmendNoteInput,
	type CreateClinicalNoteInput,
	emrClient,
	type ListClinicalNotesParams,
	type ListProblemsParams,
	type ListTimelineParams,
	type UpdateClinicalNoteInput,
	type UpdateMedicalHistoryInput,
} from "../lib/emr-client";

// Query keys
export const emrKeys = {
	all: ["emr"] as const,
	// Clinical Notes
	notes: () => [...emrKeys.all, "notes"] as const,
	notesList: () => [...emrKeys.notes(), "list"] as const,
	notesListFiltered: (params: ListClinicalNotesParams) =>
		[...emrKeys.notesList(), params] as const,
	noteDetails: () => [...emrKeys.notes(), "detail"] as const,
	noteDetail: (noteId: string) => [...emrKeys.noteDetails(), noteId] as const,
	// Medical History
	histories: () => [...emrKeys.all, "history"] as const,
	history: (patientId: string) => [...emrKeys.histories(), patientId] as const,
	// Problems
	problems: () => [...emrKeys.all, "problems"] as const,
	problemsByPatient: (patientId: string, params: ListProblemsParams) =>
		[...emrKeys.problems(), patientId, params] as const,
	// Timeline
	timelines: () => [...emrKeys.all, "timeline"] as const,
	timeline: (patientId: string, params: ListTimelineParams) =>
		[...emrKeys.timelines(), patientId, params] as const,
};

// ===== Clinical Notes Hooks =====

/**
 * Hook to list clinical notes with pagination and filters
 */
export function useClinicalNotes(params: ListClinicalNotesParams = {}) {
	return useQuery({
		queryKey: emrKeys.notesListFiltered(params),
		queryFn: () => emrClient.listClinicalNotes(params),
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook to get a clinical note by ID
 */
export function useClinicalNote(noteId: string) {
	return useQuery({
		queryKey: emrKeys.noteDetail(noteId),
		queryFn: () => emrClient.getClinicalNote(noteId),
		enabled: !!noteId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook for creating a clinical note
 */
export function useCreateClinicalNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateClinicalNoteInput) =>
			emrClient.createClinicalNote(input),
		onSuccess: (_data) => {
			queryClient.invalidateQueries({ queryKey: emrKeys.notesList() });
			queryClient.invalidateQueries({
				queryKey: emrKeys.timelines(),
			});
		},
	});
}

/**
 * Hook for updating a clinical note (draft only)
 */
export function useUpdateClinicalNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			noteId,
			data,
		}: {
			noteId: string;
			data: UpdateClinicalNoteInput;
		}) => emrClient.updateClinicalNote({ noteId, data }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: emrKeys.noteDetail(variables.noteId),
			});
			queryClient.invalidateQueries({ queryKey: emrKeys.notesList() });
		},
	});
}

/**
 * Hook for signing a clinical note
 */
export function useSignClinicalNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (noteId: string) => emrClient.signClinicalNote(noteId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: emrKeys.noteDetail(data.noteId),
			});
			queryClient.invalidateQueries({ queryKey: emrKeys.notesList() });
		},
	});
}

/**
 * Hook for amending a signed clinical note
 */
export function useAmendClinicalNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ noteId, data }: { noteId: string; data: AmendNoteInput }) =>
			emrClient.amendClinicalNote({ noteId, data }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: emrKeys.noteDetail(data.noteId),
			});
			queryClient.invalidateQueries({ queryKey: emrKeys.notesList() });
		},
	});
}

// ===== Medical History Hooks =====

/**
 * Hook to get medical history for a patient
 */
export function useMedicalHistory(patientId: string) {
	return useQuery({
		queryKey: emrKeys.history(patientId),
		queryFn: () => emrClient.getMedicalHistory(patientId),
		enabled: !!patientId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook for updating medical history
 */
export function useUpdateMedicalHistory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			patientId,
			data,
		}: {
			patientId: string;
			data: UpdateMedicalHistoryInput;
		}) => emrClient.updateMedicalHistory({ patientId, data }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: emrKeys.history(variables.patientId),
			});
			queryClient.invalidateQueries({ queryKey: emrKeys.timelines() });
		},
	});
}

// ===== Problems Hooks =====

/**
 * Hook to get problem list for a patient
 */
export function useProblems(
	patientId: string,
	params: ListProblemsParams = {},
) {
	return useQuery({
		queryKey: emrKeys.problemsByPatient(patientId, params),
		queryFn: () => emrClient.getProblems(patientId, params),
		enabled: !!patientId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

/**
 * Hook for adding a problem to a patient's problem list
 */
export function useAddProblem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			patientId,
			data,
		}: {
			patientId: string;
			data: AddProblemInput;
		}) => emrClient.addProblem({ patientId, data }),
		onSuccess: (_, _variables) => {
			queryClient.invalidateQueries({ queryKey: emrKeys.problems() });
			queryClient.invalidateQueries({ queryKey: emrKeys.timelines() });
		},
	});
}

// ===== Timeline Hooks =====

/**
 * Hook to get patient timeline
 */
export function usePatientTimeline(
	patientId: string,
	params: ListTimelineParams = {},
) {
	return useQuery({
		queryKey: emrKeys.timeline(patientId, params),
		queryFn: () => emrClient.getTimeline(patientId, params),
		enabled: !!patientId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

// Re-export types for convenience
export type {
	AddProblemInput,
	Allergy,
	AllergySeverity,
	Amendment,
	AmendNoteInput,
	ApiError,
	ClinicalNoteDetail,
	ClinicalNoteListItem,
	ClinicalNoteStatus,
	ClinicalNoteType,
	CreateClinicalNoteInput,
	CreateClinicalNoteOutput,
	Diagnosis,
	DiagnosisType,
	FamilyHistoryEntry,
	Immunization,
	ListClinicalNotesOutput,
	ListClinicalNotesParams,
	ListProblemsParams,
	ListTimelineOutput,
	ListTimelineParams,
	MedicalHistory,
	Medication,
	PastMedicalHistoryEntry,
	Problem,
	ProblemStatus,
	Procedure,
	SocialHistory,
	SurgicalHistoryEntry,
	TimelineEvent,
	TimelineEventType,
	UpdateClinicalNoteInput,
	UpdateMedicalHistoryInput,
} from "../lib/emr-client";

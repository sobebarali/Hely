/**
 * Lab & Diagnostics API Client
 *
 * This client interfaces with the /api/lab/* endpoints on the server.
 */

import {
	type ApiError,
	authenticatedRequest,
	getStoredTokens,
	isTokenExpired,
	refreshTokens,
} from "./api-client";

export type { ApiError } from "./api-client";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "";

// Enums
export type LabOrderStatus =
	| "ORDERED"
	| "SAMPLE_COLLECTED"
	| "RESULTS_ENTERED"
	| "VERIFIED"
	| "CANCELLED";

export type TestPriority = "ROUTINE" | "URGENT" | "STAT";

export type ResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL";

export type SampleType =
	| "BLOOD"
	| "URINE"
	| "STOOL"
	| "SPUTUM"
	| "SWAB"
	| "TISSUE"
	| "CSF"
	| "OTHER";

export type TestCategory =
	| "HEMATOLOGY"
	| "BIOCHEMISTRY"
	| "MICROBIOLOGY"
	| "IMMUNOLOGY"
	| "PATHOLOGY"
	| "RADIOLOGY"
	| "CARDIOLOGY"
	| "OTHER";

export type TestCatalogStatus = "ACTIVE" | "INACTIVE";

// Types
export interface LabOrderTest {
	testId: string;
	testName: string;
	testCode: string;
	priority: TestPriority;
	status: LabOrderStatus;
	clinicalNotes?: string;
	resultDetails?: {
		value: string;
		unit?: string;
		normalRange?: string;
		flag?: ResultFlag;
		interpretation?: string;
	};
}

export interface LabOrderListItem {
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
	tests: LabOrderTest[];
	status: LabOrderStatus;
	diagnosis?: string;
	notes?: string;
	createdAt: string;
}

export interface LabOrderDetails extends LabOrderListItem {
	sampleDetails?: {
		sampleType: SampleType;
		collectedBy: {
			id: string;
			employeeId: string;
			firstName: string;
			lastName: string;
		};
		collectedAt: string;
		sampleId: string;
		notes?: string;
	};
	enteredBy?: {
		id: string;
		employeeId: string;
		firstName: string;
		lastName: string;
	};
	enteredAt?: string;
	verifiedBy?: {
		id: string;
		employeeId: string;
		firstName: string;
		lastName: string;
	};
	verifiedAt?: string;
}

export interface ListLabOrdersParams {
	page?: number;
	limit?: number;
	patientId?: string;
	doctorId?: string;
	status?: LabOrderStatus;
	priority?: TestPriority;
	startDate?: string;
	endDate?: string;
	search?: string;
	sortBy?: "createdAt" | "orderId" | "status";
	sortOrder?: "asc" | "desc";
}

export interface ListLabOrdersResponse {
	data: LabOrderListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateLabOrderInput {
	patientId: string;
	doctorId: string;
	tests: Array<{
		testId: string;
		priority?: TestPriority;
		clinicalNotes?: string;
	}>;
	appointmentId?: string;
	admissionId?: string;
	diagnosis?: string;
	notes?: string;
}

export interface CollectSampleInput {
	sampleType: SampleType;
	collectedBy: string;
	collectedAt?: string;
	sampleId?: string;
	notes?: string;
}

export interface EnterResultsInput {
	results: Array<{
		testId: string;
		value: string;
		unit?: string;
		normalRange?: string;
		flag?: ResultFlag;
		interpretation?: string;
	}>;
	enteredBy: string;
	notes?: string;
}

export interface VerifyResultsInput {
	verifiedBy: string;
	comments?: string;
}

export interface ReferenceRange {
	label: string;
	min?: number;
	max?: number;
	unit?: string;
	gender: "MALE" | "FEMALE" | "ALL";
}

export interface TestCatalogItem {
	id: string;
	name: string;
	code: string;
	category: TestCategory;
	sampleType: SampleType;
	turnaroundTime?: string;
	price?: number;
	status: TestCatalogStatus;
	referenceRanges: ReferenceRange[];
}

export interface AddTestInput {
	name: string;
	code: string;
	category: TestCategory;
	sampleType: SampleType;
	turnaroundTime: string;
	price: number;
	referenceRanges?: ReferenceRange[];
}

export interface ListTestsParams {
	page?: number;
	limit?: number;
	category?: TestCategory;
	search?: string;
	status?: TestCatalogStatus;
}

export interface ListTestsResponse {
	data: TestCatalogItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// ===== Lab API Functions =====

/**
 * List lab orders with pagination and filters
 */
export async function listLabOrders(
	params: ListLabOrdersParams = {},
): Promise<ListLabOrdersResponse> {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.patientId) searchParams.set("patientId", params.patientId);
	if (params.doctorId) searchParams.set("doctorId", params.doctorId);
	if (params.status) searchParams.set("status", params.status);
	if (params.priority) searchParams.set("priority", params.priority);
	if (params.startDate) searchParams.set("startDate", params.startDate);
	if (params.endDate) searchParams.set("endDate", params.endDate);
	if (params.search) searchParams.set("search", params.search);
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);
	if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

	const queryString = searchParams.toString();
	const endpoint = `/api/lab/orders${queryString ? `?${queryString}` : ""}`;

	const response = await authenticatedRequest<{
		success: boolean;
		data: ListLabOrdersResponse["data"];
		pagination: ListLabOrdersResponse["pagination"];
	}>(endpoint);

	return {
		data: response.data,
		pagination: response.pagination,
	};
}

/**
 * Get lab order by ID
 */
export async function getLabOrder(orderId: string): Promise<LabOrderDetails> {
	return authenticatedRequest<LabOrderDetails>(`/api/lab/orders/${orderId}`);
}

/**
 * Create a new lab order
 */
export async function createLabOrder(
	input: CreateLabOrderInput,
): Promise<LabOrderDetails> {
	return authenticatedRequest<LabOrderDetails>("/api/lab/orders", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

/**
 * Collect sample for a lab order
 */
export async function collectSample(
	orderId: string,
	input: CollectSampleInput,
): Promise<LabOrderDetails> {
	return authenticatedRequest<LabOrderDetails>(
		`/api/lab/orders/${orderId}/collect`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

/**
 * Enter results for a lab order
 */
export async function enterResults(
	orderId: string,
	input: EnterResultsInput,
): Promise<LabOrderDetails> {
	return authenticatedRequest<LabOrderDetails>(
		`/api/lab/orders/${orderId}/results`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

/**
 * Verify results for a lab order
 */
export async function verifyResults(
	orderId: string,
	input: VerifyResultsInput,
): Promise<LabOrderDetails> {
	return authenticatedRequest<LabOrderDetails>(
		`/api/lab/orders/${orderId}/verify`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

/**
 * Download PDF report for a verified lab order
 */
export async function getReportPdf(orderId: string): Promise<Blob> {
	let { accessToken } = getStoredTokens();

	if (isTokenExpired()) {
		const refreshed = await refreshTokens();
		if (!refreshed) {
			throw { code: "UNAUTHORIZED", message: "Session expired" } as ApiError;
		}
		accessToken = getStoredTokens().accessToken;
	}

	if (!accessToken) {
		throw { code: "UNAUTHORIZED", message: "Not authenticated" } as ApiError;
	}

	const response = await fetch(
		`${API_BASE_URL}/api/lab/orders/${orderId}/report`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		const data = await response.json();
		throw {
			code: data.code || "UNKNOWN_ERROR",
			message: data.message || "Failed to download report",
		} as ApiError;
	}

	return response.blob();
}

/**
 * Add a test to the catalog
 */
export async function addTest(input: AddTestInput): Promise<TestCatalogItem> {
	return authenticatedRequest<TestCatalogItem>("/api/lab/tests", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

/**
 * List test catalog with filters
 */
export async function listTests(
	params: ListTestsParams = {},
): Promise<ListTestsResponse> {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.category) searchParams.set("category", params.category);
	if (params.search) searchParams.set("search", params.search);
	if (params.status) searchParams.set("status", params.status);

	const queryString = searchParams.toString();
	const endpoint = `/api/lab/tests${queryString ? `?${queryString}` : ""}`;

	const response = await authenticatedRequest<{
		success: boolean;
		data: ListTestsResponse["data"];
		pagination: ListTestsResponse["pagination"];
	}>(endpoint);

	return {
		data: response.data,
		pagination: response.pagination,
	};
}

// Lab client object for convenience
export const labClient = {
	listLabOrders,
	getLabOrder,
	createLabOrder,
	collectSample,
	enterResults,
	verifyResults,
	getReportPdf,
	listTests,
	addTest,
};

export default labClient;

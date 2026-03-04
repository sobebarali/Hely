/**
 * React hooks for lab & diagnostics client using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type AddTestInput,
	type CollectSampleInput,
	type CreateLabOrderInput,
	type EnterResultsInput,
	type ListLabOrdersParams,
	type ListTestsParams,
	labClient,
	type VerifyResultsInput,
} from "../lib/lab-client";

// Query keys
export const labKeys = {
	all: ["lab"] as const,
	orders: () => [...labKeys.all, "orders"] as const,
	orderLists: () => [...labKeys.orders(), "list"] as const,
	orderList: (params: ListLabOrdersParams) =>
		[...labKeys.orderLists(), params] as const,
	orderDetails: () => [...labKeys.orders(), "detail"] as const,
	orderDetail: (id: string) => [...labKeys.orderDetails(), id] as const,
	tests: () => [...labKeys.all, "tests"] as const,
	testLists: () => [...labKeys.tests(), "list"] as const,
	testList: (params: ListTestsParams) =>
		[...labKeys.testLists(), params] as const,
};

/**
 * Hook to list lab orders with pagination and filters
 */
export function useLabOrders(params: ListLabOrdersParams = {}) {
	return useQuery({
		queryKey: labKeys.orderList(params),
		queryFn: () => labClient.listLabOrders(params),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook to get lab order by ID
 */
export function useLabOrder(id: string) {
	return useQuery({
		queryKey: labKeys.orderDetail(id),
		queryFn: () => labClient.getLabOrder(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook to list test catalog
 */
export function useLabTests(params: ListTestsParams = {}) {
	return useQuery({
		queryKey: labKeys.testList(params),
		queryFn: () => labClient.listTests(params),
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Hook for creating a new lab order
 */
export function useCreateLabOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateLabOrderInput) => labClient.createLabOrder(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labKeys.orderLists() });
		},
	});
}

/**
 * Hook for collecting a sample
 */
export function useCollectSample() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			orderId,
			input,
		}: {
			orderId: string;
			input: CollectSampleInput;
		}) => labClient.collectSample(orderId, input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: labKeys.orderDetail(variables.orderId),
			});
			queryClient.invalidateQueries({ queryKey: labKeys.orderLists() });
		},
	});
}

/**
 * Hook for entering results
 */
export function useEnterResults() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			orderId,
			input,
		}: {
			orderId: string;
			input: EnterResultsInput;
		}) => labClient.enterResults(orderId, input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: labKeys.orderDetail(variables.orderId),
			});
			queryClient.invalidateQueries({ queryKey: labKeys.orderLists() });
		},
	});
}

/**
 * Hook for verifying results
 */
export function useVerifyResults() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			orderId,
			input,
		}: {
			orderId: string;
			input: VerifyResultsInput;
		}) => labClient.verifyResults(orderId, input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: labKeys.orderDetail(variables.orderId),
			});
			queryClient.invalidateQueries({ queryKey: labKeys.orderLists() });
		},
	});
}

/**
 * Hook for adding a test to the catalog
 */
export function useAddTest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: AddTestInput) => labClient.addTest(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: labKeys.testLists() });
		},
	});
}

/**
 * Hook for downloading PDF report
 */
export function useDownloadReport() {
	return useMutation({
		mutationFn: (orderId: string) => labClient.getReportPdf(orderId),
		onSuccess: (blob, orderId) => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `lab-report-${orderId}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},
	});
}

// Re-export types for convenience
export type {
	AddTestInput,
	CollectSampleInput,
	CreateLabOrderInput,
	EnterResultsInput,
	LabOrderDetails,
	LabOrderListItem,
	LabOrderStatus,
	LabOrderTest,
	ListLabOrdersParams,
	ListLabOrdersResponse,
	ListTestsParams,
	ListTestsResponse,
	ReferenceRange,
	ResultFlag,
	SampleType,
	TestCatalogItem,
	TestCatalogStatus,
	TestCategory,
	TestPriority,
	VerifyResultsInput,
} from "../lib/lab-client";

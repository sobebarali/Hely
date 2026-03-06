import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	ClipboardList,
	Download,
	FlaskConical,
	Loader2,
	Microscope,
	ShieldCheck,
	TestTube,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	useCollectSample,
	useDownloadReport,
	useEnterResults,
	useLabOrder,
	useVerifyResults,
} from "@/hooks/use-lab";
import { useUsers } from "@/hooks/use-users";
import type { ApiError } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { ResultFlag, SampleType } from "@/lib/lab-client";

export const Route = createFileRoute("/dashboard/lab/$id")({
	component: LabOrderDetailPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

const statusColors: Record<string, string> = {
	ORDERED: "default",
	SAMPLE_COLLECTED: "secondary",
	RESULTS_ENTERED: "outline",
	VERIFIED: "default",
	CANCELLED: "destructive",
};

const flagColors: Record<string, string> = {
	NORMAL: "secondary",
	LOW: "default",
	HIGH: "default",
	CRITICAL: "destructive",
};

function LabOrderDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams({ from: "/dashboard/lab/$id" });
	const { data: order, isLoading: orderLoading } = useLabOrder(id);

	const collectSampleMutation = useCollectSample();
	const enterResultsMutation = useEnterResults();
	const verifyResultsMutation = useVerifyResults();
	const downloadReportMutation = useDownloadReport();

	const { data: staffData } = useUsers({ status: "ACTIVE", limit: 100 });

	const [collectSheetOpen, setCollectSheetOpen] = useState(false);
	const [resultsSheetOpen, setResultsSheetOpen] = useState(false);
	const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

	// Collect Sample Form
	const collectForm = useForm({
		defaultValues: {
			sampleType: "" as string,
			collectedBy: "" as string,
			sampleId: "" as string,
			notes: "" as string,
		},
		onSubmit: async ({ value }) => {
			try {
				await collectSampleMutation.mutateAsync({
					orderId: id,
					input: {
						sampleType: value.sampleType as SampleType,
						collectedBy: value.collectedBy,
						sampleId: value.sampleId || undefined,
						notes: value.notes || undefined,
					},
				});
				toast.success("Sample collected successfully");
				setCollectSheetOpen(false);
				collectForm.reset();
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to collect sample");
			}
		},
		validators: {
			onSubmit: z.object({
				sampleType: z.string().min(1, "Sample type is required"),
				collectedBy: z.string().min(1, "Collected by is required"),
				sampleId: z.string(),
				notes: z.string(),
			}),
		},
	});

	// Verify Form
	const verifyForm = useForm({
		defaultValues: {
			verifiedBy: "" as string,
			comments: "" as string,
		},
		onSubmit: async ({ value }) => {
			try {
				await verifyResultsMutation.mutateAsync({
					orderId: id,
					input: {
						verifiedBy: value.verifiedBy,
						comments: value.comments || undefined,
					},
				});
				toast.success("Results verified successfully");
				setVerifyDialogOpen(false);
				verifyForm.reset();
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to verify results");
			}
		},
		validators: {
			onSubmit: z.object({
				verifiedBy: z.string().min(1, "Verified by is required"),
				comments: z.string(),
			}),
		},
	});

	// Enter Results Form - uses state since we need dynamic fields per test
	const [resultValues, setResultValues] = useState<
		Record<
			string,
			{
				value: string;
				unit: string;
				normalRange: string;
				flag: string;
				interpretation: string;
			}
		>
	>({});
	const [resultsEnteredBy, setResultsEnteredBy] = useState("");
	const [resultsNotes, setResultsNotes] = useState("");

	const handleEnterResults = async () => {
		if (!resultsEnteredBy) {
			toast.error("Please select who entered the results");
			return;
		}

		const results = Object.entries(resultValues)
			.filter(([_, v]) => v.value)
			.map(([testId, v]) => ({
				testId,
				value: v.value,
				unit: v.unit || undefined,
				normalRange: v.normalRange || undefined,
				flag: (v.flag || undefined) as ResultFlag | undefined,
				interpretation: v.interpretation || undefined,
			}));

		if (!order || results.length !== order.tests.length) {
			toast.error("Please enter results for all tests");
			return;
		}

		try {
			await enterResultsMutation.mutateAsync({
				orderId: id,
				input: {
					results,
					enteredBy: resultsEnteredBy,
					notes: resultsNotes || undefined,
				},
			});
			toast.success("Results entered successfully");
			setResultsSheetOpen(false);
			setResultValues({});
			setResultsEnteredBy("");
			setResultsNotes("");
		} catch (error) {
			const apiError = error as ApiError;
			toast.error(apiError.message || "Failed to enter results");
		}
	};

	const handleDownloadReport = async () => {
		try {
			await downloadReportMutation.mutateAsync(id);
			toast.success("Report downloaded successfully");
		} catch (error) {
			const apiError = error as ApiError;
			toast.error(apiError.message || "Failed to download report");
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Initialize result values when opening results sheet
	const openResultsSheet = () => {
		if (order) {
			const initial: typeof resultValues = {};
			for (const test of order.tests) {
				initial[test.testId] = {
					value: "",
					unit: "",
					normalRange: "",
					flag: "",
					interpretation: "",
				};
			}
			setResultValues(initial);
		}
		setResultsSheetOpen(true);
	};

	if (orderLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<h2 className="font-semibold text-xl">Lab order not found</h2>
				<Button onClick={() => navigate({ to: "/dashboard/lab" })}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Lab Orders
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate({ to: "/dashboard/lab" })}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="font-bold text-2xl">{order.orderId}</h1>
								<Badge
									variant={
										statusColors[order.status] as
											| "default"
											| "secondary"
											| "destructive"
											| "outline"
									}
								>
									{order.status.replace(/_/g, " ")}
								</Badge>
							</div>
							<p className="text-muted-foreground">
								{order.patient.firstName} {order.patient.lastName} (
								{order.patient.patientId})
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						{order.status === "ORDERED" && (
							<Button onClick={() => setCollectSheetOpen(true)}>
								<TestTube className="mr-2 h-4 w-4" />
								Collect Sample
							</Button>
						)}
						{order.status === "SAMPLE_COLLECTED" && (
							<Button onClick={openResultsSheet}>
								<Microscope className="mr-2 h-4 w-4" />
								Enter Results
							</Button>
						)}
						{order.status === "RESULTS_ENTERED" && (
							<Button onClick={() => setVerifyDialogOpen(true)}>
								<ShieldCheck className="mr-2 h-4 w-4" />
								Verify Results
							</Button>
						)}
						{order.status === "VERIFIED" && (
							<Button
								onClick={handleDownloadReport}
								disabled={downloadReportMutation.isPending}
							>
								{downloadReportMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Download className="mr-2 h-4 w-4" />
								)}
								Download Report
							</Button>
						)}
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Order Info */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ClipboardList className="h-5 w-5" />
								Order Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-xs">
										Patient
									</Label>
									<p className="font-medium">
										{order.patient.firstName} {order.patient.lastName}
									</p>
									<p className="text-muted-foreground text-sm">
										{order.patient.patientId}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Ordering Physician
									</Label>
									<p className="font-medium">
										Dr. {order.doctor.firstName} {order.doctor.lastName}
									</p>
								</div>
							</div>
							{order.diagnosis && (
								<>
									<Separator />
									<div>
										<Label className="text-muted-foreground text-xs">
											Diagnosis
										</Label>
										<p className="font-medium">{order.diagnosis}</p>
									</div>
								</>
							)}
							{order.notes && (
								<>
									<Separator />
									<div>
										<Label className="text-muted-foreground text-xs">
											Notes
										</Label>
										<p className="text-sm">{order.notes}</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Timeline */}
					<Card>
						<CardHeader>
							<CardTitle>Timeline</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-500" />
								<div>
									<Label className="text-muted-foreground text-xs">
										Created
									</Label>
									<p className="text-sm">{formatDate(order.createdAt)}</p>
								</div>
							</div>
							{order.sampleDetails && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<TestTube className="h-4 w-4 text-blue-500" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Sample Collected
											</Label>
											<p className="text-sm">
												{formatDate(order.sampleDetails.collectedAt)}
											</p>
											<p className="text-muted-foreground text-xs">
												By {order.sampleDetails.collectedBy.firstName}{" "}
												{order.sampleDetails.collectedBy.lastName}
											</p>
										</div>
									</div>
								</>
							)}
							{order.enteredBy && order.enteredAt && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<Microscope className="h-4 w-4 text-purple-500" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Results Entered
											</Label>
											<p className="text-sm">{formatDate(order.enteredAt)}</p>
											<p className="text-muted-foreground text-xs">
												By {order.enteredBy.firstName}{" "}
												{order.enteredBy.lastName}
											</p>
										</div>
									</div>
								</>
							)}
							{order.verifiedBy && order.verifiedAt && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<ShieldCheck className="h-4 w-4 text-green-600" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Verified
											</Label>
											<p className="text-sm">{formatDate(order.verifiedAt)}</p>
											<p className="text-muted-foreground text-xs">
												By {order.verifiedBy.firstName}{" "}
												{order.verifiedBy.lastName}
											</p>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Tests & Results */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FlaskConical className="h-5 w-5" />
							Tests & Results
						</CardTitle>
						<CardDescription>
							{order.tests.length} test(s) ordered
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Test Name</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Value</TableHead>
										<TableHead>Unit</TableHead>
										<TableHead>Normal Range</TableHead>
										<TableHead>Flag</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{order.tests.map((test) => (
										<TableRow key={test.testId}>
											<TableCell className="font-medium">
												{test.testName}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{test.testCode}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														test.priority === "STAT"
															? "destructive"
															: test.priority === "URGENT"
																? "default"
																: "secondary"
													}
												>
													{test.priority}
												</Badge>
											</TableCell>
											<TableCell>{test.resultDetails?.value || "-"}</TableCell>
											<TableCell className="text-muted-foreground">
												{test.resultDetails?.unit || "-"}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{test.resultDetails?.normalRange || "-"}
											</TableCell>
											<TableCell>
												{test.resultDetails?.flag ? (
													<Badge
														variant={
															flagColors[test.resultDetails.flag] as
																| "default"
																| "secondary"
																| "destructive"
																| "outline"
														}
													>
														{test.resultDetails.flag}
													</Badge>
												) : (
													"-"
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Sample Details Card */}
				{order.sampleDetails && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TestTube className="h-5 w-5" />
								Sample Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div>
									<Label className="text-muted-foreground text-xs">
										Sample Type
									</Label>
									<p className="font-medium">
										{order.sampleDetails.sampleType}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Sample ID
									</Label>
									<p className="font-medium">{order.sampleDetails.sampleId}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Collected By
									</Label>
									<p className="font-medium">
										{order.sampleDetails.collectedBy.firstName}{" "}
										{order.sampleDetails.collectedBy.lastName}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Collected At
									</Label>
									<p className="font-medium">
										{formatDate(order.sampleDetails.collectedAt)}
									</p>
								</div>
							</div>
							{order.sampleDetails.notes && (
								<>
									<Separator className="my-4" />
									<div>
										<Label className="text-muted-foreground text-xs">
											Notes
										</Label>
										<p className="text-sm">{order.sampleDetails.notes}</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Collect Sample Sheet */}
			<Sheet open={collectSheetOpen} onOpenChange={setCollectSheetOpen}>
				<SheetContent className="overflow-y-auto sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<TestTube className="h-5 w-5" />
							Collect Sample
						</SheetTitle>
						<SheetDescription>
							Record sample collection details for this lab order.
						</SheetDescription>
					</SheetHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							collectForm.handleSubmit();
						}}
						className="flex flex-col gap-6 p-4"
					>
						<collectForm.Field name="sampleType">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Sample Type *</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select sample type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="BLOOD">Blood</SelectItem>
											<SelectItem value="URINE">Urine</SelectItem>
											<SelectItem value="STOOL">Stool</SelectItem>
											<SelectItem value="SPUTUM">Sputum</SelectItem>
											<SelectItem value="SWAB">Swab</SelectItem>
											<SelectItem value="TISSUE">Tissue</SelectItem>
											<SelectItem value="CSF">CSF</SelectItem>
											<SelectItem value="OTHER">Other</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</collectForm.Field>

						<collectForm.Field name="collectedBy">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Collected By *</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select staff member" />
										</SelectTrigger>
										<SelectContent>
											{staffData?.data.map((staff) => (
												<SelectItem key={staff.id} value={staff.id}>
													{staff.firstName} {staff.lastName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</collectForm.Field>

						<collectForm.Field name="sampleId">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Sample ID (optional)</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</div>
							)}
						</collectForm.Field>

						<collectForm.Field name="notes">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Notes (optional)</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Any additional notes..."
										rows={3}
									/>
								</div>
							)}
						</collectForm.Field>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setCollectSheetOpen(false)}
							>
								Cancel
							</Button>
							<collectForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										disabled={
											!state.canSubmit ||
											state.isSubmitting ||
											collectSampleMutation.isPending
										}
									>
										{state.isSubmitting || collectSampleMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Collecting...
											</>
										) : (
											<>
												<TestTube className="mr-2 h-4 w-4" />
												Collect Sample
											</>
										)}
									</Button>
								)}
							</collectForm.Subscribe>
						</div>
					</form>
				</SheetContent>
			</Sheet>

			{/* Enter Results Sheet */}
			<Sheet open={resultsSheetOpen} onOpenChange={setResultsSheetOpen}>
				<SheetContent className="overflow-y-auto sm:max-w-2xl">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<Microscope className="h-5 w-5" />
							Enter Results
						</SheetTitle>
						<SheetDescription>
							Enter test results for all tests in this order.
						</SheetDescription>
					</SheetHeader>
					<div className="flex flex-col gap-6 p-4">
						{/* Results Entry Per Test */}
						{order?.tests.map((test) => (
							<Card key={test.testId}>
								<CardHeader className="pb-3">
									<CardTitle className="text-base">
										{test.testName}{" "}
										<span className="text-muted-foreground text-sm">
											({test.testCode})
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="space-y-2">
											<Label>Value *</Label>
											<Input
												value={resultValues[test.testId]?.value || ""}
												onChange={(e) =>
													setResultValues((prev) => ({
														...prev,
														[test.testId]: {
															...prev[test.testId],
															value: e.target.value,
														},
													}))
												}
												placeholder="e.g., 12.5"
											/>
										</div>
										<div className="space-y-2">
											<Label>Unit</Label>
											<Input
												value={resultValues[test.testId]?.unit || ""}
												onChange={(e) =>
													setResultValues((prev) => ({
														...prev,
														[test.testId]: {
															...prev[test.testId],
															unit: e.target.value,
														},
													}))
												}
												placeholder="e.g., mg/dL"
											/>
										</div>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="space-y-2">
											<Label>Normal Range</Label>
											<Input
												value={resultValues[test.testId]?.normalRange || ""}
												onChange={(e) =>
													setResultValues((prev) => ({
														...prev,
														[test.testId]: {
															...prev[test.testId],
															normalRange: e.target.value,
														},
													}))
												}
												placeholder="e.g., 4.0-11.0"
											/>
										</div>
										<div className="space-y-2">
											<Label>Flag</Label>
											<Select
												value={resultValues[test.testId]?.flag || ""}
												onValueChange={(v) =>
													setResultValues((prev) => ({
														...prev,
														[test.testId]: {
															...prev[test.testId],
															flag: v,
														},
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select flag" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="NORMAL">Normal</SelectItem>
													<SelectItem value="LOW">Low</SelectItem>
													<SelectItem value="HIGH">High</SelectItem>
													<SelectItem value="CRITICAL">Critical</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Interpretation</Label>
										<Textarea
											value={resultValues[test.testId]?.interpretation || ""}
											onChange={(e) =>
												setResultValues((prev) => ({
													...prev,
													[test.testId]: {
														...prev[test.testId],
														interpretation: e.target.value,
													},
												}))
											}
											placeholder="Optional interpretation..."
											rows={2}
										/>
									</div>
								</CardContent>
							</Card>
						))}

						<Separator />

						{/* Entered By */}
						<div className="space-y-2">
							<Label>Entered By *</Label>
							<Select
								value={resultsEnteredBy}
								onValueChange={setResultsEnteredBy}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select staff member" />
								</SelectTrigger>
								<SelectContent>
									{staffData?.data.map((staff) => (
										<SelectItem key={staff.id} value={staff.id}>
											{staff.firstName} {staff.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Notes (optional)</Label>
							<Textarea
								value={resultsNotes}
								onChange={(e) => setResultsNotes(e.target.value)}
								placeholder="Any additional notes..."
								rows={3}
							/>
						</div>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setResultsSheetOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleEnterResults}
								disabled={enterResultsMutation.isPending}
							>
								{enterResultsMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Microscope className="mr-2 h-4 w-4" />
										Save Results
									</>
								)}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* Verify Dialog */}
			<Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5" />
							Verify Results
						</DialogTitle>
						<DialogDescription>
							Confirm that the test results have been reviewed and are accurate.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							verifyForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<verifyForm.Field name="verifiedBy">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Verified By *</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select verifier" />
										</SelectTrigger>
										<SelectContent>
											{staffData?.data.map((staff) => (
												<SelectItem key={staff.id} value={staff.id}>
													{staff.firstName} {staff.lastName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</verifyForm.Field>

						<verifyForm.Field name="comments">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Comments (optional)</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Any verification comments..."
										rows={3}
									/>
								</div>
							)}
						</verifyForm.Field>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setVerifyDialogOpen(false)}
							>
								Cancel
							</Button>
							<verifyForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										disabled={
											!state.canSubmit ||
											state.isSubmitting ||
											verifyResultsMutation.isPending
										}
									>
										{state.isSubmitting || verifyResultsMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Verifying...
											</>
										) : (
											<>
												<ShieldCheck className="mr-2 h-4 w-4" />
												Verify Results
											</>
										)}
									</Button>
								)}
							</verifyForm.Subscribe>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

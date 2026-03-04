import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	FlaskConical,
	Loader2,
	Plus,
	Search,
	Stethoscope,
	Trash2,
	User,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLabOrder, useLabTests } from "@/hooks/use-lab";
import { useSearchPatients } from "@/hooks/use-patients";
import { useUsers } from "@/hooks/use-users";
import type { ApiError } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { TestPriority } from "@/lib/lab-client";

export const Route = createFileRoute("/dashboard/lab/create")({
	component: CreateLabOrderPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

interface SelectedTest {
	testId: string;
	testName: string;
	testCode: string;
	priority: TestPriority;
	clinicalNotes: string;
}

function CreateLabOrderPage() {
	const navigate = useNavigate();
	const createLabOrderMutation = useCreateLabOrder();

	// Patient search
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatientId, setSelectedPatientId] = useState("");
	const [selectedPatientName, setSelectedPatientName] = useState("");
	const { data: searchResults } = useSearchPatients({
		q: patientSearch,
		limit: 10,
	});

	// Tests
	const [testSearch, setTestSearch] = useState("");
	const { data: testsData } = useLabTests({
		search: testSearch || undefined,
		status: "ACTIVE",
		limit: 50,
	});
	const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);

	// Doctors
	const { data: doctorsData } = useUsers({
		role: "DOCTOR",
		status: "ACTIVE",
		limit: 100,
	});

	const addTest = (testId: string, testName: string, testCode: string) => {
		if (selectedTests.some((t) => t.testId === testId)) {
			toast.error("Test already added");
			return;
		}
		setSelectedTests((prev) => [
			...prev,
			{
				testId,
				testName,
				testCode,
				priority: "ROUTINE",
				clinicalNotes: "",
			},
		]);
		setTestSearch("");
	};

	const removeTest = (testId: string) => {
		setSelectedTests((prev) => prev.filter((t) => t.testId !== testId));
	};

	const updateTestPriority = (testId: string, priority: TestPriority) => {
		setSelectedTests((prev) =>
			prev.map((t) => (t.testId === testId ? { ...t, priority } : t)),
		);
	};

	const updateTestNotes = (testId: string, clinicalNotes: string) => {
		setSelectedTests((prev) =>
			prev.map((t) => (t.testId === testId ? { ...t, clinicalNotes } : t)),
		);
	};

	const form = useForm({
		defaultValues: {
			doctorId: "",
			diagnosis: "",
			notes: "",
		},
		onSubmit: async ({ value }) => {
			if (!selectedPatientId) {
				toast.error("Please select a patient");
				return;
			}
			if (selectedTests.length === 0) {
				toast.error("Please add at least one test");
				return;
			}

			try {
				const result = await createLabOrderMutation.mutateAsync({
					patientId: selectedPatientId,
					doctorId: value.doctorId,
					tests: selectedTests.map((t) => ({
						testId: t.testId,
						priority: t.priority,
						clinicalNotes: t.clinicalNotes || undefined,
					})),
					diagnosis: value.diagnosis || undefined,
					notes: value.notes || undefined,
				});
				toast.success("Lab order created successfully");
				navigate({ to: "/dashboard/lab/$id", params: { id: result.id } });
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to create lab order");
			}
		},
		validators: {
			onSubmit: z.object({
				doctorId: z.string().min(1, "Ordering physician is required"),
				diagnosis: z.string(),
				notes: z.string(),
			}),
		},
	});

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard/lab">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-2xl">Create Lab Order</h1>
					<p className="text-muted-foreground">Order lab tests for a patient</p>
				</div>
			</div>

			{/* Form */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="grid gap-6 lg:grid-cols-2"
			>
				{/* Patient Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient
						</CardTitle>
						<CardDescription>
							Search and select a patient for this order
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedPatientId ? (
							<div className="flex items-center justify-between rounded-md border p-3">
								<div>
									<p className="font-medium">{selectedPatientName}</p>
									<p className="text-muted-foreground text-sm">
										Selected patient
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedPatientId("");
										setSelectedPatientName("");
									}}
								>
									Change
								</Button>
							</div>
						) : (
							<>
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search by name, phone, or ID..."
										value={patientSearch}
										onChange={(e) => setPatientSearch(e.target.value)}
										className="pl-9"
									/>
								</div>
								{searchResults && searchResults.length > 0 && (
									<div className="max-h-48 overflow-y-auto rounded-md border">
										{searchResults.map((patient) => (
											<button
												type="button"
												key={patient.id}
												className="flex w-full items-center justify-between border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
												onClick={() => {
													setSelectedPatientId(patient.id);
													setSelectedPatientName(
														`${patient.firstName} ${patient.lastName}`,
													);
													setPatientSearch("");
												}}
											>
												<div>
													<p className="font-medium">
														{patient.firstName} {patient.lastName}
													</p>
													<p className="text-muted-foreground text-sm">
														{patient.patientId} | {patient.phone}
													</p>
												</div>
												<Badge variant="outline">{patient.patientType}</Badge>
											</button>
										))}
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>

				{/* Ordering Physician */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Stethoscope className="h-5 w-5" />
							Ordering Physician
						</CardTitle>
						<CardDescription>Select the ordering doctor</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field name="doctorId">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Doctor *</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select doctor" />
										</SelectTrigger>
										<SelectContent>
											{doctorsData?.data.map((doc) => (
												<SelectItem key={doc.id} value={doc.id}>
													Dr. {doc.firstName} {doc.lastName}
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
						</form.Field>

						<form.Field name="diagnosis">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Diagnosis</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Clinical diagnosis..."
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="notes">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Notes</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Additional notes..."
										rows={3}
									/>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Tests Selection - Full Width */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FlaskConical className="h-5 w-5" />
							Tests
						</CardTitle>
						<CardDescription>
							Search and add tests from the catalog
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Test Search */}
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search tests by name or code..."
								value={testSearch}
								onChange={(e) => setTestSearch(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Test Search Results */}
						{testSearch && testsData && testsData.data.length > 0 && (
							<div className="max-h-48 overflow-y-auto rounded-md border">
								{testsData.data
									.filter(
										(test) => !selectedTests.some((s) => s.testId === test.id),
									)
									.map((test) => (
										<button
											type="button"
											key={test.id}
											className="flex w-full items-center justify-between border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
											onClick={() => addTest(test.id, test.name, test.code)}
										>
											<div>
												<p className="font-medium">{test.name}</p>
												<p className="text-muted-foreground text-sm">
													{test.code} | {test.category} | {test.sampleType}
												</p>
											</div>
											<div className="flex items-center gap-2">
												{test.price && (
													<span className="text-muted-foreground text-sm">
														${test.price}
													</span>
												)}
												<Plus className="h-4 w-4" />
											</div>
										</button>
									))}
							</div>
						)}

						{/* Selected Tests */}
						{selectedTests.length > 0 ? (
							<div className="space-y-3">
								<h4 className="font-medium text-sm">
									Selected Tests ({selectedTests.length})
								</h4>
								{selectedTests.map((test) => (
									<div
										key={test.testId}
										className="space-y-3 rounded-md border p-3"
									>
										<div className="flex items-center justify-between">
											<div>
												<p className="font-medium">{test.testName}</p>
												<p className="text-muted-foreground text-sm">
													{test.testCode}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removeTest(test.testId)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="space-y-2">
												<Label className="text-xs">Priority</Label>
												<Select
													value={test.priority}
													onValueChange={(v) =>
														updateTestPriority(test.testId, v as TestPriority)
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="ROUTINE">Routine</SelectItem>
														<SelectItem value="URGENT">Urgent</SelectItem>
														<SelectItem value="STAT">STAT</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label className="text-xs">
													Clinical Notes (optional)
												</Label>
												<Input
													value={test.clinicalNotes}
													onChange={(e) =>
														updateTestNotes(test.testId, e.target.value)
													}
													placeholder="Notes for this test..."
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
								No tests selected. Search and add tests above.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Submit */}
				<div className="flex justify-end gap-4 lg:col-span-2">
					<Button type="button" variant="outline" asChild>
						<Link to="/dashboard/lab">Cancel</Link>
					</Button>
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={
									!state.canSubmit ||
									state.isSubmitting ||
									createLabOrderMutation.isPending ||
									!selectedPatientId ||
									selectedTests.length === 0
								}
							>
								{state.isSubmitting || createLabOrderMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Create Lab Order
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}

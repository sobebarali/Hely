import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	FileText,
	Loader2,
	Minus,
	Plus,
	Search,
	Stethoscope,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
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
import { useCreateClinicalNote } from "@/hooks/use-emr";
import { useSearchPatients } from "@/hooks/use-patients";
import { authClient } from "@/lib/auth-client";
import type { CreateClinicalNoteInput } from "@/lib/emr-client";

export const Route = createFileRoute("/dashboard/emr/notes/create")({
	component: CreateNotePage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

const createNoteSchema = z.object({
	patientId: z.string().min(1, "Patient is required"),
	type: z.string().min(1, "Note type is required"),
	chiefComplaint: z.string().min(1, "Chief complaint is required"),
	subjective: z.string(),
	objective: z.string(),
	assessment: z.string(),
	plan: z.string(),
	content: z.string(),
});

type Diagnosis = {
	code: string;
	description: string;
	type: "PRIMARY" | "SECONDARY";
};
type Procedure = { code: string; description: string };

function CreateNotePage() {
	const navigate = useNavigate();
	const createNoteMutation = useCreateClinicalNote();

	// Patient search state
	const [patientSearch, setPatientSearch] = useState("");
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState<{
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	} | null>(null);

	// Dynamic lists
	const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
	const [procedures, setProcedures] = useState<Procedure[]>([]);

	// Search patients
	const { data: searchResults, isLoading: searchLoading } = useSearchPatients({
		q: patientSearch,
		limit: 10,
	});

	const form = useForm({
		defaultValues: {
			patientId: "",
			type: "SOAP",
			chiefComplaint: "",
			subjective: "",
			objective: "",
			assessment: "",
			plan: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const input: CreateClinicalNoteInput = {
					patientId: value.patientId,
					type: value.type as CreateClinicalNoteInput["type"],
					chiefComplaint: value.chiefComplaint,
				};

				if (value.type === "SOAP") {
					if (value.subjective) input.subjective = value.subjective;
					if (value.objective) input.objective = value.objective;
					if (value.assessment) input.assessment = value.assessment;
					if (value.plan) input.plan = value.plan;
				} else {
					if (value.content) input.content = value.content;
				}

				if (diagnoses.length > 0) {
					input.diagnosis = diagnoses;
				}

				if (procedures.length > 0) {
					input.procedures = procedures;
				}

				const result = await createNoteMutation.mutateAsync(input);
				toast.success("Clinical note created successfully");
				navigate({
					to: "/dashboard/emr/notes/$noteId",
					params: { noteId: result.id },
				});
			} catch (error) {
				const apiError = error as { message?: string };
				toast.error(apiError.message || "Failed to create clinical note");
			}
		},
		validators: {
			onSubmit: createNoteSchema,
		},
	});

	const handlePatientSelect = (patient: {
		id: string;
		patientId: string;
		firstName: string;
		lastName: string;
	}) => {
		setSelectedPatient(patient);
		form.setFieldValue("patientId", patient.id);
		setShowSearchResults(false);
		setPatientSearch("");
	};

	const addDiagnosis = () => {
		setDiagnoses([
			...diagnoses,
			{ code: "", description: "", type: "PRIMARY" },
		]);
	};

	const removeDiagnosis = (index: number) => {
		setDiagnoses(diagnoses.filter((_, i) => i !== index));
	};

	const updateDiagnosis = (
		index: number,
		field: keyof Diagnosis,
		value: string,
	) => {
		const updated = [...diagnoses];
		updated[index] = { ...updated[index], [field]: value };
		setDiagnoses(updated);
	};

	const addProcedure = () => {
		setProcedures([...procedures, { code: "", description: "" }]);
	};

	const removeProcedure = (index: number) => {
		setProcedures(procedures.filter((_, i) => i !== index));
	};

	const updateProcedure = (
		index: number,
		field: keyof Procedure,
		value: string,
	) => {
		const updated = [...procedures];
		updated[index] = { ...updated[index], [field]: value };
		setProcedures(updated);
	};

	const [noteType, setNoteType] = useState("SOAP");

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard/emr/notes">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-2xl">Create Clinical Note</h1>
					<p className="text-muted-foreground">
						Create a new clinical documentation note
					</p>
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
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient Selection
						</CardTitle>
						<CardDescription>
							Search and select a patient for the clinical note
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Field name="patientId">
							{(field) => (
								<div className="space-y-2">
									<Label>Patient *</Label>
									{selectedPatient ? (
										<div className="flex items-center gap-2">
											<div className="flex-1 rounded-md border bg-muted p-3">
												<span className="font-medium">
													{selectedPatient.firstName} {selectedPatient.lastName}
												</span>
												<span className="ml-2 text-muted-foreground">
													({selectedPatient.patientId})
												</span>
											</div>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													setSelectedPatient(null);
													field.handleChange("");
												}}
											>
												Change
											</Button>
										</div>
									) : (
										<div className="relative">
											<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="Search by name, ID, or phone..."
												value={patientSearch}
												onChange={(e) => {
													setPatientSearch(e.target.value);
													setShowSearchResults(true);
												}}
												onFocus={() => setShowSearchResults(true)}
												className="pl-9"
											/>
											{showSearchResults && patientSearch.length >= 2 && (
												<div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
													{searchLoading ? (
														<div className="p-4 text-center text-muted-foreground">
															<Loader2 className="mx-auto h-4 w-4 animate-spin" />
														</div>
													) : searchResults && searchResults.length > 0 ? (
														<ul className="max-h-60 overflow-auto py-1">
															{searchResults.map((patient) => (
																<li key={patient.id}>
																	<button
																		type="button"
																		className="w-full px-4 py-2 text-left hover:bg-muted"
																		onClick={() => handlePatientSelect(patient)}
																	>
																		<div className="font-medium">
																			{patient.firstName} {patient.lastName}
																		</div>
																		<div className="text-muted-foreground text-sm">
																			ID: {patient.patientId} | {patient.phone}
																		</div>
																	</button>
																</li>
															))}
														</ul>
													) : (
														<div className="p-4 text-center text-muted-foreground">
															No patients found
														</div>
													)}
												</div>
											)}
										</div>
									)}
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				{/* Note Type & Content */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Note Content
						</CardTitle>
						<CardDescription>
							Select the note type and enter clinical content
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Note Type */}
						<form.Field name="type">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Note Type *</Label>
									<Select
										value={field.state.value}
										onValueChange={(v) => {
											field.handleChange(v);
											setNoteType(v);
										}}
									>
										<SelectTrigger id={field.name}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SOAP">SOAP Note</SelectItem>
											<SelectItem value="PROGRESS">Progress Note</SelectItem>
											<SelectItem value="PROCEDURE">Procedure Note</SelectItem>
											<SelectItem value="DISCHARGE">
												Discharge Summary
											</SelectItem>
											<SelectItem value="CONSULTATION">
												Consultation Note
											</SelectItem>
											<SelectItem value="OPERATIVE">
												Operative Report
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						{/* Chief Complaint */}
						<form.Field name="chiefComplaint">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Chief Complaint *</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Patient's primary reason for visit"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={String(error)} className="text-red-500 text-sm">
											{String(error)}
										</p>
									))}
								</div>
							)}
						</form.Field>

						{/* SOAP-specific fields */}
						{noteType === "SOAP" ? (
							<div className="grid gap-4 lg:grid-cols-2">
								<form.Field name="subjective">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Subjective</Label>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Patient's reported symptoms, history of present illness..."
												rows={5}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="objective">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Objective</Label>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Physical examination findings, vital signs, lab results..."
												rows={5}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="assessment">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Assessment</Label>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Clinical assessment, differential diagnosis..."
												rows={5}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="plan">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Plan</Label>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Treatment plan, medications, follow-up..."
												rows={5}
											/>
										</div>
									)}
								</form.Field>
							</div>
						) : (
							<form.Field name="content">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Content</Label>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Enter clinical note content..."
											rows={10}
										/>
									</div>
								)}
							</form.Field>
						)}
					</CardContent>
				</Card>

				{/* Diagnoses */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Stethoscope className="h-5 w-5" />
								Diagnoses
							</CardTitle>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addDiagnosis}
							>
								<Plus className="mr-1 h-4 w-4" />
								Add
							</Button>
						</div>
						<CardDescription>
							Add diagnosis codes and descriptions
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{diagnoses.length === 0 ? (
							<p className="text-center text-muted-foreground text-sm">
								No diagnoses added. Click "Add" to add a diagnosis.
							</p>
						) : (
							diagnoses.map((diagnosis, index) => (
								<div
									key={`diagnosis-${diagnosis.code || index}`}
									className="space-y-3 rounded-lg border p-3"
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Diagnosis {index + 1}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeDiagnosis(index)}
										>
											<Minus className="h-4 w-4" />
										</Button>
									</div>
									<div className="grid gap-3 sm:grid-cols-3">
										<div className="space-y-1">
											<Label className="text-xs">Code</Label>
											<Input
												value={diagnosis.code}
												onChange={(e) =>
													updateDiagnosis(index, "code", e.target.value)
												}
												placeholder="ICD-10 code"
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Description</Label>
											<Input
												value={diagnosis.description}
												onChange={(e) =>
													updateDiagnosis(index, "description", e.target.value)
												}
												placeholder="Diagnosis description"
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Type</Label>
											<Select
												value={diagnosis.type}
												onValueChange={(v) => updateDiagnosis(index, "type", v)}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="PRIMARY">Primary</SelectItem>
													<SelectItem value="SECONDARY">Secondary</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Procedures */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Procedures
							</CardTitle>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addProcedure}
							>
								<Plus className="mr-1 h-4 w-4" />
								Add
							</Button>
						</div>
						<CardDescription>
							Add procedure codes and descriptions
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{procedures.length === 0 ? (
							<p className="text-center text-muted-foreground text-sm">
								No procedures added. Click "Add" to add a procedure.
							</p>
						) : (
							procedures.map((procedure, index) => (
								<div
									key={`procedure-${procedure.code || index}`}
									className="space-y-3 rounded-lg border p-3"
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Procedure {index + 1}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeProcedure(index)}
										>
											<Minus className="h-4 w-4" />
										</Button>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="space-y-1">
											<Label className="text-xs">Code</Label>
											<Input
												value={procedure.code}
												onChange={(e) =>
													updateProcedure(index, "code", e.target.value)
												}
												placeholder="CPT code"
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Description</Label>
											<Input
												value={procedure.description}
												onChange={(e) =>
													updateProcedure(index, "description", e.target.value)
												}
												placeholder="Procedure description"
											/>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Submit */}
				<div className="flex justify-end gap-4 lg:col-span-2">
					<Button type="button" variant="outline" asChild>
						<Link to="/dashboard/emr/notes">Cancel</Link>
					</Button>
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={
									state.isSubmitting ||
									createNoteMutation.isPending ||
									!selectedPatient
								}
							>
								{state.isSubmitting || createNoteMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<FileText className="mr-2 h-4 w-4" />
										Create Note
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

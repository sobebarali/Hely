import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	Calendar,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock,
	Eye,
	FileText,
	FlaskConical,
	Loader2,
	Pill,
	Plus,
	PlusCircle,
	Stethoscope,
	Syringe,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	useAddProblem,
	useClinicalNotes,
	useMedicalHistory,
	usePatientTimeline,
	useProblems,
} from "@/hooks/use-emr";
import { authClient } from "@/lib/auth-client";
import type {
	Allergy,
	FamilyHistoryEntry,
	Immunization,
	ListTimelineParams,
	Medication,
	PastMedicalHistoryEntry,
	SocialHistory,
	SurgicalHistoryEntry,
	TimelineEvent,
} from "@/lib/emr-client";
import { normalizeSelectValue, SELECT_ALL_VALUE } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/emr/patients/$patientId")({
	component: PatientEmrPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

const TIMELINE_TYPES = [
	{ value: "NOTE", label: "Notes", icon: FileText },
	{ value: "VITALS", label: "Vitals", icon: Activity },
	{ value: "LAB", label: "Lab", icon: FlaskConical },
	{ value: "PRESCRIPTION", label: "Prescriptions", icon: Pill },
	{ value: "APPOINTMENT", label: "Appointments", icon: Calendar },
	{ value: "ADMISSION", label: "Admissions", icon: Stethoscope },
] as const;

function getTimelineIcon(type: string) {
	switch (type) {
		case "NOTE":
			return <FileText className="h-4 w-4" />;
		case "VITALS":
			return <Activity className="h-4 w-4" />;
		case "LAB":
			return <FlaskConical className="h-4 w-4" />;
		case "PRESCRIPTION":
			return <Pill className="h-4 w-4" />;
		case "APPOINTMENT":
			return <Calendar className="h-4 w-4" />;
		case "ADMISSION":
			return <Stethoscope className="h-4 w-4" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
}

function getStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "outline" {
	switch (status) {
		case "DRAFT":
			return "secondary";
		case "SIGNED":
			return "default";
		case "AMENDED":
			return "outline";
		case "ACTIVE":
			return "default";
		case "RESOLVED":
			return "secondary";
		default:
			return "secondary";
	}
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function PatientEmrPage() {
	const _navigate = useNavigate();
	const { patientId } = useParams({
		from: "/dashboard/emr/patients/$patientId",
	});

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/dashboard/emr">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-2xl">Patient EMR</h1>
						<p className="text-muted-foreground">Patient ID: {patientId}</p>
					</div>
				</div>
				<Button asChild>
					<Link to="/dashboard/emr/notes/create">
						<PlusCircle className="mr-2 h-4 w-4" />
						Create Note
					</Link>
				</Button>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="timeline" className="space-y-4">
				<TabsList>
					<TabsTrigger value="timeline">Timeline</TabsTrigger>
					<TabsTrigger value="history">Medical History</TabsTrigger>
					<TabsTrigger value="problems">Problems</TabsTrigger>
					<TabsTrigger value="notes">Notes</TabsTrigger>
				</TabsList>

				<TabsContent value="timeline">
					<TimelineTab patientId={patientId} />
				</TabsContent>

				<TabsContent value="history">
					<MedicalHistoryTab patientId={patientId} />
				</TabsContent>

				<TabsContent value="problems">
					<ProblemsTab patientId={patientId} />
				</TabsContent>

				<TabsContent value="notes">
					<NotesTab patientId={patientId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// --- Timeline Tab ---
function TimelineTab({ patientId }: { patientId: string }) {
	const [typeFilter, setTypeFilter] = useState("");
	const [page, setPage] = useState(1);

	const normalizedType = normalizeSelectValue(typeFilter);

	const { data: timelineData, isLoading } = usePatientTimeline(patientId, {
		page,
		limit: 20,
		type: (normalizedType || undefined) as ListTimelineParams["type"],
	});

	return (
		<div className="space-y-4">
			{/* Filter */}
			<div className="flex items-end gap-4">
				<div className="w-48 space-y-2">
					<Label>Filter by Type</Label>
					<Select
						value={typeFilter}
						onValueChange={(v) => {
							setTypeFilter(v);
							setPage(1);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="All types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={SELECT_ALL_VALUE}>All types</SelectItem>
							{TIMELINE_TYPES.map((t) => (
								<SelectItem key={t.value} value={t.value}>
									{t.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Timeline */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			) : timelineData?.data && timelineData.data.length > 0 ? (
				<div className="space-y-3">
					{timelineData.data.map((entry: TimelineEvent, index: number) => (
						<Card key={`timeline-${entry.id || index}`}>
							<CardContent className="flex items-start gap-4 p-4">
								<div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
									{getTimelineIcon(entry.type)}
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<Badge variant="outline">{entry.type}</Badge>
										<span className="text-muted-foreground text-xs">
											{formatDate(entry.date)}
										</span>
									</div>
									<p className="mt-1 text-sm">
										{String(
											(entry as Record<string, unknown>).summary ??
												(entry as Record<string, unknown>).description ??
												"",
										)}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card className="py-12">
					<CardContent className="text-center">
						<Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No Timeline Entries</h3>
						<p className="text-muted-foreground">
							No events found for this patient.
						</p>
					</CardContent>
				</Card>
			)}

			{/* Pagination */}
			{timelineData?.pagination && (
				<div className="flex items-center justify-between px-2">
					<div className="text-muted-foreground text-sm">
						Showing {timelineData.data.length} of{" "}
						{timelineData.pagination.total} entries
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage(1)}
							disabled={page === 1}
						>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm">
							Page {page} of {timelineData.pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								setPage((p) =>
									Math.min(timelineData.pagination.totalPages, p + 1),
								)
							}
							disabled={page === timelineData.pagination.totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage(timelineData.pagination.totalPages)}
							disabled={page === timelineData.pagination.totalPages}
						>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// --- Medical History Tab ---

function renderHistoryItem(
	section: string,
	item:
		| Allergy
		| Medication
		| SurgicalHistoryEntry
		| FamilyHistoryEntry
		| Immunization
		| PastMedicalHistoryEntry,
): string {
	switch (section) {
		case "allergies": {
			const a = item as Allergy;
			return [a.allergen, a.reaction, a.severity].filter(Boolean).join(" - ");
		}
		case "medications": {
			const m = item as Medication;
			return [m.name, m.dosage, m.frequency].filter(Boolean).join(" - ");
		}
		case "surgicalHistory": {
			const s = item as SurgicalHistoryEntry;
			return [s.procedure, s.date, s.notes].filter(Boolean).join(" - ");
		}
		case "familyHistory": {
			const f = item as FamilyHistoryEntry;
			return [f.condition, f.relationship, f.notes].filter(Boolean).join(" - ");
		}
		case "immunizations": {
			const i = item as Immunization;
			return [i.vaccine, i.date, i.notes].filter(Boolean).join(" - ");
		}
		case "pastMedicalHistory": {
			const p = item as PastMedicalHistoryEntry;
			return [p.condition, p.diagnosedDate, p.status, p.notes]
				.filter(Boolean)
				.join(" - ");
		}
		default:
			return String(item);
	}
}

function renderSocialHistory(social: SocialHistory): string[] {
	const items: string[] = [];
	if (social.smoking) items.push(`Smoking: ${social.smoking}`);
	if (social.alcohol) items.push(`Alcohol: ${social.alcohol}`);
	if (social.exercise) items.push(`Exercise: ${social.exercise}`);
	if (social.occupation) items.push(`Occupation: ${social.occupation}`);
	if (social.notes) items.push(`Notes: ${social.notes}`);
	return items;
}

type ArrayHistorySection =
	| "allergies"
	| "medications"
	| "surgicalHistory"
	| "familyHistory"
	| "immunizations"
	| "pastMedicalHistory";

const ARRAY_HISTORY_SECTIONS: {
	key: ArrayHistorySection;
	label: string;
	icon: typeof Pill;
}[] = [
	{ key: "allergies", label: "Allergies", icon: Syringe },
	{ key: "medications", label: "Medications", icon: Pill },
	{ key: "surgicalHistory", label: "Surgical History", icon: Stethoscope },
	{ key: "familyHistory", label: "Family History", icon: Activity },
	{ key: "immunizations", label: "Immunizations", icon: Syringe },
	{ key: "pastMedicalHistory", label: "Past Medical History", icon: FileText },
];

function MedicalHistoryTab({ patientId }: { patientId: string }) {
	const { data: history, isLoading } = useMedicalHistory(patientId);

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{ARRAY_HISTORY_SECTIONS.map((section) => {
				const Icon = section.icon;
				const items = history?.[section.key] ?? [];

				return (
					<Card key={section.key}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Icon className="h-4 w-4" />
								{section.label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{items.length > 0 ? (
								<ul className="space-y-1">
									{items.map((item, index) => (
										<li
											key={`${section.key}-${index}`}
											className="flex items-center gap-2 text-sm"
										>
											<div className="h-1.5 w-1.5 rounded-full bg-primary" />
											{renderHistoryItem(section.key, item)}
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground text-sm italic">
									No {section.label.toLowerCase()} recorded
								</p>
							)}
						</CardContent>
					</Card>
				);
			})}

			{/* Social History - special case (object, not array) */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Activity className="h-4 w-4" />
						Social History
					</CardTitle>
				</CardHeader>
				<CardContent>
					{history?.socialHistory ? (
						<ul className="space-y-1">
							{renderSocialHistory(history.socialHistory).map((item) => (
								<li
									key={`social-${item}`}
									className="flex items-center gap-2 text-sm"
								>
									<div className="h-1.5 w-1.5 rounded-full bg-primary" />
									{item}
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-sm italic">
							No social history recorded
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// --- Problems Tab ---
function ProblemsTab({ patientId }: { patientId: string }) {
	const [statusFilter, setStatusFilter] = useState("ACTIVE");
	const [showAddForm, setShowAddForm] = useState(false);

	// New problem form state
	const [newProblem, setNewProblem] = useState({
		code: "",
		description: "",
		onsetDate: "",
		notes: "",
	});

	const normalizedStatus = normalizeSelectValue(statusFilter);

	const { data: problemsData, isLoading } = useProblems(patientId, {
		status: (normalizedStatus || undefined) as
			| "ACTIVE"
			| "RESOLVED"
			| "ALL"
			| undefined,
	});

	const addProblemMutation = useAddProblem();

	const handleAddProblem = async () => {
		if (!newProblem.code || !newProblem.description) {
			toast.error("Code and description are required");
			return;
		}

		try {
			await addProblemMutation.mutateAsync({
				patientId,
				data: {
					code: newProblem.code,
					description: newProblem.description,
					onsetDate: newProblem.onsetDate || undefined,
					notes: newProblem.notes || undefined,
				},
			});
			toast.success("Problem added successfully");
			setShowAddForm(false);
			setNewProblem({ code: "", description: "", onsetDate: "", notes: "" });
		} catch (error) {
			const apiError = error as { message?: string };
			toast.error(apiError.message || "Failed to add problem");
		}
	};

	return (
		<div className="space-y-4">
			{/* Filters and Actions */}
			<div className="flex items-end justify-between gap-4">
				<div className="w-48 space-y-2">
					<Label>Status</Label>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ACTIVE">Active</SelectItem>
							<SelectItem value="RESOLVED">Resolved</SelectItem>
							<SelectItem value={SELECT_ALL_VALUE}>All</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button onClick={() => setShowAddForm(!showAddForm)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Add Problem
				</Button>
			</div>

			{/* Add Problem Form */}
			{showAddForm && (
				<Card>
					<CardHeader>
						<CardTitle>Add New Problem</CardTitle>
						<CardDescription>
							Add a new problem to the patient's problem list
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Code *</Label>
								<Input
									value={newProblem.code}
									onChange={(e) =>
										setNewProblem({ ...newProblem, code: e.target.value })
									}
									placeholder="ICD-10 code"
								/>
							</div>
							<div className="space-y-2">
								<Label>Description *</Label>
								<Input
									value={newProblem.description}
									onChange={(e) =>
										setNewProblem({
											...newProblem,
											description: e.target.value,
										})
									}
									placeholder="Problem description"
								/>
							</div>
							<div className="space-y-2">
								<Label>Onset Date</Label>
								<Input
									type="date"
									value={newProblem.onsetDate}
									onChange={(e) =>
										setNewProblem({
											...newProblem,
											onsetDate: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Notes</Label>
								<Textarea
									value={newProblem.notes}
									onChange={(e) =>
										setNewProblem({ ...newProblem, notes: e.target.value })
									}
									placeholder="Additional notes..."
									rows={2}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowAddForm(false);
									setNewProblem({
										code: "",
										description: "",
										onsetDate: "",
										notes: "",
									});
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleAddProblem}
								disabled={addProblemMutation.isPending}
							>
								{addProblemMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Adding...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Add Problem
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Problems List */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			) : problemsData && problemsData.length > 0 ? (
				<div className="space-y-3">
					{problemsData.map(
						(
							problem: {
								id: string;
								code: string;
								description: string;
								status: string;
								onsetDate?: string;
								notes?: string;
							},
							index: number,
						) => (
							<Card key={problem.id || `problem-${index}`}>
								<CardContent className="flex items-start justify-between p-4">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-medium font-mono text-sm">
												{problem.code}
											</span>
											<Badge variant={getStatusBadgeVariant(problem.status)}>
												{problem.status}
											</Badge>
										</div>
										<p className="text-sm">{problem.description}</p>
										{problem.onsetDate && (
											<p className="text-muted-foreground text-xs">
												Onset: {formatDate(problem.onsetDate)}
											</p>
										)}
										{problem.notes && (
											<p className="text-muted-foreground text-xs">
												{problem.notes}
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						),
					)}
				</div>
			) : (
				<Card className="py-12">
					<CardContent className="text-center">
						<Stethoscope className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No Problems Found</h3>
						<p className="text-muted-foreground">
							No {normalizedStatus ? normalizedStatus.toLowerCase() : ""}{" "}
							problems recorded for this patient.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// --- Notes Tab ---
function NotesTab({ patientId }: { patientId: string }) {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);

	const { data: notesData, isLoading } = useClinicalNotes({
		patientId,
		page,
		limit: 10,
	});

	return (
		<div className="space-y-4">
			{/* Notes Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Note ID</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Chief Complaint</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									<Loader2 className="mx-auto h-6 w-6 animate-spin" />
								</TableCell>
							</TableRow>
						) : notesData?.data && notesData.data.length > 0 ? (
							notesData.data.map((note) => (
								<TableRow
									key={note.id}
									className="cursor-pointer"
									onClick={() =>
										navigate({
											to: "/dashboard/emr/notes/$noteId",
											params: { noteId: note.id },
										})
									}
								>
									<TableCell className="font-mono text-sm">
										{note.id.slice(-8)}
									</TableCell>
									<TableCell>
										<Badge variant="outline">{note.type}</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={getStatusBadgeVariant(note.status)}>
											{note.status}
										</Badge>
									</TableCell>
									<TableCell className="max-w-xs truncate">
										{note.chiefComplaint || "-"}
									</TableCell>
									<TableCell className="text-sm">
										{formatDate(note.createdAt)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												navigate({
													to: "/dashboard/emr/notes/$noteId",
													params: { noteId: note.id },
												});
											}}
										>
											<Eye className="mr-1 h-4 w-4" />
											View
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									<div className="flex flex-col items-center gap-2">
										<FileText className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											No clinical notes found for this patient.
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{notesData?.pagination && (
				<div className="flex items-center justify-between px-2">
					<div className="text-muted-foreground text-sm">
						Showing {notesData.data.length} of {notesData.pagination.total}{" "}
						notes
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage(1)}
							disabled={page === 1}
						>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm">
							Page {page} of {notesData.pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								setPage((p) => Math.min(notesData.pagination.totalPages, p + 1))
							}
							disabled={page === notesData.pagination.totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage(notesData.pagination.totalPages)}
							disabled={page === notesData.pagination.totalPages}
						>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	FileText,
	Loader2,
	PlusCircle,
	Search,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useClinicalNotes } from "@/hooks/use-emr";
import { authClient } from "@/lib/auth-client";
import type { ListClinicalNotesParams } from "@/lib/emr-client";
import { normalizeSelectValue, SELECT_ALL_VALUE } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/emr/notes/")({
	component: NotesListPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

const NOTE_TYPES = [
	{ value: "SOAP", label: "SOAP" },
	{ value: "PROGRESS", label: "Progress" },
	{ value: "PROCEDURE", label: "Procedure" },
	{ value: "DISCHARGE", label: "Discharge" },
	{ value: "CONSULTATION", label: "Consultation" },
	{ value: "OPERATIVE", label: "Operative" },
] as const;

const NOTE_STATUSES = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SIGNED", label: "Signed" },
	{ value: "AMENDED", label: "Amended" },
] as const;

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
		default:
			return "secondary";
	}
}

function NotesListPage() {
	const navigate = useNavigate();

	// Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [page, setPage] = useState(1);

	const normalizedType = normalizeSelectValue(typeFilter);
	const normalizedStatus = normalizeSelectValue(statusFilter);

	const { data: notesData, isLoading } = useClinicalNotes({
		page,
		limit: 10,
		search: searchQuery || undefined,
		type: (normalizedType || undefined) as ListClinicalNotesParams["type"],
		status: (normalizedStatus ||
			undefined) as ListClinicalNotesParams["status"],
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const hasFilters =
		searchQuery || typeFilter || statusFilter || startDate || endDate;

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Clinical Notes</h1>
					<p className="text-muted-foreground">
						View and manage all clinical documentation
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/emr/notes/create">
						<PlusCircle className="mr-2 h-4 w-4" />
						Create Note
					</Link>
				</Button>
			</div>

			{/* Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
				<div className="flex-1 space-y-2">
					<Label>Search</Label>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by chief complaint, content..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
				</div>
				<div className="w-40 space-y-2">
					<Label>Type</Label>
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
							{NOTE_TYPES.map((t) => (
								<SelectItem key={t.value} value={t.value}>
									{t.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="w-40 space-y-2">
					<Label>Status</Label>
					<Select
						value={statusFilter}
						onValueChange={(v) => {
							setStatusFilter(v);
							setPage(1);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={SELECT_ALL_VALUE}>All statuses</SelectItem>
							{NOTE_STATUSES.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="w-40 space-y-2">
					<Label>Start Date</Label>
					<Input
						type="date"
						value={startDate}
						onChange={(e) => {
							setStartDate(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				<div className="w-40 space-y-2">
					<Label>End Date</Label>
					<Input
						type="date"
						value={endDate}
						onChange={(e) => {
							setEndDate(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				{hasFilters && (
					<Button
						variant="outline"
						onClick={() => {
							setSearchQuery("");
							setTypeFilter("");
							setStatusFilter("");
							setStartDate("");
							setEndDate("");
							setPage(1);
						}}
					>
						Clear Filters
					</Button>
				)}
			</div>

			{/* Notes Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Note ID</TableHead>
							<TableHead>Patient ID</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Chief Complaint</TableHead>
							<TableHead>Author</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
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
									<TableCell className="font-mono text-sm">
										{note.patientId.slice(-8)}
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
									<TableCell className="font-mono text-sm">
										{note.authorId.slice(-8)}
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
								<TableCell colSpan={8} className="h-24 text-center">
									<div className="flex flex-col items-center gap-2">
										<FileText className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											No clinical notes found.
										</p>
										{hasFilters && (
											<p className="text-muted-foreground text-sm">
												Try adjusting your filters.
											</p>
										)}
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

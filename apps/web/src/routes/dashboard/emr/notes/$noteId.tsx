import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useParams,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	Check,
	Edit,
	FileText,
	Loader2,
	PenLine,
	Save,
	User,
	X,
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	useAmendClinicalNote,
	useClinicalNote,
	useSignClinicalNote,
	useUpdateClinicalNote,
} from "@/hooks/use-emr";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/emr/notes/$noteId")({
	component: NoteDetailPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

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

function NoteDetailPage() {
	const { noteId } = useParams({ from: "/dashboard/emr/notes/$noteId" });
	const { data: note, isLoading } = useClinicalNote(noteId);
	const updateNoteMutation = useUpdateClinicalNote();
	const signNoteMutation = useSignClinicalNote();
	const amendNoteMutation = useAmendClinicalNote();

	const [isEditing, setIsEditing] = useState(false);
	const [showSignDialog, setShowSignDialog] = useState(false);
	const [showAmendDialog, setShowAmendDialog] = useState(false);

	// Edit form
	const editForm = useForm({
		defaultValues: {
			chiefComplaint: note?.chiefComplaint || "",
			subjective: note?.subjective || "",
			objective: note?.objective || "",
			assessment: note?.assessment || "",
			plan: note?.plan || "",
			content: note?.content || "",
		},
		onSubmit: async ({ value }) => {
			try {
				const input: Record<string, unknown> = {};
				if (value.chiefComplaint) input.chiefComplaint = value.chiefComplaint;

				if (note?.type === "SOAP") {
					if (value.subjective) input.subjective = value.subjective;
					if (value.objective) input.objective = value.objective;
					if (value.assessment) input.assessment = value.assessment;
					if (value.plan) input.plan = value.plan;
				} else {
					if (value.content) input.content = value.content;
				}

				await updateNoteMutation.mutateAsync({ noteId, data: input });
				toast.success("Note updated successfully");
				setIsEditing(false);
			} catch (error) {
				const apiError = error as { message?: string };
				toast.error(apiError.message || "Failed to update note");
			}
		},
		validators: {
			onSubmit: z.object({
				chiefComplaint: z.string().min(1, "Chief complaint is required"),
				subjective: z.string(),
				objective: z.string(),
				assessment: z.string(),
				plan: z.string(),
				content: z.string(),
			}),
		},
	});

	// Amend form
	const amendForm = useForm({
		defaultValues: {
			reason: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await amendNoteMutation.mutateAsync({
					noteId,
					data: { reason: value.reason, content: value.content },
				});
				toast.success("Note amended successfully");
				setShowAmendDialog(false);
				amendForm.reset();
			} catch (error) {
				const apiError = error as { message?: string };
				toast.error(apiError.message || "Failed to amend note");
			}
		},
		validators: {
			onSubmit: z.object({
				reason: z.string().min(1, "Reason is required"),
				content: z.string().min(1, "Amendment content is required"),
			}),
		},
	});

	const handleSign = async () => {
		try {
			await signNoteMutation.mutateAsync(noteId);
			toast.success("Note signed successfully");
			setShowSignDialog(false);
		} catch (error) {
			const apiError = error as { message?: string };
			toast.error(apiError.message || "Failed to sign note");
		}
	};

	// Update edit form when note data loads
	if (note && !editForm.state.values.chiefComplaint && note.chiefComplaint) {
		editForm.setFieldValue("chiefComplaint", note.chiefComplaint);
		if (note.subjective) editForm.setFieldValue("subjective", note.subjective);
		if (note.objective) editForm.setFieldValue("objective", note.objective);
		if (note.assessment) editForm.setFieldValue("assessment", note.assessment);
		if (note.plan) editForm.setFieldValue("plan", note.plan);
		if (note.content) editForm.setFieldValue("content", note.content);
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!note) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<h2 className="font-semibold text-xl">Clinical note not found</h2>
				<Button asChild>
					<Link to="/dashboard/emr/notes">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Notes
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/dashboard/emr/notes">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-2xl">Clinical Note</h1>
							<Badge variant={getStatusBadgeVariant(note.status)}>
								{note.status}
							</Badge>
						</div>
						<p className="text-muted-foreground">
							{note.type} Note &middot; {note.id.slice(-8)}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					{note.status === "DRAFT" && (
						<>
							{!isEditing && (
								<Button variant="outline" onClick={() => setIsEditing(true)}>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
							)}
							<Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
								<DialogTrigger asChild>
									<Button>
										<Check className="mr-2 h-4 w-4" />
										Sign Note
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Sign Clinical Note</DialogTitle>
										<DialogDescription>
											This action is irreversible. Once signed, the note cannot
											be edited. You can only amend it after signing. Are you
											sure you want to sign this note?
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setShowSignDialog(false)}
										>
											Cancel
										</Button>
										<Button
											onClick={handleSign}
											disabled={signNoteMutation.isPending}
										>
											{signNoteMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Signing...
												</>
											) : (
												<>
													<Check className="mr-2 h-4 w-4" />
													Confirm Sign
												</>
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</>
					)}

					{(note.status === "SIGNED" || note.status === "AMENDED") && (
						<Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
							<DialogTrigger asChild>
								<Button variant="outline">
									<PenLine className="mr-2 h-4 w-4" />
									Amend
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-lg">
								<form
									onSubmit={(e) => {
										e.preventDefault();
										e.stopPropagation();
										amendForm.handleSubmit();
									}}
								>
									<DialogHeader>
										<DialogTitle>Amend Clinical Note</DialogTitle>
										<DialogDescription>
											Provide a reason and the amendment content. This will be
											appended to the note's amendment history.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4">
										<amendForm.Field name="reason">
											{(field) => (
												<div className="space-y-2">
													<Label htmlFor={field.name}>
														Reason for Amendment *
													</Label>
													<Input
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Why is this amendment needed?"
													/>
													{field.state.meta.errors.map((error) => (
														<p
															key={String(error)}
															className="text-red-500 text-sm"
														>
															{String(error)}
														</p>
													))}
												</div>
											)}
										</amendForm.Field>
										<amendForm.Field name="content">
											{(field) => (
												<div className="space-y-2">
													<Label htmlFor={field.name}>
														Amendment Content *
													</Label>
													<Textarea
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter the amendment details..."
														rows={5}
													/>
													{field.state.meta.errors.map((error) => (
														<p
															key={String(error)}
															className="text-red-500 text-sm"
														>
															{String(error)}
														</p>
													))}
												</div>
											)}
										</amendForm.Field>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setShowAmendDialog(false)}
										>
											Cancel
										</Button>
										<amendForm.Subscribe>
											{(state) => (
												<Button
													type="submit"
													disabled={
														state.isSubmitting || amendNoteMutation.isPending
													}
												>
													{state.isSubmitting || amendNoteMutation.isPending ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Submitting...
														</>
													) : (
														<>
															<PenLine className="mr-2 h-4 w-4" />
															Submit Amendment
														</>
													)}
												</Button>
											)}
										</amendForm.Subscribe>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content Area */}
				<div className="space-y-6 lg:col-span-2">
					{/* Note Content Card */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Note Content
							</CardTitle>
							<CardDescription>
								Chief Complaint:{" "}
								{isEditing ? (
									<editForm.Field name="chiefComplaint">
										{(field) => (
											<Input
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												className="mt-1"
											/>
										)}
									</editForm.Field>
								) : (
									<span className="font-medium">{note.chiefComplaint}</span>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										e.stopPropagation();
										editForm.handleSubmit();
									}}
									className="space-y-4"
								>
									{note.type === "SOAP" ? (
										<div className="grid gap-4 lg:grid-cols-2">
											<editForm.Field name="subjective">
												{(field) => (
													<div className="space-y-2">
														<Label htmlFor={field.name}>Subjective</Label>
														<Textarea
															id={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															rows={5}
														/>
													</div>
												)}
											</editForm.Field>
											<editForm.Field name="objective">
												{(field) => (
													<div className="space-y-2">
														<Label htmlFor={field.name}>Objective</Label>
														<Textarea
															id={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															rows={5}
														/>
													</div>
												)}
											</editForm.Field>
											<editForm.Field name="assessment">
												{(field) => (
													<div className="space-y-2">
														<Label htmlFor={field.name}>Assessment</Label>
														<Textarea
															id={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															rows={5}
														/>
													</div>
												)}
											</editForm.Field>
											<editForm.Field name="plan">
												{(field) => (
													<div className="space-y-2">
														<Label htmlFor={field.name}>Plan</Label>
														<Textarea
															id={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															rows={5}
														/>
													</div>
												)}
											</editForm.Field>
										</div>
									) : (
										<editForm.Field name="content">
											{(field) => (
												<div className="space-y-2">
													<Label htmlFor={field.name}>Content</Label>
													<Textarea
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														rows={10}
													/>
												</div>
											)}
										</editForm.Field>
									)}

									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setIsEditing(false);
												editForm.reset();
											}}
										>
											<X className="mr-1 h-4 w-4" />
											Cancel
										</Button>
										<editForm.Subscribe>
											{(state) => (
												<Button
													type="submit"
													size="sm"
													disabled={
														state.isSubmitting || updateNoteMutation.isPending
													}
												>
													{state.isSubmitting ||
													updateNoteMutation.isPending ? (
														<>
															<Loader2 className="mr-1 h-4 w-4 animate-spin" />
															Saving...
														</>
													) : (
														<>
															<Save className="mr-1 h-4 w-4" />
															Save Changes
														</>
													)}
												</Button>
											)}
										</editForm.Subscribe>
									</div>
								</form>
							) : (
								<div className="space-y-4">
									{note.type === "SOAP" ? (
										<div className="grid gap-4 lg:grid-cols-2">
											<div className="rounded-lg border p-4">
												<h4 className="mb-2 font-semibold text-sm">
													Subjective
												</h4>
												<p className="whitespace-pre-wrap text-sm">
													{note.subjective || (
														<span className="text-muted-foreground italic">
															Not provided
														</span>
													)}
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h4 className="mb-2 font-semibold text-sm">
													Objective
												</h4>
												<p className="whitespace-pre-wrap text-sm">
													{note.objective || (
														<span className="text-muted-foreground italic">
															Not provided
														</span>
													)}
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h4 className="mb-2 font-semibold text-sm">
													Assessment
												</h4>
												<p className="whitespace-pre-wrap text-sm">
													{note.assessment || (
														<span className="text-muted-foreground italic">
															Not provided
														</span>
													)}
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h4 className="mb-2 font-semibold text-sm">Plan</h4>
												<p className="whitespace-pre-wrap text-sm">
													{note.plan || (
														<span className="text-muted-foreground italic">
															Not provided
														</span>
													)}
												</p>
											</div>
										</div>
									) : (
										<div className="rounded-lg border p-4">
											<h4 className="mb-2 font-semibold text-sm">Content</h4>
											<p className="whitespace-pre-wrap text-sm">
												{note.content || (
													<span className="text-muted-foreground italic">
														No content
													</span>
												)}
											</p>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Diagnoses */}
					{note.diagnosis && note.diagnosis.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Diagnoses</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{note.diagnosis.map(
										(diagnosis: {
											code: string;
											description: string;
											type: string;
										}) => (
											<div
												key={`diag-${diagnosis.code}`}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<div>
													<span className="font-medium font-mono text-sm">
														{diagnosis.code}
													</span>
													<span className="ml-2 text-sm">
														{diagnosis.description}
													</span>
												</div>
												<Badge
													variant={
														diagnosis.type === "PRIMARY"
															? "default"
															: "secondary"
													}
												>
													{diagnosis.type}
												</Badge>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Procedures */}
					{note.procedures && note.procedures.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Procedures</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{note.procedures.map(
										(procedure: { code: string; description: string }) => (
											<div
												key={`proc-${procedure.code}`}
												className="rounded-lg border p-3"
											>
												<span className="font-medium font-mono text-sm">
													{procedure.code}
												</span>
												<span className="ml-2 text-sm">
													{procedure.description}
												</span>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Note Info */}
					<Card>
						<CardHeader>
							<CardTitle>Note Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<div>
									<Label className="text-muted-foreground text-xs">Type</Label>
									<p className="font-medium">{note.type}</p>
								</div>
							</div>
							<Separator />
							<div>
								<Label className="text-muted-foreground text-xs">Status</Label>
								<div className="mt-1">
									<Badge variant={getStatusBadgeVariant(note.status)}>
										{note.status}
									</Badge>
								</div>
							</div>
							<Separator />
							<div>
								<Label className="text-muted-foreground text-xs">Note ID</Label>
								<p className="font-mono text-sm">{note.id}</p>
							</div>
							<Separator />
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<div>
									<Label className="text-muted-foreground text-xs">
										Created
									</Label>
									<p className="font-medium text-sm">
										{formatDate(note.createdAt)}
									</p>
								</div>
							</div>
							{note.updatedAt && (
								<>
									<Separator />
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<div>
											<Label className="text-muted-foreground text-xs">
												Updated
											</Label>
											<p className="font-medium text-sm">
												{formatDate(note.updatedAt)}
											</p>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Author Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-4 w-4" />
								Author
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="text-muted-foreground text-xs">Author</Label>
								<p className="font-medium text-sm">
									{note.authorName ?? note.authorId}
								</p>
							</div>
							{note.signedBy && (
								<>
									<Separator />
									<div>
										<Label className="text-muted-foreground text-xs">
											Signed By
										</Label>
										<p className="font-medium text-sm">
											{note.signedByName ?? note.signedBy}
										</p>
									</div>
								</>
							)}
							{note.signedAt && (
								<>
									<Separator />
									<div>
										<Label className="text-muted-foreground text-xs">
											Signed At
										</Label>
										<p className="font-medium text-sm">
											{formatDate(note.signedAt)}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Patient Link */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-4 w-4" />
								Patient
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="font-medium text-sm">
								{note.patientName ?? note.patientId}
							</p>
							<Button variant="outline" size="sm" asChild className="mt-2">
								<Link
									to="/dashboard/emr/patients/$patientId"
									params={{ patientId: note.patientId }}
								>
									View Patient EMR
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Amendments */}
					{note.amendments && note.amendments.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Amendments</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{note.amendments.map(
									(
										amendment: {
											reason: string;
											content: string;
											amendedBy: string;
											amendedAt: string;
										},
										index: number,
									) => (
										<div
											key={`amendment-${amendment.amendedAt}`}
											className="rounded-lg border p-3"
										>
											<div className="mb-1 flex items-center justify-between">
												<span className="font-medium text-sm">
													Amendment {index + 1}
												</span>
												<span className="text-muted-foreground text-xs">
													{formatDate(amendment.amendedAt)}
												</span>
											</div>
											<div className="space-y-1">
												<div>
													<Label className="text-muted-foreground text-xs">
														Reason
													</Label>
													<p className="text-sm">{amendment.reason}</p>
												</div>
												<div>
													<Label className="text-muted-foreground text-xs">
														Content
													</Label>
													<p className="whitespace-pre-wrap text-sm">
														{amendment.content}
													</p>
												</div>
												<div>
													<Label className="text-muted-foreground text-xs">
														Amended By
													</Label>
													<p className="font-mono text-xs">
														{amendment.amendedBy}
													</p>
												</div>
											</div>
										</div>
									),
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

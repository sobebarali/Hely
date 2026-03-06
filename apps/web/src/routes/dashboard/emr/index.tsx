import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowRight,
	ClipboardList,
	Clock,
	FileText,
	PenLine,
	PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/emr/")({
	component: EmrIndexPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function EmrIndexPage() {
	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Electronic Medical Records</h1>
					<p className="text-muted-foreground">
						Manage clinical notes, patient history, and medical timelines
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/emr/notes/create">
						<PlusCircle className="mr-2 h-4 w-4" />
						Create Clinical Note
					</Link>
				</Button>
			</div>

			{/* Quick Actions Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{/* Clinical Notes */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-primary" />
							Clinical Notes
						</CardTitle>
						<CardDescription>
							Create and manage clinical documentation
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Create SOAP notes, progress notes, procedure notes, discharge
							summaries, consultation notes, and operative reports.
						</p>
						<Button asChild className="w-full">
							<Link to="/dashboard/emr/notes">
								<FileText className="mr-2 h-4 w-4" />
								View Notes
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Patient History */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ClipboardList className="h-5 w-5 text-primary" />
							Patient History
						</CardTitle>
						<CardDescription>
							View and update comprehensive medical history
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							Access allergies, medications, surgical history, family history,
							social history, immunizations, and past medical history.
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link to="/dashboard/emr">
								<ClipboardList className="mr-2 h-4 w-4" />
								View History
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Patient Timeline */}
				<Card className="transition-colors hover:border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-primary" />
							Patient Timeline
						</CardTitle>
						<CardDescription>
							View a comprehensive timeline of patient events
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground text-sm">
							See all patient events in chronological order including notes,
							vitals, lab results, prescriptions, appointments, and admissions.
						</p>
						<Button variant="outline" asChild className="w-full">
							<Link to="/dashboard/emr">
								<Clock className="mr-2 h-4 w-4" />
								View Timeline
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Information Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Note Types Info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Note Types
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border p-3">
								<div className="font-medium">SOAP Note</div>
								<div className="text-muted-foreground text-sm">
									Subjective, Objective, Assessment, Plan
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Progress Note</div>
								<div className="text-muted-foreground text-sm">
									Ongoing patient status and updates
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Procedure Note</div>
								<div className="text-muted-foreground text-sm">
									Documentation of performed procedures
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Discharge Summary</div>
								<div className="text-muted-foreground text-sm">
									Summary upon patient discharge
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Consultation Note</div>
								<div className="text-muted-foreground text-sm">
									Specialist consultation documentation
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="font-medium">Operative Report</div>
								<div className="text-muted-foreground text-sm">
									Detailed surgical operation record
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Note Workflow Info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PenLine className="h-5 w-5" />
							Note Workflow
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground text-sm">
							Clinical notes follow a structured workflow to ensure accuracy and
							accountability in medical documentation.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-sm text-white">
									1
								</div>
								<div>
									<span className="font-medium text-blue-700 dark:text-blue-400">
										Draft
									</span>
									<p className="text-blue-600 text-sm dark:text-blue-400">
										Create and edit the clinical note
									</p>
								</div>
							</div>
							<div className="flex items-center justify-center">
								<ArrowRight className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 font-bold text-sm text-white">
									2
								</div>
								<div>
									<span className="font-medium text-green-700 dark:text-green-400">
										Signed
									</span>
									<p className="text-green-600 text-sm dark:text-green-400">
										Finalize and sign the note (irreversible)
									</p>
								</div>
							</div>
							<div className="flex items-center justify-center">
								<ArrowRight className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 font-bold text-sm text-white">
									3
								</div>
								<div>
									<span className="font-medium text-orange-700 dark:text-orange-400">
										Amended
									</span>
									<p className="text-orange-600 text-sm dark:text-orange-400">
										Add corrections with documented reasons
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

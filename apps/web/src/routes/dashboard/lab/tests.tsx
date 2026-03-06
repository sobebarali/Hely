import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	FlaskConical,
	Loader2,
	Plus,
	Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
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
import { type TestCatalogItem, useAddTest, useLabTests } from "@/hooks/use-lab";
import type { ApiError } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { SampleType, TestCategory } from "@/lib/lab-client";

export const Route = createFileRoute("/dashboard/lab/tests")({
	component: TestCatalogPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function TestCatalogPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [addTestSheetOpen, setAddTestSheetOpen] = useState(false);

	const addTestMutation = useAddTest();

	const { data: testsData, isLoading: testsLoading } = useLabTests({
		page,
		limit: 20,
		search: search || undefined,
		category:
			categoryFilter && categoryFilter !== "ALL"
				? (categoryFilter as TestCategory)
				: undefined,
		status:
			statusFilter && statusFilter !== "ALL"
				? (statusFilter as "ACTIVE" | "INACTIVE")
				: undefined,
	});

	const addTestForm = useForm({
		defaultValues: {
			name: "",
			code: "",
			category: "" as string,
			sampleType: "" as string,
			turnaroundTime: "",
			price: "",
			description: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await addTestMutation.mutateAsync({
					name: value.name,
					code: value.code,
					category: value.category as TestCategory,
					sampleType: value.sampleType as SampleType,
					turnaroundTime: value.turnaroundTime,
					price: Number(value.price),
				});
				toast.success("Test added to catalog successfully");
				setAddTestSheetOpen(false);
				addTestForm.reset();
			} catch (error) {
				const apiError = error as ApiError;
				toast.error(apiError.message || "Failed to add test");
			}
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(1, "Name is required"),
				code: z.string().min(1, "Code is required"),
				category: z.string().min(1, "Category is required"),
				sampleType: z.string().min(1, "Sample type is required"),
				turnaroundTime: z.string().min(1, "Turnaround time is required"),
				price: z.string().min(1, "Price is required"),
				description: z.string(),
			}),
		},
	});

	const columns: ColumnDef<TestCatalogItem>[] = [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
		},
		{
			accessorKey: "code",
			header: "Code",
			cell: ({ row }) => (
				<div className="text-muted-foreground">{row.original.code}</div>
			),
		},
		{
			accessorKey: "category",
			header: "Category",
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.category}</Badge>
			),
		},
		{
			accessorKey: "sampleType",
			header: "Sample Type",
			cell: ({ row }) => <div>{row.original.sampleType}</div>,
		},
		{
			accessorKey: "turnaroundTime",
			header: "TAT",
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.original.turnaroundTime || "-"}
				</div>
			),
		},
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ row }) => (
				<div>{row.original.price != null ? `$${row.original.price}` : "-"}</div>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;
				return (
					<Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
						{status}
					</Badge>
				);
			},
		},
	];

	const table = useReactTable({
		data: testsData?.data ?? [],
		columns,
		onSortingChange: (updater) => {
			setSorting(updater);
			setPage(1);
		},
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		manualPagination: true,
		pageCount: testsData?.pagination.totalPages ?? 0,
	});

	return (
		<>
			<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<Button variant="outline" size="icon" asChild>
							<Link to="/dashboard/lab">
								<ArrowLeft className="h-4 w-4" />
							</Link>
						</Button>
						<div>
							<h1 className="font-bold text-2xl">Test Catalog</h1>
							<p className="text-muted-foreground">
								Browse and manage available lab tests
							</p>
						</div>
					</div>
					<Button onClick={() => setAddTestSheetOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Add Test
					</Button>
				</div>

				{/* Filters */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search tests by name or code..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<div className="w-44">
							<Label htmlFor="category-filter" className="sr-only">
								Category
							</Label>
							<Select
								value={categoryFilter}
								onValueChange={(value) => {
									setCategoryFilter(value);
									setPage(1);
								}}
							>
								<SelectTrigger id="category-filter">
									<SelectValue placeholder="All categories" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All categories</SelectItem>
									<SelectItem value="HEMATOLOGY">Hematology</SelectItem>
									<SelectItem value="BIOCHEMISTRY">Biochemistry</SelectItem>
									<SelectItem value="MICROBIOLOGY">Microbiology</SelectItem>
									<SelectItem value="IMMUNOLOGY">Immunology</SelectItem>
									<SelectItem value="PATHOLOGY">Pathology</SelectItem>
									<SelectItem value="RADIOLOGY">Radiology</SelectItem>
									<SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
									<SelectItem value="OTHER">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-36">
							<Label htmlFor="status-filter" className="sr-only">
								Status
							</Label>
							<Select
								value={statusFilter}
								onValueChange={(value) => {
									setStatusFilter(value);
									setPage(1);
								}}
							>
								<SelectTrigger id="status-filter">
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All statuses</SelectItem>
									<SelectItem value="ACTIVE">Active</SelectItem>
									<SelectItem value="INACTIVE">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{testsLoading ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										<Loader2 className="mx-auto h-6 w-6 animate-spin" />
									</TableCell>
								</TableRow>
							) : table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No tests found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{testsData && (
					<div className="flex items-center justify-between px-2">
						<div className="text-muted-foreground text-sm">
							Showing {testsData.data.length} of {testsData.pagination.total}{" "}
							tests
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
								Page {page} of {testsData.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								size="icon"
								onClick={() =>
									setPage((p) =>
										Math.min(testsData.pagination.totalPages, p + 1),
									)
								}
								disabled={page === testsData.pagination.totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => setPage(testsData.pagination.totalPages)}
								disabled={page === testsData.pagination.totalPages}
							>
								<ChevronsRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Add Test Sheet */}
			<Sheet open={addTestSheetOpen} onOpenChange={setAddTestSheetOpen}>
				<SheetContent className="overflow-y-auto sm:max-w-xl">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<FlaskConical className="h-5 w-5" />
							Add New Test
						</SheetTitle>
						<SheetDescription>Add a new test to the catalog.</SheetDescription>
					</SheetHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							addTestForm.handleSubmit();
						}}
						className="flex flex-col gap-6 p-4"
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<addTestForm.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Test Name *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Complete Blood Count"
										/>
										{field.state.meta.errors.map((error) => (
											<p key={String(error)} className="text-red-500 text-sm">
												{String(error)}
											</p>
										))}
									</div>
								)}
							</addTestForm.Field>

							<addTestForm.Field name="code">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Test Code *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="CBC"
										/>
										{field.state.meta.errors.map((error) => (
											<p key={String(error)} className="text-red-500 text-sm">
												{String(error)}
											</p>
										))}
									</div>
								)}
							</addTestForm.Field>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<addTestForm.Field name="category">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Category *</Label>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="HEMATOLOGY">Hematology</SelectItem>
												<SelectItem value="BIOCHEMISTRY">
													Biochemistry
												</SelectItem>
												<SelectItem value="MICROBIOLOGY">
													Microbiology
												</SelectItem>
												<SelectItem value="IMMUNOLOGY">Immunology</SelectItem>
												<SelectItem value="PATHOLOGY">Pathology</SelectItem>
												<SelectItem value="RADIOLOGY">Radiology</SelectItem>
												<SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
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
							</addTestForm.Field>

							<addTestForm.Field name="sampleType">
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
							</addTestForm.Field>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<addTestForm.Field name="turnaroundTime">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Turnaround Time *</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="24 hours"
										/>
										{field.state.meta.errors.map((error) => (
											<p key={String(error)} className="text-red-500 text-sm">
												{String(error)}
											</p>
										))}
									</div>
								)}
							</addTestForm.Field>

							<addTestForm.Field name="price">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Price *</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											min="0"
											step="0.01"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="25.00"
										/>
										{field.state.meta.errors.map((error) => (
											<p key={String(error)} className="text-red-500 text-sm">
												{String(error)}
											</p>
										))}
									</div>
								)}
							</addTestForm.Field>
						</div>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setAddTestSheetOpen(false)}
							>
								Cancel
							</Button>
							<addTestForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										disabled={
											!state.canSubmit ||
											state.isSubmitting ||
											addTestMutation.isPending
										}
									>
										{state.isSubmitting || addTestMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Adding...
											</>
										) : (
											<>
												<Plus className="mr-2 h-4 w-4" />
												Add Test
											</>
										)}
									</Button>
								)}
							</addTestForm.Subscribe>
						</div>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

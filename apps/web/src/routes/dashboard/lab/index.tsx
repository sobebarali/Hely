import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
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
	ArrowUpDown,
	Calendar,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Filter,
	FlaskConical,
	Loader2,
	MoreHorizontal,
	Plus,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { type LabOrderListItem, useLabOrders } from "@/hooks/use-lab";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/lab/")({
	component: LabOrdersListPage,
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

const priorityColors: Record<string, string> = {
	ROUTINE: "secondary",
	URGENT: "default",
	STAT: "destructive",
};

function LabOrdersListPage() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [priorityFilter, setPriorityFilter] = useState<string>("");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

	const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
	const sortOrder =
		sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

	const { data: ordersData, isLoading: ordersLoading } = useLabOrders({
		page,
		limit: 10,
		search: search || undefined,
		status:
			statusFilter && statusFilter !== "ALL"
				? (statusFilter as
						| "ORDERED"
						| "SAMPLE_COLLECTED"
						| "RESULTS_ENTERED"
						| "VERIFIED"
						| "CANCELLED")
				: undefined,
		priority:
			priorityFilter && priorityFilter !== "ALL"
				? (priorityFilter as "ROUTINE" | "URGENT" | "STAT")
				: undefined,
		startDate: startDate || undefined,
		endDate: endDate || undefined,
		sortBy: sortBy as "createdAt" | "orderId" | "status" | undefined,
		sortOrder: sortOrder as "asc" | "desc" | undefined,
	});

	const activeFilterCount = [startDate, endDate].filter(Boolean).length;

	const clearAdvancedFilters = () => {
		setStartDate("");
		setEndDate("");
		setPage(1);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Get the highest priority from an order's tests
	const getOrderPriority = (tests: LabOrderListItem["tests"]): string => {
		if (tests.some((t) => t.priority === "STAT")) return "STAT";
		if (tests.some((t) => t.priority === "URGENT")) return "URGENT";
		return "ROUTINE";
	};

	const columns: ColumnDef<LabOrderListItem>[] = [
		{
			accessorKey: "orderId",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Order ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.original.orderId}</div>
			),
		},
		{
			accessorKey: "patient",
			header: "Patient",
			cell: ({ row }) => (
				<div>
					{row.original.patient.firstName} {row.original.patient.lastName}
				</div>
			),
		},
		{
			accessorKey: "doctor",
			header: "Doctor",
			cell: ({ row }) => (
				<div>
					Dr. {row.original.doctor.firstName} {row.original.doctor.lastName}
				</div>
			),
		},
		{
			accessorKey: "tests",
			header: "Tests",
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.tests.length} test(s)</Badge>
			),
		},
		{
			accessorKey: "priority",
			header: "Priority",
			cell: ({ row }) => {
				const priority = getOrderPriority(row.original.tests);
				return (
					<Badge
						variant={
							priorityColors[priority] as
								| "default"
								| "secondary"
								| "destructive"
								| "outline"
						}
					>
						{priority}
					</Badge>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;
				return (
					<Badge
						variant={
							statusColors[status] as
								| "default"
								| "secondary"
								| "destructive"
								| "outline"
						}
					>
						{status.replace(/_/g, " ")}
					</Badge>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Created
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<Calendar className="h-3 w-3 text-muted-foreground" />
					{formatDate(row.original.createdAt)}
				</div>
			),
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem asChild>
								<Link to="/dashboard/lab/$id" params={{ id: order.id }}>
									View details
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => navigator.clipboard.writeText(order.orderId)}
							>
								Copy Order ID
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const table = useReactTable({
		data: ordersData?.data ?? [],
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
		manualSorting: true,
		pageCount: ordersData?.pagination.totalPages ?? 0,
	});

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Lab Orders</h1>
					<p className="text-muted-foreground">
						Manage lab orders and diagnostics
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link to="/dashboard/lab/tests">
							<FlaskConical className="mr-2 h-4 w-4" />
							Test Catalog
						</Link>
					</Button>
					<Button asChild>
						<Link to="/dashboard/lab/create">
							<Plus className="mr-2 h-4 w-4" />
							Create Order
						</Link>
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by order ID or patient name..."
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
								<SelectItem value="ORDERED">Ordered</SelectItem>
								<SelectItem value="SAMPLE_COLLECTED">
									Sample Collected
								</SelectItem>
								<SelectItem value="RESULTS_ENTERED">Results Entered</SelectItem>
								<SelectItem value="VERIFIED">Verified</SelectItem>
								<SelectItem value="CANCELLED">Cancelled</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="w-36">
						<Label htmlFor="priority-filter" className="sr-only">
							Priority
						</Label>
						<Select
							value={priorityFilter}
							onValueChange={(value) => {
								setPriorityFilter(value);
								setPage(1);
							}}
						>
							<SelectTrigger id="priority-filter">
								<SelectValue placeholder="All priorities" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All priorities</SelectItem>
								<SelectItem value="ROUTINE">Routine</SelectItem>
								<SelectItem value="URGENT">Urgent</SelectItem>
								<SelectItem value="STAT">STAT</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{/* More Filters Popover */}
					<Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" className="relative">
								<Filter className="mr-2 h-4 w-4" />
								More Filters
								{activeFilterCount > 0 && (
									<Badge
										variant="secondary"
										className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
									>
										{activeFilterCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80" align="end">
							<div className="grid gap-4">
								<div className="space-y-2">
									<h4 className="font-medium leading-none">Advanced Filters</h4>
									<p className="text-muted-foreground text-sm">
										Filter orders by date range.
									</p>
								</div>
								<div className="grid gap-3">
									<div className="space-y-2">
										<Label className="flex items-center gap-2 text-sm">
											<Calendar className="h-4 w-4" />
											Date Range
										</Label>
										<div className="grid grid-cols-2 gap-2">
											<div>
												<Label htmlFor="start-date" className="sr-only">
													From
												</Label>
												<Input
													id="start-date"
													type="date"
													placeholder="From"
													value={startDate}
													onChange={(e) => {
														setStartDate(e.target.value);
														setPage(1);
													}}
												/>
											</div>
											<div>
												<Label htmlFor="end-date" className="sr-only">
													To
												</Label>
												<Input
													id="end-date"
													type="date"
													placeholder="To"
													value={endDate}
													onChange={(e) => {
														setEndDate(e.target.value);
														setPage(1);
													}}
												/>
											</div>
										</div>
									</div>
								</div>
								{activeFilterCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										className="w-full"
										onClick={clearAdvancedFilters}
									>
										<X className="mr-2 h-4 w-4" />
										Clear Advanced Filters
									</Button>
								)}
							</div>
						</PopoverContent>
					</Popover>
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
						{ordersLoading ? (
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
									className="cursor-pointer"
									onClick={() =>
										navigate({
											to: "/dashboard/lab/$id",
											params: { id: row.original.id },
										})
									}
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
									No lab orders found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{ordersData && (
				<div className="flex items-center justify-between px-2">
					<div className="text-muted-foreground text-sm">
						Showing {ordersData.data.length} of {ordersData.pagination.total}{" "}
						orders
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
							Page {page} of {ordersData.pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								setPage((p) =>
									Math.min(ordersData.pagination.totalPages, p + 1),
								)
							}
							disabled={page === ordersData.pagination.totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setPage(ordersData.pagination.totalPages)}
							disabled={page === ordersData.pagination.totalPages}
						>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

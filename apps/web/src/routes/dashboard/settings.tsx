import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import {
	Bell,
	Building2,
	Download,
	Lock,
	Paintbrush,
	Settings,
	Shield,
	Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/settings")({
	component: SettingsLayout,
});

const settingsNav = [
	{ to: "/dashboard/settings/general", label: "General", icon: Settings },
	{
		to: "/dashboard/settings/profile",
		label: "Hospital Profile",
		icon: Building2,
	},
	{ to: "/dashboard/settings/branding", label: "Branding", icon: Paintbrush },
	{ to: "/dashboard/settings/security", label: "Security", icon: Lock },
	{
		to: "/dashboard/settings/notifications",
		label: "Notifications",
		icon: Bell,
	},
	{ to: "/dashboard/settings/privacy", label: "Privacy", icon: Shield },
	{
		to: "/dashboard/settings/data-export",
		label: "Data Export",
		icon: Download,
	},
	{
		to: "/dashboard/settings/data-deletion",
		label: "Data Deletion",
		icon: Trash2,
	},
] as const;

function SettingsLayout() {
	const matches = useMatches();
	const currentPath = matches[matches.length - 1]?.fullPath;

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<nav className="flex gap-1 overflow-x-auto border-b pb-2">
				{settingsNav.map(({ to, label, icon: Icon }) => (
					<Link
						key={to}
						to={to}
						className={cn(
							"flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
							currentPath === to
								? "bg-muted text-foreground"
								: "text-muted-foreground",
						)}
					>
						<Icon className="h-4 w-4" />
						{label}
					</Link>
				))}
			</nav>
			<Outlet />
		</div>
	);
}

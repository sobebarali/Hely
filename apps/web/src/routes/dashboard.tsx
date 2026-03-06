import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import Loader from "@/components/loader";
import { useBranding } from "@/contexts/branding-context";
import { useSession } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayoutRoute,
	beforeLoad: async () => {
		// Check if user is authenticated (valid access token)
		if (!authClient.isAuthenticated()) {
			// If access token expired but refresh token exists, try to refresh
			if (authClient.hasRefreshToken()) {
				const refreshed = await authClient.refreshTokens();
				if (refreshed) {
					return; // Successfully refreshed, continue to dashboard
				}
			}
			// No valid tokens, redirect to login
			throw redirect({
				to: "/login",
			});
		}
	},
});

function DashboardLayoutRoute() {
	const { data: session, isLoading } = useSession();
	const { setBrandingFromAuth } = useBranding();

	// Sync branding from auth session (use JSON comparison to avoid re-renders on object reference change)
	const prevBrandingRef = useRef<string>("");
	useEffect(() => {
		const brandingJson = JSON.stringify(session?.hospital?.branding ?? null);
		if (brandingJson !== prevBrandingRef.current) {
			prevBrandingRef.current = brandingJson;
			setBrandingFromAuth(session?.hospital?.branding);
		}
	}, [session?.hospital?.branding, setBrandingFromAuth]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!session) {
		// This shouldn't happen due to beforeLoad, but handle gracefully
		return null;
	}

	const user = {
		name: `${session.firstName} ${session.lastName}`.trim() || session.username,
		email: session.email,
		image: undefined,
	};

	return (
		<DashboardLayout user={user} pageTitle="Dashboard">
			<Outlet />
		</DashboardLayout>
	);
}

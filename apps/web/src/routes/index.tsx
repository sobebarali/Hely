import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	FAQ,
	Features,
	Footer,
	Header,
	Hero,
	HowItWorks,
	Modules,
	Pricing,
	Security,
} from "@/components/landing";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: LandingPage,
	beforeLoad: async () => {
		if (authClient.isAuthenticated()) {
			throw redirect({ to: "/dashboard" });
		}
		// Access token expired but refresh token exists — try to refresh
		if (authClient.hasRefreshToken()) {
			const refreshed = await authClient.refreshTokens();
			if (refreshed) {
				throw redirect({ to: "/dashboard" });
			}
		}
	},
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main>
				<Hero />
				<Features />
				<HowItWorks />
				<Modules />
				<Security />
				<Pricing />
				<FAQ />
			</main>
			<Footer />
		</div>
	);
}

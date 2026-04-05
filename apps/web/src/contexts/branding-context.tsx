import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export interface Branding {
	appName: string;
	logoUrl: string | null;
	faviconUrl: string | null;
	primaryColor: string;
	accentColor: string;
	supportEmail: string;
}

const DEFAULT_BRANDING: Branding = {
	appName: "Hely",
	logoUrl: null,
	faviconUrl: null,
	primaryColor: "#d97706",
	accentColor: "#b45309",
	supportEmail: "support@usehely.com",
};

const BRANDING_CACHE_KEY = "hms_branding";
const DEFAULT_DOMAIN = import.meta.env.VITE_DEFAULT_DOMAIN || "localhost";

interface BrandingContextValue {
	branding: Branding;
	setBrandingFromAuth: (authBranding: AuthBranding | undefined) => void;
	isCustomBranding: boolean;
}

interface AuthBranding {
	appName: string | null;
	logoUrl: string | null;
	faviconUrl: string | null;
	supportEmail: string | null;
	primaryColor: string | null;
	accentColor: string | null;
	customDomain: string | null;
}

const BrandingContext = createContext<BrandingContextValue>({
	branding: DEFAULT_BRANDING,
	setBrandingFromAuth: () => {},
	isCustomBranding: false,
});

function applyBrandingToDOM(branding: Branding) {
	document.title = branding.appName;

	const faviconHref = branding.faviconUrl || "/favicon.svg";
	const existingLink = document.querySelector(
		"link[rel='icon']",
	) as HTMLLinkElement | null;
	if (existingLink) {
		existingLink.href = faviconHref;
	}
	const shortcutLink = document.querySelector(
		"link[rel='shortcut icon']",
	) as HTMLLinkElement | null;
	if (shortcutLink) {
		shortcutLink.href = faviconHref;
	}

	const root = document.documentElement;
	if (branding.primaryColor !== DEFAULT_BRANDING.primaryColor) {
		root.style.setProperty("--primary", branding.primaryColor);
		root.style.setProperty("--ring", branding.primaryColor);
	} else {
		root.style.removeProperty("--primary");
		root.style.removeProperty("--ring");
	}
}

function mergeBranding(auth: AuthBranding | undefined): Branding {
	if (!auth) return DEFAULT_BRANDING;
	return {
		appName: auth.appName || DEFAULT_BRANDING.appName,
		logoUrl: auth.logoUrl,
		faviconUrl: auth.faviconUrl,
		primaryColor: auth.primaryColor || DEFAULT_BRANDING.primaryColor,
		accentColor: auth.accentColor || DEFAULT_BRANDING.accentColor,
		supportEmail: auth.supportEmail || DEFAULT_BRANDING.supportEmail,
	};
}

function isCustomDomain(): boolean {
	const hostname = window.location.hostname;
	return hostname !== "localhost" && hostname !== DEFAULT_DOMAIN;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
	const [branding, setBranding] = useState<Branding>(() => {
		try {
			const cached = sessionStorage.getItem(BRANDING_CACHE_KEY);
			if (cached) {
				return JSON.parse(cached) as Branding;
			}
		} catch {
			// Ignore parse errors
		}
		return DEFAULT_BRANDING;
	});

	const isCustomBranding =
		branding.appName !== DEFAULT_BRANDING.appName ||
		branding.primaryColor !== DEFAULT_BRANDING.primaryColor ||
		branding.logoUrl !== null;

	// Fetch branding by domain for unauthenticated pages on custom domains
	useEffect(() => {
		if (!isCustomDomain()) return;

		const hostname = window.location.hostname;
		const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "";

		fetch(
			`${API_BASE_URL}/api/hospitals/branding?domain=${encodeURIComponent(hostname)}`,
		)
			.then((res) => {
				if (!res.ok) return null;
				return res.json();
			})
			.then((data) => {
				if (data?.success && data.data) {
					const merged = mergeBranding(data.data);
					setBranding(merged);
					sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(merged));
				}
			})
			.catch(() => {
				// Silently fail — use defaults
			});
	}, []);

	useEffect(() => {
		applyBrandingToDOM(branding);
	}, [branding]);

	const setBrandingFromAuth = useCallback(
		(authBranding: AuthBranding | undefined) => {
			const merged = mergeBranding(authBranding);
			setBranding(merged);
			if (authBranding) {
				sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(merged));
			} else {
				sessionStorage.removeItem(BRANDING_CACHE_KEY);
			}
		},
		[],
	);

	const value = useMemo(
		() => ({ branding, setBrandingFromAuth, isCustomBranding }),
		[branding, setBrandingFromAuth, isCustomBranding],
	);

	return (
		<BrandingContext.Provider value={value}>
			{children}
		</BrandingContext.Provider>
	);
}

export function useBranding() {
	return useContext(BrandingContext);
}

import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Edit,
	Globe,
	Image,
	Loader2,
	Palette,
	Save,
	Type,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useBranding } from "@/contexts/branding-context";
import { useSession } from "@/hooks/use-auth";
import {
	useUpdateBranding,
	useUploadBrandingAsset,
} from "@/hooks/use-hospital";
import { type AuthError, authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/branding")({
	component: BrandingSettingsPage,
	beforeLoad: async () => {
		if (!authClient.isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function BrandingSettingsPage() {
	const { data: session, isLoading: isSessionLoading } = useSession();
	const { branding } = useBranding();
	const [isEditing, setIsEditing] = useState(false);

	if (isSessionLoading) {
		return <BrandingSkeleton />;
	}

	const hospitalBranding = session?.hospital?.branding;

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Branding Settings</h1>
					<p className="text-muted-foreground">
						Customize your organization's white-label appearance
					</p>
				</div>
				{!isEditing && (
					<Button onClick={() => setIsEditing(true)}>
						<Edit className="mr-2 h-4 w-4" />
						Edit Branding
					</Button>
				)}
			</div>

			{isEditing ? (
				<BrandingEditForm
					branding={hospitalBranding}
					onCancel={() => setIsEditing(false)}
					onSuccess={() => setIsEditing(false)}
				/>
			) : (
				<BrandingDetailsView
					branding={branding}
					customDomain={hospitalBranding?.customDomain}
				/>
			)}
		</div>
	);
}

function BrandingDetailsView({
	branding,
	customDomain,
}: {
	branding: {
		appName: string;
		supportEmail: string;
		primaryColor: string;
		accentColor: string;
		logoUrl: string | null;
		faviconUrl: string | null;
	};
	customDomain?: string | null;
}) {
	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Type className="h-5 w-5" />
						General
					</CardTitle>
					<CardDescription>Application name and contact</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">App Name</Label>
						<p className="font-medium">{branding.appName}</p>
					</div>
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">
							Support Email
						</Label>
						<p>{branding.supportEmail}</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Palette className="h-5 w-5" />
						Colors
					</CardTitle>
					<CardDescription>Brand color scheme</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">
							Primary Color
						</Label>
						<div className="flex items-center gap-2">
							<div
								className="h-6 w-6 rounded border"
								style={{ backgroundColor: branding.primaryColor }}
							/>
							<p className="font-mono text-sm">{branding.primaryColor}</p>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">
							Accent Color
						</Label>
						<div className="flex items-center gap-2">
							<div
								className="h-6 w-6 rounded border"
								style={{ backgroundColor: branding.accentColor }}
							/>
							<p className="font-mono text-sm">{branding.accentColor}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Image className="h-5 w-5" />
						Assets
					</CardTitle>
					<CardDescription>Logo and favicon</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">Logo</Label>
						{branding.logoUrl ? (
							<img
								src={branding.logoUrl}
								alt="Logo"
								className="h-12 max-w-[200px] object-contain"
							/>
						) : (
							<p className="text-muted-foreground text-sm">No logo uploaded</p>
						)}
					</div>
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">Favicon</Label>
						{branding.faviconUrl ? (
							<img
								src={branding.faviconUrl}
								alt="Favicon"
								className="h-8 w-8 object-contain"
							/>
						) : (
							<p className="text-muted-foreground text-sm">
								No favicon uploaded
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Globe className="h-5 w-5" />
						Custom Domain
					</CardTitle>
					<CardDescription>White-label domain configuration</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label className="text-muted-foreground text-xs">Domain</Label>
						<p
							className={
								customDomain ? "font-medium" : "text-muted-foreground text-sm"
							}
						>
							{customDomain || "Not configured"}
						</p>
					</div>
					<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800 text-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
						<p className="mb-2 font-medium">
							How to connect your custom domain:
						</p>
						<ol className="list-inside list-decimal space-y-1">
							<li>
								Log in to your domain provider (e.g. GoDaddy, Namecheap,
								Cloudflare)
							</li>
							<li>Go to DNS settings for your domain</li>
							<li>
								Add a new DNS record with these settings:
								<ul className="mt-1 ml-5 list-disc space-y-0.5">
									<li>
										Type: <strong>CNAME</strong>
									</li>
									<li>
										Name: your subdomain (e.g. "app" if you want
										app.yourhospital.com)
									</li>
									<li>
										Value:{" "}
										<code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs dark:bg-blue-900">
											{import.meta.env.VITE_DEFAULT_DOMAIN || "app.usehely.com"}
										</code>
									</li>
								</ul>
							</li>
							<li>
								Save the record, then come back here and click "Edit Branding"
								to enter your domain
							</li>
							<li>DNS changes can take up to 48 hours to take effect</li>
						</ol>
						<p className="mt-2 text-xs">Need help? Contact support.</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function BrandingEditForm({
	branding,
	onCancel,
	onSuccess,
}: {
	branding?: {
		appName: string | null;
		logoUrl: string | null;
		faviconUrl: string | null;
		supportEmail: string | null;
		primaryColor: string | null;
		accentColor: string | null;
		customDomain: string | null;
	};
	onCancel: () => void;
	onSuccess: () => void;
}) {
	const updateMutation = useUpdateBranding();
	const uploadMutation = useUploadBrandingAsset();
	const { setBrandingFromAuth } = useBranding();

	const [logoPreview, setLogoPreview] = useState<string | null>(
		branding?.logoUrl ?? null,
	);
	const [faviconPreview, setFaviconPreview] = useState<string | null>(
		branding?.faviconUrl ?? null,
	);
	const [pendingLogoBase64, setPendingLogoBase64] = useState<string | null>(
		null,
	);
	const [pendingFaviconBase64, setPendingFaviconBase64] = useState<
		string | null
	>(null);

	const logoInputRef = useRef<HTMLInputElement>(null);
	const faviconInputRef = useRef<HTMLInputElement>(null);

	const form = useForm({
		defaultValues: {
			appName: branding?.appName ?? "",
			supportEmail: branding?.supportEmail ?? "",
			primaryColor: branding?.primaryColor ?? "#d97706",
			accentColor: branding?.accentColor ?? "#b45309",
			customDomain: branding?.customDomain ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				// Upload assets first if pending
				let logoUrl = branding?.logoUrl ?? null;
				let faviconUrl = branding?.faviconUrl ?? null;

				if (pendingLogoBase64) {
					const result = await uploadMutation.mutateAsync({
						type: "logo",
						image: pendingLogoBase64,
					});
					logoUrl = result.url;
				}

				if (pendingFaviconBase64) {
					const result = await uploadMutation.mutateAsync({
						type: "favicon",
						image: pendingFaviconBase64,
					});
					faviconUrl = result.url;
				}

				// Build patch with only changed fields
				const patch: Record<string, string | null> = {};
				if (value.appName && value.appName !== (branding?.appName ?? "")) {
					patch.appName = value.appName;
				}
				if (
					value.supportEmail &&
					value.supportEmail !== (branding?.supportEmail ?? "")
				) {
					patch.supportEmail = value.supportEmail;
				}
				if (value.primaryColor !== (branding?.primaryColor ?? "#d97706")) {
					patch.primaryColor = value.primaryColor;
				}
				if (value.accentColor !== (branding?.accentColor ?? "#b45309")) {
					patch.accentColor = value.accentColor;
				}
				if (value.customDomain !== (branding?.customDomain ?? "")) {
					patch.customDomain = value.customDomain || null;
				}
				if (logoUrl !== (branding?.logoUrl ?? null)) {
					patch.logoUrl = logoUrl;
				}
				if (faviconUrl !== (branding?.faviconUrl ?? null)) {
					patch.faviconUrl = faviconUrl;
				}

				if (Object.keys(patch).length > 0) {
					const updated = await updateMutation.mutateAsync(patch);
					setBrandingFromAuth(updated);
				}

				toast.success("Branding updated successfully");
				onSuccess();
			} catch (error) {
				const apiError = error as AuthError;
				toast.error(apiError.message || "Failed to update branding");
			}
		},
		validators: {
			onSubmit: z.object({
				appName: z.string().min(1, "App name is required").max(100),
				supportEmail: z.string().email("Invalid email address"),
				primaryColor: z
					.string()
					.regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
				accentColor: z
					.string()
					.regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
				customDomain: z.string(),
			}),
		},
	});

	const handleFileSelect = async (file: File, type: "logo" | "favicon") => {
		const base64 = await fileToBase64(file);
		if (type === "logo") {
			setLogoPreview(base64);
			setPendingLogoBase64(base64);
		} else {
			setFaviconPreview(base64);
			setPendingFaviconBase64(base64);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Type className="h-5 w-5" />
							General
						</CardTitle>
						<CardDescription>Application name and contact</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field name="appName">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>App Name *</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
						<form.Field name="supportEmail">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Support Email *</Label>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="h-5 w-5" />
							Colors
						</CardTitle>
						<CardDescription>Brand color scheme</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field name="primaryColor">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Primary Color *</Label>
									<div className="flex items-center gap-2">
										<input
											type="color"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-10 w-10 cursor-pointer rounded border p-0.5"
										/>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="#d97706"
											className="font-mono"
										/>
									</div>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
						<form.Field name="accentColor">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Accent Color *</Label>
									<div className="flex items-center gap-2">
										<input
											type="color"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-10 w-10 cursor-pointer rounded border p-0.5"
										/>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="#b45309"
											className="font-mono"
										/>
									</div>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Image className="h-5 w-5" />
							Assets
						</CardTitle>
						<CardDescription>Logo and favicon uploads</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Logo</Label>
							{logoPreview && (
								<img
									src={logoPreview}
									alt="Logo preview"
									className="h-12 max-w-[200px] object-contain"
								/>
							)}
							<input
								ref={logoInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileSelect(file, "logo");
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => logoInputRef.current?.click()}
							>
								{logoPreview ? "Change Logo" : "Upload Logo"}
							</Button>
						</div>
						<div className="space-y-2">
							<Label>Favicon</Label>
							{faviconPreview && (
								<img
									src={faviconPreview}
									alt="Favicon preview"
									className="h-8 w-8 object-contain"
								/>
							)}
							<input
								ref={faviconInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileSelect(file, "favicon");
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => faviconInputRef.current?.click()}
							>
								{faviconPreview ? "Change Favicon" : "Upload Favicon"}
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />
							Custom Domain
						</CardTitle>
						<CardDescription>White-label domain configuration</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Field name="customDomain">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Domain</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="app.yourhospital.com"
									/>
									<p className="font-medium text-muted-foreground text-xs">
										How to set this up:
									</p>
									<ol className="mt-1 list-inside list-decimal space-y-0.5 text-muted-foreground text-xs">
										<li>
											Log in to your domain provider (e.g. GoDaddy, Namecheap,
											Cloudflare)
										</li>
										<li>Go to your domain's DNS settings</li>
										<li>
											Add a new CNAME record: Name: your subdomain (e.g. "app")
											→ Value:{" "}
											<code className="rounded bg-muted px-1 py-0.5 font-mono">
												{import.meta.env.VITE_DEFAULT_DOMAIN ||
													"app.usehely.com"}
											</code>
										</li>
										<li>
											Enter your full domain below (e.g. app.yourhospital.com)
										</li>
										<li>
											Save — DNS changes can take up to 48 hours to take effect
										</li>
									</ol>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-4 md:col-span-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						<X className="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={
									!state.canSubmit ||
									state.isSubmitting ||
									updateMutation.isPending ||
									uploadMutation.isPending
								}
							>
								{state.isSubmitting ||
								updateMutation.isPending ||
								uploadMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</div>
		</form>
	);
}

function BrandingSkeleton() {
	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

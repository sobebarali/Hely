import { Hospital } from "@hms/db";
import type { NextFunction, Request, Response } from "express";
import { createServiceLogger } from "../lib/logger";

const logger = createServiceLogger("domainResolver");

declare global {
	namespace Express {
		interface Request {
			resolvedTenantId?: string;
		}
	}
}

/**
 * Middleware that resolves a custom domain from the Host header
 * to a tenantId. Used for public routes (e.g., branding lookup).
 *
 * For auth-protected routes, tenant still comes from JWT (no change).
 */
export async function domainResolver(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	try {
		const host = req.hostname;

		// Skip for localhost and common dev domains
		if (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host.endsWith(".localhost")
		) {
			return next();
		}

		// Skip if default domain (set via env)
		const defaultDomain = process.env.DEFAULT_DOMAIN;
		if (defaultDomain && host === defaultDomain) {
			return next();
		}

		// Look up custom domain
		const hospital = await Hospital.findOne(
			{ "branding.customDomain": host },
			{ _id: 1 },
		).lean();

		if (hospital) {
			req.resolvedTenantId = String(hospital._id);
			logger.debug(
				{ host, tenantId: req.resolvedTenantId },
				"Domain resolved to tenant",
			);
		}
	} catch (error) {
		logger.warn({ error, host: req.hostname }, "Domain resolution failed");
		// Don't block the request — just proceed without resolved tenant
	}

	next();
}

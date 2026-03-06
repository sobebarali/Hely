import { Router } from "express";
import { Permissions } from "../../constants";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { apiRateLimiter } from "../../middlewares/rate-limit";
import { validate } from "../../middlewares/validate";
import { getBrandingController } from "./controllers/get.branding.controller";
import { getHospitalByIdController } from "./controllers/get-by-id.hospital.controller";
import { registerHospitalController } from "./controllers/register.hospital.controller";
import { updateBrandingController } from "./controllers/update.branding.controller";
import { updateHospitalController } from "./controllers/update.hospital.controller";
import { updateStatusHospitalController } from "./controllers/update-status.hospital.controller";
import { uploadBrandingAssetController } from "./controllers/upload.branding-asset.controller";
import { verifyHospitalController } from "./controllers/verify.hospital.controller";
import { getHospitalByIdSchema } from "./validations/get-by-id.hospital.validation";
import { registerHospitalSchema } from "./validations/register.hospital.validation";
import { updateBrandingSchema } from "./validations/update.branding.validation";
import { updateHospitalSchema } from "./validations/update.hospital.validation";
import { updateStatusHospitalSchema } from "./validations/update-status.hospital.validation";
import { uploadBrandingAssetSchema } from "./validations/upload.branding-asset.validation";
import { verifyHospitalSchema } from "./validations/verify.hospital.validation";

const router = Router();

// ============================================================================
// Public Routes (No Authentication Required)
// ============================================================================

// GET /api/hospitals/branding?domain=... - Get branding by custom domain (public)
router.get("/branding", apiRateLimiter, getBrandingController);

// POST /api/hospitals - Register new hospital (public)
router.post("/", validate(registerHospitalSchema), registerHospitalController);

// POST /api/hospitals/:id/verify - Verify hospital (public, uses verification token)
router.post(
	"/:id/verify",
	validate(verifyHospitalSchema),
	verifyHospitalController,
);

// ============================================================================
// Protected Routes (Authentication Required)
// ============================================================================

// PATCH /api/hospitals/branding - Update hospital branding (admin only)
router.patch(
	"/branding",
	authenticate,
	authorize(Permissions.TENANT_UPDATE),
	validate(updateBrandingSchema),
	updateBrandingController,
);

// POST /api/hospitals/branding/:type - Upload branding asset (logo or favicon)
router.post(
	"/branding/:type",
	authenticate,
	authorize(Permissions.TENANT_UPDATE),
	validate(uploadBrandingAssetSchema),
	uploadBrandingAssetController,
);

// GET /api/hospitals/:id - Get hospital by ID
router.get(
	"/:id",
	authenticate,
	authorize(Permissions.TENANT_READ),
	validate(getHospitalByIdSchema),
	getHospitalByIdController,
);

// PATCH /api/hospitals/:id - Update hospital
router.patch(
	"/:id",
	authenticate,
	authorize(Permissions.TENANT_UPDATE),
	validate(updateHospitalSchema),
	updateHospitalController,
);

// PATCH /api/hospitals/:id/status - Update hospital status
router.patch(
	"/:id/status",
	authenticate,
	authorize(Permissions.TENANT_MANAGE),
	validate(updateStatusHospitalSchema),
	updateStatusHospitalController,
);

export default router;

import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { cancelTelemedicineController } from "./controllers/cancel.telemedicine.controller";
import { createTelemedicineController } from "./controllers/create.telemedicine.controller";
import { getTelemedicineByIdController } from "./controllers/get-by-id.telemedicine.controller";
import { listTelemedicineController } from "./controllers/list.telemedicine.controller";

// Validations
import { cancelTelemedicineSchema } from "./validations/cancel.telemedicine.validation";
import { createTelemedicineSchema } from "./validations/create.telemedicine.validation";
import { getTelemedicineByIdSchema } from "./validations/get-by-id.telemedicine.validation";
import { listTelemedicineSchema } from "./validations/list.telemedicine.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/telemedicine/visits - Create a virtual visit
router.post(
	"/visits",
	authorize("TELEMEDICINE:CREATE"),
	validate(createTelemedicineSchema),
	createTelemedicineController,
);

// GET /api/telemedicine/visits - List virtual visits
router.get(
	"/visits",
	authorize("TELEMEDICINE:READ"),
	validate(listTelemedicineSchema),
	listTelemedicineController,
);

// GET /api/telemedicine/visits/:visitId - Get a virtual visit
router.get(
	"/visits/:visitId",
	authorize("TELEMEDICINE:READ"),
	validate(getTelemedicineByIdSchema),
	getTelemedicineByIdController,
);

// POST /api/telemedicine/visits/:visitId/cancel - Cancel a virtual visit
router.post(
	"/visits/:visitId/cancel",
	authorize("TELEMEDICINE:MANAGE"),
	validate(cancelTelemedicineSchema),
	cancelTelemedicineController,
);

export default router;

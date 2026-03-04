import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { createLabOrderController } from "./controllers/create.lab-orders.controller";

// Validations
import { createLabOrderSchema } from "./validations/create.lab-orders.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/lab/orders - Create new lab order
router.post(
	"/orders",
	authorize("LAB:CREATE"),
	validate(createLabOrderSchema),
	createLabOrderController,
);

export default router;

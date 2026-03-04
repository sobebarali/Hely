import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { createLabOrderController } from "./controllers/create.lab-orders.controller";
import { listLabOrdersController } from "./controllers/list.lab-orders.controller";

// Validations
import { createLabOrderSchema } from "./validations/create.lab-orders.validation";
import { listLabOrdersSchema } from "./validations/list.lab-orders.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/lab/orders - List lab orders
router.get(
	"/orders",
	authorize("LAB:READ"),
	validate(listLabOrdersSchema),
	listLabOrdersController,
);

// POST /api/lab/orders - Create new lab order
router.post(
	"/orders",
	authorize("LAB:CREATE"),
	validate(createLabOrderSchema),
	createLabOrderController,
);

export default router;

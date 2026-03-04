import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { collectLabOrderController } from "./controllers/collect.lab-orders.controller";
import { createLabOrderController } from "./controllers/create.lab-orders.controller";
import { enterLabResultsController } from "./controllers/enter-results.lab-orders.controller";
import { listLabOrdersController } from "./controllers/list.lab-orders.controller";
import { listTestCatalogController } from "./controllers/list-tests.lab-catalog.controller";
import { reportLabOrderController } from "./controllers/report.lab-orders.controller";
import { verifyLabOrderController } from "./controllers/verify.lab-orders.controller";

// Validations
import { collectLabOrderSchema } from "./validations/collect.lab-orders.validation";
import { createLabOrderSchema } from "./validations/create.lab-orders.validation";
import { enterLabResultSchema } from "./validations/enter-results.lab-orders.validation";
import { listLabOrdersSchema } from "./validations/list.lab-orders.validation";
import { listTestCatalogSchema } from "./validations/list-tests.lab-catalog.validation";
import { reportLabOrderSchema } from "./validations/report.lab-orders.validation";
import { verifyLabOrderSchema } from "./validations/verify.lab-orders.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/lab/tests - List test catalog
router.get(
	"/tests",
	authorize("LAB:READ"),
	validate(listTestCatalogSchema),
	listTestCatalogController,
);

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

// POST /api/lab/orders/:orderId/collect - Collect sample for lab order
router.post(
	"/orders/:orderId/collect",
	authorize("LAB:COLLECT"),
	validate(collectLabOrderSchema),
	collectLabOrderController,
);

// POST /api/lab/orders/:orderId/results - Enter results for lab order
router.post(
	"/orders/:orderId/results",
	authorize("LAB:RESULT"),
	validate(enterLabResultSchema),
	enterLabResultsController,
);

// POST /api/lab/orders/:orderId/verify - Verify results for lab order
router.post(
	"/orders/:orderId/verify",
	authorize("LAB:VERIFY"),
	validate(verifyLabOrderSchema),
	verifyLabOrderController,
);

// GET /api/lab/orders/:orderId/report - Download PDF report for verified lab order
router.get(
	"/orders/:orderId/report",
	authorize("LAB:READ"),
	validate(reportLabOrderSchema),
	reportLabOrderController,
);

export default router;

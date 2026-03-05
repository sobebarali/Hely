import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { addProblemController } from "./controllers/add-problem.emr.controller";
import { amendNoteController } from "./controllers/amend-note.emr.controller";
import { createNoteController } from "./controllers/create-note.emr.controller";
import { getHistoryController } from "./controllers/get-history.emr.controller";
import { getNoteController } from "./controllers/get-note.emr.controller";
import { getProblemsController } from "./controllers/get-problems.emr.controller";
import { listNotesController } from "./controllers/list-notes.emr.controller";
import { signNoteController } from "./controllers/sign-note.emr.controller";
import { timelineController } from "./controllers/timeline.emr.controller";
import { updateHistoryController } from "./controllers/update-history.emr.controller";
import { updateNoteController } from "./controllers/update-note.emr.controller";

// Validations
import { addProblemSchema } from "./validations/add-problem.emr.validation";
import { amendNoteSchema } from "./validations/amend-note.emr.validation";
import { createNoteSchema } from "./validations/create-note.emr.validation";
import { getHistorySchema } from "./validations/get-history.emr.validation";
import { getNoteSchema } from "./validations/get-note.emr.validation";
import { getProblemsSchema } from "./validations/get-problems.emr.validation";
import { listNotesSchema } from "./validations/list-notes.emr.validation";
import { signNoteSchema } from "./validations/sign-note.emr.validation";
import { timelineSchema } from "./validations/timeline.emr.validation";
import { updateHistorySchema } from "./validations/update-history.emr.validation";
import { updateNoteSchema } from "./validations/update-note.emr.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/emr/notes - Create clinical note
router.post(
	"/notes",
	authorize("EMR:CREATE"),
	validate(createNoteSchema),
	createNoteController,
);

// GET /api/emr/notes - List clinical notes
router.get(
	"/notes",
	authorize("EMR:READ"),
	validate(listNotesSchema),
	listNotesController,
);

// GET /api/emr/notes/:noteId - Get clinical note
router.get(
	"/notes/:noteId",
	authorize("EMR:READ"),
	validate(getNoteSchema),
	getNoteController,
);

// PUT /api/emr/notes/:noteId - Update clinical note
router.put(
	"/notes/:noteId",
	authorize("EMR:UPDATE"),
	validate(updateNoteSchema),
	updateNoteController,
);

// POST /api/emr/notes/:noteId/sign - Sign clinical note
router.post(
	"/notes/:noteId/sign",
	authorize("EMR:SIGN"),
	validate(signNoteSchema),
	signNoteController,
);

// POST /api/emr/notes/:noteId/amend - Amend clinical note
router.post(
	"/notes/:noteId/amend",
	authorize("EMR:AMEND"),
	validate(amendNoteSchema),
	amendNoteController,
);

// GET /api/emr/patients/:patientId/history - Get medical history
router.get(
	"/patients/:patientId/history",
	authorize("EMR:READ"),
	validate(getHistorySchema),
	getHistoryController,
);

// PUT /api/emr/patients/:patientId/history - Update medical history
router.put(
	"/patients/:patientId/history",
	authorize("EMR:UPDATE"),
	validate(updateHistorySchema),
	updateHistoryController,
);

// GET /api/emr/patients/:patientId/problems - Get problem list
router.get(
	"/patients/:patientId/problems",
	authorize("EMR:READ"),
	validate(getProblemsSchema),
	getProblemsController,
);

// POST /api/emr/patients/:patientId/problems - Add problem
router.post(
	"/patients/:patientId/problems",
	authorize("EMR:CREATE"),
	validate(addProblemSchema),
	addProblemController,
);

// GET /api/emr/patients/:patientId/timeline - Patient timeline
router.get(
	"/patients/:patientId/timeline",
	authorize("EMR:READ"),
	validate(timelineSchema),
	timelineController,
);

export default router;

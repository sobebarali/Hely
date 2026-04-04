/**
 * BullMQ Queue Definitions
 *
 * Centralized queue configuration for background job processing
 */

import { Queue } from "bullmq";
import { createUtilLogger } from "../logger";
import { createRedisConnection, isRedisConfigured } from "../redis";

const logger = createUtilLogger("queues");

// Queue names
export const QUEUE_NAMES = {
	EMAIL: "email",
	EXPORT: "export",
	REPORT: "report",
	AUDIT_LOG: "audit-log",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Default job options per queue
export const DEFAULT_JOB_OPTIONS = {
	[QUEUE_NAMES.EMAIL]: {
		attempts: 3,
		backoff: {
			type: "exponential" as const,
			delay: 2000, // Start with 2 seconds
		},
		removeOnComplete: {
			age: 24 * 60 * 60, // Keep completed jobs for 24 hours
			count: 1000, // Keep last 1000 completed jobs
		},
		removeOnFail: {
			age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
		},
	},
	[QUEUE_NAMES.EXPORT]: {
		attempts: 2,
		backoff: {
			type: "exponential" as const,
			delay: 5000,
		},
		removeOnComplete: {
			age: 7 * 24 * 60 * 60, // Keep for 7 days
			count: 500,
		},
		removeOnFail: {
			age: 30 * 24 * 60 * 60, // Keep failed for 30 days
		},
	},
	[QUEUE_NAMES.REPORT]: {
		attempts: 2,
		backoff: {
			type: "exponential" as const,
			delay: 5000,
		},
		removeOnComplete: {
			age: 7 * 24 * 60 * 60,
			count: 500,
		},
		removeOnFail: {
			age: 30 * 24 * 60 * 60,
		},
	},
	[QUEUE_NAMES.AUDIT_LOG]: {
		attempts: 5, // More retries for compliance-critical logs
		backoff: {
			type: "exponential" as const,
			delay: 1000,
		},
		removeOnComplete: {
			age: 60 * 60, // Keep for 1 hour (audit logs are persisted to DB)
			count: 10000,
		},
		removeOnFail: {
			age: 7 * 24 * 60 * 60, // Keep failed for investigation
		},
	},
};

/**
 * No-op queue for environments without Redis (dev/test).
 * BullMQ requires real Redis (streams, lua scripts) so the mock won't work.
 * Jobs are silently dropped — workers don't start without Redis anyway.
 */
function createMockQueue(name: string): Queue {
	let jobCounter = 0;
	return {
		name,
		add: async (_jobName: string, _data: unknown) => {
			logger.debug({ queue: name, job: _jobName }, "Job dropped (no Redis)");
			return { id: `mock-${++jobCounter}` };
		},
		on: () => {},
		close: async () => {},
	} as unknown as Queue;
}

function createQueue(name: string, opts: object): Queue {
	if (!isRedisConfigured) {
		return createMockQueue(name);
	}
	return new Queue(name, {
		connection: queueConnection,
		defaultJobOptions: opts,
	});
}

// Create shared Redis connection for queues (only if Redis is configured)
const queueConnection = isRedisConfigured ? createRedisConnection() : null;

// Initialize queues
export const emailQueue = createQueue(
	QUEUE_NAMES.EMAIL,
	DEFAULT_JOB_OPTIONS[QUEUE_NAMES.EMAIL],
);
export const exportQueue = createQueue(
	QUEUE_NAMES.EXPORT,
	DEFAULT_JOB_OPTIONS[QUEUE_NAMES.EXPORT],
);
export const reportQueue = createQueue(
	QUEUE_NAMES.REPORT,
	DEFAULT_JOB_OPTIONS[QUEUE_NAMES.REPORT],
);
export const auditLogQueue = createQueue(
	QUEUE_NAMES.AUDIT_LOG,
	DEFAULT_JOB_OPTIONS[QUEUE_NAMES.AUDIT_LOG],
);

// Log queue events
const queues = [emailQueue, exportQueue, reportQueue, auditLogQueue];

for (const queue of queues) {
	queue.on("error", (error) => {
		logger.error({ queue: queue.name, error }, "Queue error");
	});
}

/**
 * Close all queue connections gracefully
 */
export async function closeQueues(): Promise<void> {
	logger.info("Closing queue connections...");
	await Promise.all(queues.map((queue) => queue.close()));
	if (queueConnection) {
		await queueConnection.quit();
	}
	logger.info("All queue connections closed");
}

/**
 * Get all queues for monitoring/admin purposes
 */
export function getAllQueues(): Queue[] {
	return queues;
}

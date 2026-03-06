import { LabOrderStatus } from "@hms/db";
import PDFDocument from "pdfkit";
import { BadRequestError, NotFoundError } from "../../../errors";
import { createServiceLogger } from "../../../lib/logger";
import { findPatientById } from "../../patients/repositories/shared.patients.repository";
import { findLabOrderById } from "../repositories/shared.lab-orders.repository";

type LabOrderDoc = NonNullable<Awaited<ReturnType<typeof findLabOrderById>>>;
type PatientDoc = Awaited<ReturnType<typeof findPatientById>>;

const logger = createServiceLogger("reportLabOrder");

export async function reportLabOrderService({
	tenantId,
	orderId,
}: {
	tenantId: string;
	orderId: string;
}) {
	logger.info({ tenantId, orderId }, "Generating lab report PDF");

	// Fetch order
	const labOrder = await findLabOrderById({ tenantId, orderId });
	if (!labOrder) {
		throw new NotFoundError("Lab order not found", "NOT_FOUND");
	}

	// Check status
	if (labOrder.status !== LabOrderStatus.VERIFIED) {
		throw new BadRequestError(
			"Results must be verified before generating report",
			"RESULTS_NOT_VERIFIED",
		);
	}

	// Fetch patient
	const patient = await findPatientById({
		tenantId,
		patientId: labOrder.patientId,
	});

	// Generate PDF
	const pdfBuffer = await generateReportPDF({ labOrder, patient });

	return {
		content: pdfBuffer,
		contentType: "application/pdf",
		filename: `lab-report-${orderId}.pdf`,
	};
}

async function generateReportPDF({
	labOrder,
	patient,
}: {
	labOrder: LabOrderDoc;
	patient: PatientDoc;
}): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: "A4",
				margin: 40,
			});

			const chunks: Buffer[] = [];
			doc.on("data", (chunk: Buffer) => chunks.push(chunk));
			doc.on("end", () => resolve(Buffer.concat(chunks)));
			doc.on("error", reject);

			const pageWidth =
				doc.page.width - doc.page.margins.left - doc.page.margins.right;

			// Header
			doc
				.fontSize(20)
				.font("Helvetica-Bold")
				.text("Laboratory Report", { align: "center" });
			doc.moveDown(0.3);
			doc
				.fontSize(10)
				.font("Helvetica")
				.fill("#666666")
				.text(`Report Date: ${new Date().toISOString().split("T")[0]}`, {
					align: "center",
				});
			doc.moveDown(0.5);

			// Divider
			doc
				.moveTo(doc.page.margins.left, doc.y)
				.lineTo(doc.page.margins.left + pageWidth, doc.y)
				.stroke();
			doc.moveDown(0.5);

			// Patient Info
			doc
				.fontSize(14)
				.font("Helvetica-Bold")
				.fill("#000000")
				.text("Patient Information");
			doc.moveDown(0.3);
			doc.fontSize(10).font("Helvetica");

			if (patient) {
				const patientName =
					`${patient.firstName || ""} ${patient.lastName || ""}`.trim();
				doc.text(`Name: ${patientName || "N/A"}`);
				doc.text(`Patient ID: ${patient.patientId || "N/A"}`);
				doc.text(`Gender: ${patient.gender || "N/A"}`);
				if (patient.dateOfBirth) {
					doc.text(
						`Date of Birth: ${new Date(patient.dateOfBirth).toISOString().split("T")[0]}`,
					);
				}
			} else {
				doc.text("Patient information not available");
			}
			doc.moveDown(0.5);

			// Order Details
			doc.fontSize(14).font("Helvetica-Bold").text("Order Details");
			doc.moveDown(0.3);
			doc.fontSize(10).font("Helvetica");
			doc.text(`Order ID: ${labOrder.orderId || labOrder._id}`);
			doc.text(`Diagnosis: ${labOrder.diagnosis || "N/A"}`);
			doc.text(`Notes: ${labOrder.notes || "N/A"}`);
			doc.moveDown(0.5);

			// Results Table
			doc.fontSize(14).font("Helvetica-Bold").text("Test Results");
			doc.moveDown(0.5);

			const tests = labOrder.tests || [];
			const columns = [
				{ label: "Test", width: pageWidth * 0.2 },
				{ label: "Code", width: pageWidth * 0.1 },
				{ label: "Value", width: pageWidth * 0.1 },
				{ label: "Unit", width: pageWidth * 0.1 },
				{ label: "Normal Range", width: pageWidth * 0.15 },
				{ label: "Flag", width: pageWidth * 0.1 },
				{ label: "Interpretation", width: pageWidth * 0.25 },
			];

			// Table header
			const startX = doc.page.margins.left;
			const headerY = doc.y;

			doc.rect(startX, headerY - 2, pageWidth, 16).fill("#f0f0f0");
			doc.fill("#000000").fontSize(9).font("Helvetica-Bold");

			let currentX = startX;
			for (const col of columns) {
				doc.text(col.label, currentX + 2, headerY, {
					width: col.width - 4,
					height: 14,
					ellipsis: true,
				});
				currentX += col.width;
			}
			doc.moveDown(0.5);

			doc
				.moveTo(startX, doc.y)
				.lineTo(startX + pageWidth, doc.y)
				.stroke();
			doc.moveDown(0.3);

			// Table rows
			doc.font("Helvetica").fontSize(8);
			for (let i = 0; i < tests.length; i++) {
				const test = tests[i];
				if (!test) continue;

				if (doc.y > doc.page.height - 80) {
					doc.addPage();
					doc.y = doc.page.margins.top;
				}

				const rowY = doc.y;
				const resultDetails = test.resultDetails || {};

				if (i % 2 === 0) {
					doc.rect(startX, rowY - 1, pageWidth, 14).fill("#fafafa");
					doc.fill("#000000");
				}

				currentX = startX;
				const rowData = [
					String(test.testName || ""),
					String(test.testCode || ""),
					String(resultDetails.value || ""),
					String(resultDetails.unit || ""),
					String(resultDetails.normalRange || ""),
					String(resultDetails.flag || ""),
					String(resultDetails.interpretation || ""),
				];

				for (let j = 0; j < columns.length; j++) {
					const col = columns[j] as (typeof columns)[number];
					doc.text(rowData[j] || "", currentX + 2, rowY, {
						width: col.width - 4,
						height: 12,
						ellipsis: true,
					});
					currentX += col.width;
				}
				doc.moveDown(0.5);
			}

			doc.moveDown(1);

			// Verification Info
			doc
				.fontSize(14)
				.font("Helvetica-Bold")
				.fill("#000000")
				.text("Verification");
			doc.moveDown(0.3);
			doc.fontSize(10).font("Helvetica");
			doc.text(`Verified By: ${labOrder.verifiedBy || "N/A"}`);
			if (labOrder.verifiedAt) {
				doc.text(`Verified At: ${new Date(labOrder.verifiedAt).toISOString()}`);
			}
			if (labOrder.verificationComments) {
				doc.text(`Comments: ${labOrder.verificationComments}`);
			}
			doc.moveDown(1);

			// Footer
			doc
				.moveTo(doc.page.margins.left, doc.y)
				.lineTo(doc.page.margins.left + pageWidth, doc.y)
				.stroke();
			doc.moveDown(0.3);
			doc
				.fontSize(8)
				.fill("#666666")
				.text("This report is electronically generated.", { align: "center" });

			doc.end();
		} catch (error) {
			reject(error);
		}
	});
}

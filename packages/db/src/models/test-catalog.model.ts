import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const TestCatalogStatus = {
	ACTIVE: "ACTIVE",
	INACTIVE: "INACTIVE",
} as const;

export const TestCategory = {
	HEMATOLOGY: "HEMATOLOGY",
	BIOCHEMISTRY: "BIOCHEMISTRY",
	MICROBIOLOGY: "MICROBIOLOGY",
	IMMUNOLOGY: "IMMUNOLOGY",
	PATHOLOGY: "PATHOLOGY",
	RADIOLOGY: "RADIOLOGY",
	CARDIOLOGY: "CARDIOLOGY",
	OTHER: "OTHER",
} as const;

export const SampleType = {
	BLOOD: "BLOOD",
	URINE: "URINE",
	STOOL: "STOOL",
	SPUTUM: "SPUTUM",
	SWAB: "SWAB",
	TISSUE: "TISSUE",
	CSF: "CSF",
	OTHER: "OTHER",
} as const;

const referenceRangeSchema = new Schema(
	{
		label: { type: String, required: true },
		min: { type: Number },
		max: { type: Number },
		unit: { type: String },
		gender: { type: String, enum: ["MALE", "FEMALE", "ALL"], default: "ALL" },
	},
	{ _id: false },
);

const testCatalogSchema = new Schema(
	{
		_id: { type: String },
		tenantId: { type: String, ref: "Organization", required: true },
		name: { type: String, required: true },
		code: { type: String, required: true },
		category: {
			type: String,
			enum: Object.values(TestCategory),
			required: true,
		},
		sampleType: {
			type: String,
			enum: Object.values(SampleType),
			required: true,
		},
		turnaroundTime: { type: String },
		price: { type: Number },
		referenceRanges: [referenceRangeSchema],
		status: {
			type: String,
			enum: Object.values(TestCatalogStatus),
			default: TestCatalogStatus.ACTIVE,
		},
	},
	{ collection: "testCatalog", timestamps: true },
);

testCatalogSchema.index({ tenantId: 1, code: 1 }, { unique: true });
testCatalogSchema.index({ tenantId: 1, status: 1 });
testCatalogSchema.index({ tenantId: 1, category: 1 });

const TestCatalog = model("TestCatalog", testCatalogSchema);

export { TestCatalog };

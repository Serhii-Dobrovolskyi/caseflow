const { z } = require("zod");

const createCaseSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

const updateCaseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["new", "in_progress", "blocked", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

module.exports = { createCaseSchema, updateCaseSchema };

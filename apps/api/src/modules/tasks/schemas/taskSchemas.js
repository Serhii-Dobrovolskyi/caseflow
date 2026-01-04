const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional() // ISO string, например "2026-01-04T12:00:00.000Z"
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  dueDate: z.string().datetime().nullable().optional()
});

module.exports = { createTaskSchema, updateTaskSchema };

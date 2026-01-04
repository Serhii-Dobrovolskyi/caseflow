const express = require("express");
const mongoose = require("mongoose");

const { Task } = require("../models/Task");
const { Case } = require("../../cases/models/Case");
const { requireAuth } = require("../../auth/middleware/requireAuth");
const { createTaskSchema, updateTaskSchema } = require("../schemas/taskSchemas");

const router = express.Router();

/**
 * Helper: check if current user can access the case
 * - admin/manager: any case in org
 * - user: only assignedTo or createdBy
 */
async function getAccessibleCaseOrNull(caseId, user) {
  const baseFilter = { _id: caseId, orgId: user.orgId };

  if (user.role === "user") {
    baseFilter.$or = [{ assignedTo: user.id }, { createdBy: user.id }];
  }

  return Case.findOne(baseFilter);
}

/**
 * POST /cases/:caseId/tasks
 */
router.post("/cases/:caseId/tasks", requireAuth, async (req, res, next) => {
  try {
    const { caseId } = req.params;

    if (!mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ error: "ValidationError", message: "Invalid caseId" });
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const c = await getAccessibleCaseOrNull(caseId, req.user);
    if (!c) {
      return res.status(404).json({ error: "CaseNotFound", message: "Case not found" });
    }

    const created = await Task.create({
      caseId: c._id,
      orgId: c.orgId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdBy: req.user.id
    });

    return res.status(201).json({
      task: {
        id: created._id.toString(),
        caseId: created.caseId.toString(),
        title: created.title,
        status: created.status,
        dueDate: created.dueDate,
        createdAt: created.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /cases/:caseId/tasks
 */
router.get("/cases/:caseId/tasks", requireAuth, async (req, res, next) => {
  try {
    const { caseId } = req.params;

    if (!mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ error: "ValidationError", message: "Invalid caseId" });
    }

    const c = await getAccessibleCaseOrNull(caseId, req.user);
    if (!c) {
      return res.status(404).json({ error: "CaseNotFound", message: "Case not found" });
    }

    const items = await Task.find({ caseId: c._id, orgId: req.user.orgId })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      tasks: items.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        dueDate: t.dueDate,
        createdAt: t.createdAt
      }))
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /tasks/:taskId
 */
router.patch("/tasks/:taskId", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ error: "ValidationError", message: "Invalid taskId" });
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    // Find task in current org
    const task = await Task.findOne({ _id: taskId, orgId: req.user.orgId });
    if (!task) {
      return res.status(404).json({ error: "TaskNotFound", message: "Task not found" });
    }

    // Check access to case
    const c = await getAccessibleCaseOrNull(task.caseId.toString(), req.user);
    if (!c) {
      return res.status(403).json({ error: "Forbidden", message: "No access to this case" });
    }

    const update = { ...parsed.data };
    if (Object.prototype.hasOwnProperty.call(update, "dueDate")) {
      update.dueDate = update.dueDate ? new Date(update.dueDate) : null;
    }

    const updated = await Task.findOneAndUpdate(
      { _id: taskId, orgId: req.user.orgId },
      { $set: update },
      { new: true }
    );

    return res.json({
      task: {
        id: updated._id.toString(),
        title: updated.title,
        description: updated.description,
        status: updated.status,
        dueDate: updated.dueDate,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /tasks/:taskId
 */
router.delete("/tasks/:taskId", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ error: "ValidationError", message: "Invalid taskId" });
    }

    const task = await Task.findOne({ _id: taskId, orgId: req.user.orgId });
    if (!task) {
      return res.status(404).json({ error: "TaskNotFound", message: "Task not found" });
    }

    const c = await getAccessibleCaseOrNull(task.caseId.toString(), req.user);
    if (!c) {
      return res.status(403).json({ error: "Forbidden", message: "No access to this case" });
    }

    await Task.deleteOne({ _id: taskId, orgId: req.user.orgId });

    return res.json({ status: "ok" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

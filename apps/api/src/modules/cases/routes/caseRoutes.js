const express = require("express");
const mongoose = require("mongoose");

const { Case } = require("../models/Case");
const { requireAuth } = require("../../auth/middleware/requireAuth");
const { createCaseSchema, updateCaseSchema } = require("../schemas/caseSchemas");

const router = express.Router();

/**
 * POST /cases
 * Create a case in current org
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten()
      });
    }

    const created = await Case.create({
      orgId: req.user.orgId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      priority: parsed.data.priority ?? "medium",
      createdBy: req.user.id
    });

    return res.status(201).json({
      case: {
        id: created._id.toString(),
        orgId: created.orgId.toString(),
        title: created.title,
        description: created.description,
        status: created.status,
        priority: created.priority,
        createdAt: created.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /cases
 * List cases in current org
 * Optional query: ?status=...  (new|in_progress|blocked|done)
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { orgId: req.user.orgId };
    if (status && ["new", "in_progress", "blocked", "done"].includes(status)) {
      filter.status = status;
    }

    const items = await Case.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      cases: items.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        status: c.status,
        priority: c.priority,
        createdAt: c.createdAt
      }))
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /cases/:id
 * Get one case (only if belongs to current org)
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid case id"
      });
    }

    const c = await Case.findOne({ _id: id, orgId: req.user.orgId });
    if (!c) {
      return res.status(404).json({
        error: "CaseNotFound",
        message: "Case not found"
      });
    }

    return res.json({
      case: {
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        status: c.status,
        priority: c.priority,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /cases/:id
 * Update a case in current org
 */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid case id"
      });
    }

    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten()
      });
    }

    const updated = await Case.findOneAndUpdate(
      { _id: id, orgId: req.user.orgId },
      { $set: parsed.data },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        error: "CaseNotFound",
        message: "Case not found"
      });
    }

    return res.json({
      case: {
        id: updated._id.toString(),
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /cases/:id
 * Delete a case in current org
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid case id"
      });
    }

    const deleted = await Case.findOneAndDelete({ _id: id, orgId: req.user.orgId });
    if (!deleted) {
      return res.status(404).json({
        error: "CaseNotFound",
        message: "Case not found"
      });
    }

    return res.json({ status: "ok" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

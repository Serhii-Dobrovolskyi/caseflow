const express = require("express");

const app = express();

app.use(express.json());

const healthRoute = require("./routes/health");
app.use("/health", healthRoute);

const authRoutes = require("./modules/auth/routes/authRoutes");
app.use("/auth", authRoutes);

const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

// 404 handler (after routes)
app.use(notFound);

// error handler (the last middleware)
app.use(errorHandler);



module.exports = app;

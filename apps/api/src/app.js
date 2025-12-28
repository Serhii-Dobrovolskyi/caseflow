const express = require("express");

const app = express();

app.use(express.json());

const healthRoute = require("./routes/health");
app.use("/health", healthRoute);

const authRoutes = require("./modules/auth/routes/authRoutes");
app.use("/auth", authRoutes);


module.exports = app;

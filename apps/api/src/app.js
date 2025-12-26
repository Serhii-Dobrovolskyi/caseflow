const express = require("express");

const app = express();

app.use(express.json());

const healthRoute = require("./routes/health");
app.use("/health", healthRoute);

module.exports = app;

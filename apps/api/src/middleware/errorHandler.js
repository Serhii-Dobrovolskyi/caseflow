function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: err.message || "Something went wrong"
  });
}

module.exports = { errorHandler };

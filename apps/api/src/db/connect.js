const mongoose = require("mongoose");

async function connectToDatabase(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
}

module.exports = { connectToDatabase };

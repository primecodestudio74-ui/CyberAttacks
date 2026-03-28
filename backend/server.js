import express from "express";

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Backend running...");
});

// Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on localhost:${PORT}`);
});
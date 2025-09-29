import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Sheshh it's runnin!" });
  });

// Routes
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express API!" });
});

// Example REST routes
app.get("/api/users", (req, res) => {
  res.json([{ id: 1, name: "John Doe" }]);
});

app.post("/api/users", (req, res) => {
  const newUser = req.body;
  res.json({ message: "User created", user: newUser });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

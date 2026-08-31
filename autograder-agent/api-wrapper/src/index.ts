import "dotenv/config";
import express from "express";
import gradeRouter from "./routes/grade";
import generateSoalRouter from "./routes/generateSoal"; // ← tambahan

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// ← tambahan: proteksi sederhana pakai shared secret, samakan pola dengan callbackService.ts
app.use((req, res, next) => {
  if (req.path === "/") return next(); // health check tetap public
  const secret = req.header("x-agent-secret");
  if (secret !== process.env.AGENT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/", gradeRouter);
app.use("/", generateSoalRouter); // ← tambahan

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "autograder-agent" });
});

app.listen(PORT, () => {
  console.log(`Autograder Agent jalan di http://localhost:${PORT}`);
});

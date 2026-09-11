import "dotenv/config";
import express from "express";
import gradeRouter from "./routes/grade";
import generateSoalRouter from "./routes/generateSoal";
import { llmClient } from "./services/llm/client";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: "15mb" }));

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
app.use("/", generateSoalRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "autograder-agent" });
});

app.listen(PORT, () => {
  console.log(`Autograder Agent jalan di http://localhost:${PORT}`);
  const llmInfo = llmClient.describe();
  console.log(`[llm] Urutan provider: ${llmInfo.order.join(" → ") || "(kosong)"}`);
  for (const p of llmInfo.providers) {
    console.log(
      `[llm]   ${p.name}${p.available ? "" : " (key belum diset)"} — model: ${p.model}`
    );
  }
});

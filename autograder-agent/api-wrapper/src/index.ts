import "dotenv/config";
import express from "express";
import gradeRouter from "./routes/grade";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use("/", gradeRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "autograder-agent" });
});

app.listen(PORT, () => {
  console.log(`Autograder Agent jalan di http://localhost:${PORT}`);
});

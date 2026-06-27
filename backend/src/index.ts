import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { rentRoutes }   from "./routes/rentRoutes";
import { summaryRoutes } from "./routes/summaryRoutes";
import { memberRoutes } from "./routes/memberRoutes";
import { bazarRoutes }  from "./routes/bazarRoutes";
import { mealRoutes }   from "./routes/mealRoutes";
import { todayRoutes }   from "./routes/todayRoutes";
import { mealOptRoutes }    from "./routes/mealOptRoutes";
import { enrollmentRoutes } from "./routes/enrollmentRoutes";
import { myBazarRoutes }   from "./routes/myBazarRoutes";
import { userRoutes }      from "./routes/userRoutes";
import { swaggerSpec }   from "./swagger";

const app = express();
const PORT = process.env.PORT ?? 3001;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  "http://localhost:5173",
  /^https:\/\/mess-manager-.*\.vercel\.app$/,
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use("/api", rentRoutes);
app.use("/api", summaryRoutes);
app.use("/api", memberRoutes);
app.use("/api", bazarRoutes);
app.use("/api", mealRoutes);
app.use("/api", todayRoutes);
app.use("/api", mealOptRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api", myBazarRoutes);
app.use("/api", userRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Mess Manager API Docs",
}));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Mess backend listening on port ${PORT}`);
});

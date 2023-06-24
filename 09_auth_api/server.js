import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import createUserRouter from "./routes/user-routes.js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
app.use(express.json());
app.use("/", createUserRouter(supabase));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/jwtVerify.js";

const userRouter = new Router();

const createUserRouter = (supabase) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  console.log(JWT_SECRET);
  userRouter.post("/register", async (req, res) => {
    console.log(JWT_SECRET);

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();

      if (fetchError) {
        console.error(fetchError);
        return res.sendStatus(500);
      }

      if (existingUser) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const { error: insertError } = await supabase
        .from("users")
        .insert([{ email, password: hashedPassword }])
        .single();

      if (insertError) {
        console.error(insertError);
        return res.sendStatus(500);
      }

      const accessToken = jwt.sign({ email }, JWT_SECRET, {
        expiresIn: "1h",
      });
      const refreshToken = jwt.sign({ email }, JWT_SECRET);

      res.status(200).json({
        success: true,
        data: {
          email,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

  userRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error(error);
        return res.sendStatus(500);
      }

      if (!data) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = data;
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const accessToken = jwt.sign({ email }, JWT_SECRET, {
        expiresIn: "1h",
      });
      const refreshToken = jwt.sign({ email }, JWT_SECRET);

      res.status(200).json({
        success: true,
        data: {
          email,
          userId: user.id,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

  userRouter.get("/user", verifyToken, async (req, res) => {
    try {
      const { email } = req.user;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error(error);
        return res.sendStatus(500);
      }

      if (!data) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });
  return userRouter;
};
export default createUserRouter;

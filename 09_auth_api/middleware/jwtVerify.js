import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  console.log(JWT_SECRET);
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token not provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error(err);
      return res.status(401).json({ message: "Invalid access token" });
    }
    req.user = decoded;
    next();
  });
};

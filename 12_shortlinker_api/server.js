const express = require("express");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

const PORT = 3000;
dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/shortURL", async (req, res) => {
  const { link } = req.body;

  if (!link) {
    return res.status(400).json({ error: "URL is required" });
  }

  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;

  if (!urlRegex.test(link)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const shortURL = generateShortURL(link);

  try {
    const { error } = await supabase
      .from("hashLinkStorage")
      .upsert([{ hashCode: shortURL, originalURL: link }]);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to store hash" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }

  res.status(200).json({ shortURL });
});

app.get("/:linkHash", async (req, res) => {
  const { linkHash } = req.params;

  try {
    const { data, error } = await supabase
      .from("hashLinkStorage")
      .select("originalURL")
      .eq("hashCode", linkHash);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to get URL" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const { originalURL } = data[0];
    
    return res.redirect(originalURL);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});

function generateShortURL(url) {
  const md5Hash = crypto.createHash("md5").update(url).digest("hex");
  return md5Hash.substring(0, 6);
}

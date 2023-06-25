const express = require("express");
const dotenv = require("dotenv")
const { createClient } = require("@supabase/supabase-js");


const app = express();
app.use(express.json());

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.put("/:json_path", async (req, res) => {
  const jsonPath = req.params.json_path;
  const jsonData = req.body;

  try {
    const { error } = await supabase
      .from("json_data")
      .upsert([{ path: jsonPath, data: jsonData }]);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to store JSON document" });
    }

    res.status(200).json({ message: "JSON document stored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/:json_path", async (req, res) => {
  const jsonPath = req.params.json_path;

  try {
    const { data, error } = await supabase
      .from("json_data")
      .select("data")
      .eq("path", jsonPath)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Failed to retrieve JSON document" });
    }

    if (!data) {
      return res.status(404).json({ message: "JSON document not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

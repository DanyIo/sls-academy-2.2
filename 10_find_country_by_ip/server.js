const express = require("express");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();

const ipData = [];

app.set("trust proxy", true);

fs.createReadStream("./countries/ip_data.csv")
  .pipe(csv())
  .on("data", (row) => {
    // Parse the values from the row object
    const from = row["0"];
    const to = row["16777215"];
    const country = row["-"];

    const ipRange = { from, to, country };

    ipData.push(ipRange);
  })
  .on("end", () => {
    console.log("CSV file successfully processed.");
  });

app.get("/ip", (req, res) => {
  const userIp = req.ip;
  const match = ipData.find((row) => {
    const from = row.from;
    const to = row.to;
    const userIpNum = ipToNumber(userIp);
    return userIpNum >= from && userIpNum <= to;
  });

  if (match) {
    res.json({
      ip: userIp,
      country: match.country,
      range: `${match.from} - ${match.to}`,
    });
  } else {
    res.status(404).json({
      error: "IP not found in database.",
    });
  }
});

function ipToNumber(ip) {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

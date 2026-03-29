const express = require("express");
const app = express();

// 🔥 IMPORTANT (must be BEFORE routes)
app.use(express.json());

// ✅ Your webhook route (PUT IT HERE)
app.post("/paynecta-webhook", (req, res) => {
  console.log("🔥🔥 WEBHOOK HIT 🔥🔥");
  console.log(req.body);

  res.sendStatus(200);
});

// Optional test route
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

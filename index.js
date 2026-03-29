// Test route (GET)
app.get("/paynecta-webhook", (req, res) => {
  res.send("Webhook endpoint is live ✅");
});

// Actual webhook (POST)
app.post("/paynecta-webhook", (req, res) => {
  console.log("📩 Webhook received:", req.body);

  res.sendStatus(200); // respond immediately

  // Process in background
  setImmediate(() => {
    const data = req.body;

    if (data.status === "completed") {
      console.log("✅ Payment success:", data.transaction_id);
    }
  });
});

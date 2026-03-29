app.post("/paynecta-webhook", async (req, res) => {
  const signature = req.headers["x-paynecta-signature"];

  // 🔐 Verify webhook
  if (signature !== process.env.PAYNECTA_SECRET) {
    return res.status(403).send("Invalid signature");
  }

  const data = req.body;

  console.log("📩 Webhook:", data);

  if (data.status === "completed") {
    const tx = data.transaction_id;

    // OPTIONAL: verify with PayNecta API
    // (recommended for extra security)

    // ✅ Auto approve
    await db.payments.update({
      transaction_id: tx,
      status: "paid"
    });

    console.log("✅ Payment confirmed:", tx);
  }

  res.sendStatus(200); // VERY IMPORTANT
});

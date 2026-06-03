import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware to parse incoming requests
  app.use(express.json());

  // API route for handling booking and sending silent email notifications via Resend
  app.post("/api/book", async (req, res) => {
    try {
      const { clientName, businessName, clientPhone, projectType, budget, details } = req.body;

      if (!clientName || !businessName || !clientPhone) {
        res.status(400).json({ error: "Missing required fields: clientName, businessName, clientPhone" });
        return;
      }

      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn("⚠️ RESEND_API_KEY is not defined in the environment variables!");
        res.status(400).json({ error: "Resend API key is missing from configuration." });
        return;
      }

      console.log(`Delivering silent email notification via Resend for client: ${clientName}...`);

      const emailSubject = `🚀 New Lead: ${clientName} - ${projectType || "Project"}`;
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #f0f2f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #12141c; border-radius: 16px; border: 1px solid #1f2330; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #00f2fe, #4facfe); padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #0a0a0f; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; }
    .field { margin-bottom: 20px; border-bottom: 1px solid #1f2330; padding-bottom: 12px; }
    .field:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    .label { font-size: 11px; text-transform: uppercase; color: #708090; font-family: monospace; letter-spacing: 1px; margin-bottom: 4px; }
    .value { font-size: 16px; color: #ffffff; font-weight: 600; }
    .details { background-color: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.6; color: #b0b8c8; margin-top: 10px; }
    .footer { text-align: center; color: #708090; font-size: 12px; padding: 20px; border-top: 1px solid #1f2330; background-color: #0e1017; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 New Web Booking Request</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">👤 Customer Name</div>
        <div class="value">${clientName}</div>
      </div>
      <div class="field">
        <div class="label">🏢 Brand/Business Name</div>
        <div class="value">${businessName}</div>
      </div>
      <div class="field">
        <div class="label">📞 Contact Phone / WhatsApp</div>
        <div class="value">${clientPhone}</div>
      </div>
      <div class="field">
        <div class="label">💻 Project Type</div>
        <div class="value">${projectType || "Not specified"}</div>
      </div>
      <div class="field">
        <div class="label">💰 Estimated Budget</div>
        <div class="value">₹${budget ? Number(budget).toLocaleString() : "Not specified"}</div>
      </div>
      <div class="field">
        <div class="label">📝 Additional Project Details</div>
        <div class="details">${details ? details.replace(/\n/g, '<br>') : "None provided"}</div>
      </div>
    </div>
    <div class="footer">
      <p>Delivered securely and silently via Resend • Shoyab Khan Portfolio</p>
    </div>
  </div>
</body>
</html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Portfolio <onboarding@resend.dev>",
          to: "helpermanpov@gmail.com",
          subject: emailSubject,
          html: emailHtml
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend email delivery failed with status ${response.status}: ${errText}`);
      }

      console.log(`✅ Email successfully dispatched via Resend to helpermanpov@gmail.com for client: ${clientName}`);
      res.json({ status: "success", message: "Booking delivered securely via email." });
    } catch (error: any) {
      console.error("❌ Error sending notification via Resend:", error.message);
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  // Vite middleware or static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

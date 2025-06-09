import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/send-email", upload.single("pdfAttachment"), async (req, res) => {
  try {
    const { recipients, subject, message } = req.body;

    const recipientList = Array.isArray(recipients)
      ? recipients
      : recipients.split(",").map((email) => email.trim());

    let attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname,
        content: req.file.buffer,
        contentType: req.file.mimetype,
      });
    }

    const results = [];
    for (const recipient of recipientList) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject,
        html: message,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      results.push({ recipient, status: "success", messageId: info.messageId });

      await delay(1500);
    }

    res.status(200).json({
      success: true,
      message: "Emails sent successfully",
      details: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

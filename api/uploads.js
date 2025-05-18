import formidable from "formidable";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = formidable({ keepExtensions: true });

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileData = await fs.readFile(file[0].filepath);

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Upload failed" });
        }
        res.status(200).json({ url: result.secure_url });
      }
    );

    // Send the file buffer to Cloudinary stream
    result.end(fileData);

  } catch (err) {
    console.error("Error processing upload:", err);
    res.status(500).json({ error: "Upload failed" });
  }
}

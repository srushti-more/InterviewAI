const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const port = 5000;

// Middleware to allow cross-origin requests from your React frontend
app.use(cors());
// Middleware to parse standard JSON data (like the job description)
app.use(express.json());

// Configure Multer to store the uploaded PDF temporarily in memory
const upload = multer({ storage: multer.memoryStorage() });

// The API Route to handle the upload
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    // 1. Check if the file and job description exist
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }
    
    const jobDescription = req.body.jobDescription;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is missing' });
    }

    // 2. Extract raw text from the PDF buffer using pdf-parse
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    // 3. Log the results to the terminal to prove it works!
    console.log("✅ --- New Application Received --- ✅");
    console.log("Job Description Length:", jobDescription.length, "characters");
    console.log("Extracted Resume Text Length:", extractedText.length, "characters");
    console.log("Preview of Resume:", extractedText.substring(0, 150) + "...\n");

    // 4. Send a success message back to the React frontend
    res.status(200).json({
      message: 'Resume received and parsed successfully!',
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Failed to process the resume' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
});
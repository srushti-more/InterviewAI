require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.send('✅ InterviewAI Backend is active and listening!');
});

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });
    if (!req.body.jobDescription) return res.status(400).json({ error: 'Job description missing' });

    // Try to parse the PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    // Try to contact AI
    const prompt = `
      You are an expert technical interviewer. Review the following candidate's resume and the target job description. Generate a concise, personalized interview strategy (max 3 bullet points) and formulate the very first interview question based specifically on the candidate's past projects and skills.
      Target Job Description: ${req.body.jobDescription}
      Candidate Resume: ${extractedText}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    res.status(200).json({
      message: 'Resume analyzed successfully!',
      aiFeedback: aiResponse 
    });

  } catch (error) {
    console.error('Crash Log:', error);
    // THE MAGIC TRICK: We are sending the actual error reason straight to your React UI!
    res.status(500).json({ 
        error: `SYSTEM REPORT: ${error.message}` 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
});
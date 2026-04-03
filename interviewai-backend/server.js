require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Gemini and Multer (storing files in RAM)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// ROUTES
// ==========================================

// 1. Root / Health Check
app.get('/', (req, res) => {
  res.send('✅ InterviewAI Backend is active and listening!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running securely!' });
});

// 2. Resume Upload & AI Strategy (Phase 2)
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });
    if (!req.body.jobDescription) return res.status(400).json({ error: 'Job description missing' });

    // Parse the PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    // Prompt Gemini
    const prompt = `
      You are an expert technical interviewer. Review the following candidate's resume and the target job description. 
      
      Generate a concise, personalized interview strategy (max 3 bullet points) and formulate the very first interview question based specifically on the candidate's past projects and skills.
      
      IMPORTANT: Format your response in strict Markdown. You MUST use newlines to separate paragraphs, and you MUST put each bullet point on its own completely separate line.
      
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
    res.status(500).json({ 
        error: `SYSTEM REPORT: ${error.message}` 
    });
  }
});

// 3. Audio Processing (Phase 3 - Ready for Whisper)
// upload.single('audio') intercepts the WebM blob coming from React
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    
    console.log(`Audio received! Size: ${req.file.size} bytes`);
    
    // We will handle the Whisper transcription, Gemini logic, and ElevenLabs here next
    
    res.json({ message: "Audio received and ready for AI processing!" });

  } catch (error) {
    console.error('Audio processing error:', error);
    res.status(500).json({ error: `SYSTEM REPORT: ${error.message}` });
  }
});

// ==========================================
// SERVER START
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  
  // Verify API Keys are loaded into the environment
  if(process.env.GEMINI_API_KEY) console.log('✅ Gemini Key Loaded');
  if(process.env.OPENAI_API_KEY) console.log('✅ OpenAI Key Loaded (for Whisper)');
  if(process.env.ELEVENLABS_API_KEY) console.log('✅ ElevenLabs Key Loaded');
});
require('dotenv').config(); 

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forces Node to bypass Jio/Airtel ISP blocks
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Gemini and Multer (storing files in RAM)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// MONGODB SETUP & MODEL
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// UPDATED SCHEMA: Added suggestions and compliment
const interviewSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  jobRole: { type: String, default: 'Software Engineer' },
  score: Number,
  strengths: [String],
  weaknesses: [String],
  repeatedWords: [String],
  suggestions: [String], // Actionable things to change/avoid
  compliment: String,    // A nice closing remark
  summary: String,
  qaPairs: [{ question: String, answer: String }]
});

const Interview = mongoose.model('Interview', interviewSchema);

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
    if (!req.file || !req.body.jobDescription) return res.status(400).json({ error: 'Missing data' });
    
    // Parse the PDF
    const pdfData = await pdfParse(req.file.buffer);
    
    // Prompt Gemini
    const prompt = `You are an expert technical interviewer. Review the following resume and job description. Generate a concise interview strategy (max 3 bullet points) and formulate the very first interview question. Format response in strict Markdown.\nJob: ${req.body.jobDescription}\nResume: ${pdfData.text}`;
    
    // Using 1.5-flash to avoid 503 errors
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
  
    res.status(200).json({ 
      message: 'Success', 
      aiFeedback: result.response.text(), 
      jobRole: req.body.jobDescription.substring(0, 50) 
    });

  } catch (error) {
    console.error('Crash Log:', error);
    res.status(500).json({ error: `SYSTEM REPORT: ${error.message}` });
  }
});

// 3. Audio Processing (Phase 3 - All-in-One Gemini Loop)
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    
    console.log(`Audio received! Size: ${req.file.size} bytes`);
    console.log("Sending audio directly to Gemini...");

    // Convert the audio buffer into the base64 format Gemini expects
    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype // usually 'audio/webm' from the browser
      }
    };

    // Ask Gemini to transcribe AND evaluate all at once, returning JSON
    const prompt = `Listen to the candidate's audio. Return strict JSON: { "transcript": "candidate's words", "evaluation": "brief evaluation", "nextQuestion": "follow-up question" }`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Pass BOTH the prompt and the audio file to the model
    const result = await model.generateContent([prompt, audioPart]);
    let aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON Gemini gave us
    const parsedData = JSON.parse(aiResponseText);
    
    console.log(`Candidate said: "${parsedData.transcript}"`);

    // Send everything back to the React UI
    res.json({ 
      candidateTranscript: parsedData.transcript,
      aiResponse: `${parsedData.evaluation}\n\n${parsedData.nextQuestion}`,
      spokenQuestion: parsedData.nextQuestion 
    });

  } catch (error) {
    console.error('Audio processing error:', error);
    res.status(500).json({ error: `SYSTEM REPORT: ${error.message}` });
  }
});

// 4. ElevenLabs Text-to-Speech Route (Phase 4)
app.post('/api/generate-speech', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Using ElevenLabs default "Rachel" voice ID. You can change this in the URL.
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) throw new Error('ElevenLabs API error');

    // Convert response to buffer and send back to frontend
    const audioArrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioArrayBuffer);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Final Interview Analysis & DATABASE SAVE (Phase 5 - Strict Scorecard)
app.post('/api/analyze-interview', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript provided for analysis' });
    }

    // Convert the transcript array into a readable string for Gemini
    const conversationLog = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    // UPDATED PROMPT: Demanding deeper, more encouraging, and highly specific feedback
    const prompt = `You are a highly experienced, constructive, but strict technical interviewer and career coach. 
    Review this interview transcript and provide a deeply analytical evaluation. 
    
    Return strict JSON ONLY with exactly these keys. Do not include markdown formatting:
    { 
      "score": <number 1-100>, 
      "strengths": ["pt1", "pt2", "pt3"], 
      "weaknesses": ["pt1", "pt2", "pt3"], 
      "repeatedWords": ["word1", "word2"], 
      "suggestions": ["Actionable advice 1", "Actionable advice 2"],
      "compliment": "A genuine, encouraging compliment about their potential based on this interview.",
      "summary": "Detailed paragraph overview of the whole interview.", 
      "qaPairs": [{ "question": "q", "answer": "a" }] 
    }
    Transcript:\n${conversationLog}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    let aiResponseText = result.response.text();
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysisData = JSON.parse(aiResponseText);

    // Save to MongoDB
    const newInterview = await Interview.create(analysisData);

    // Send back to frontend
    res.json(newInterview); 

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Fetch Past Interviews for Dashboard & Progress Tracking
app.get('/api/interviews', async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ date: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SERVER START
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  
  // Verify API Keys are loaded into the environment
  if(process.env.GEMINI_API_KEY) console.log('✅ Gemini Key Loaded');
  if(process.env.ELEVENLABS_API_KEY) console.log('✅ ElevenLabs Key Loaded');
});
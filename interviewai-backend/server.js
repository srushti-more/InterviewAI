require('dotenv').config(); 

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });


// MONGODB SETUP & MODELS

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  jobRole: { type: String, default: 'Software Engineer' },
  score: Number,
  strengths: [String],
  weaknesses: [String],
  repeatedWords: [String],
  suggestions: [String], 
  compliment: String,    
  summary: String,
  qaPairs: [{ question: String, answer: String }]
});
const Interview = mongoose.model('Interview', interviewSchema);


// AUTHENTICATION MIDDLEWARE

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified; 
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};


// AUTHENTICATION ROUTES

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// INTERVIEW ROUTES

app.post('/api/upload-resume', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) return res.status(400).json({ error: 'Missing data' });
    const pdfData = await pdfParse(req.file.buffer);
    
    // FIX 1: Force JSON response to strictly separate strategy from the spoken question
    const prompt = `You are an expert technical interviewer. Review the resume and job description. 
    Return ONLY a strict JSON object with exactly these two keys. Do not use markdown wrappers.
    {
      "strategy": "Concise interview strategy max 3 bullets",
      "firstQuestion": "Hello ${req.user.name}, [your very first question here]"
    }
    Job: ${req.body.jobDescription}\nResume: ${pdfData.text}`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(aiResponseText);
  
    res.status(200).json({ 
      message: 'Success', 
      aiFeedback: parsedData.firstQuestion, // NOW ONLY SENDS THE GREETING + QUESTION!
      jobRole: req.body.jobDescription.substring(0, 50) 
    });

  } catch (error) {
    console.error('Crash Log:', error);
    res.status(500).json({ error: `SYSTEM REPORT: ${error.message}` });
  }
});

app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    const audioPart = { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } };
    const prompt = `Listen to the candidate's audio. Return strict JSON: { "transcript": "candidate's words", "evaluation": "brief evaluation", "nextQuestion": "follow-up question" }`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, audioPart]);
    let aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(aiResponseText);
    
    res.json({ candidateTranscript: parsedData.transcript, aiResponse: `${parsedData.evaluation}\n\n${parsedData.nextQuestion}`, spokenQuestion: parsedData.nextQuestion });
  } catch (error) {
    res.status(500).json({ error: `SYSTEM REPORT: ${error.message}` });
  }
});

app.post('/api/generate-speech', async (req, res) => {
  try {
    const { text } = req.body;
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: { 'Accept': 'audio/mpeg', 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
    });
    if (!response.ok) throw new Error('ElevenLabs API error');
    const audioArrayBuffer = await response.arrayBuffer();
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': Buffer.from(audioArrayBuffer).length });
    res.send(Buffer.from(audioArrayBuffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-interview', verifyToken, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || transcript.length === 0) return res.status(400).json({ error: 'No transcript provided for analysis' });

    const conversationLog = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    const prompt = `You are a highly experienced, constructive, but strictly professional technical interviewer and career coach. Review this transcript. CRITICAL GRADING RULE: If candidate provided no meaningful answers, mostly "[Processing audio...]", silence, or empty responses, give a score of 0. Return strict JSON ONLY: { "score": <number 0-100>, "strengths": ["pt1"], "weaknesses": ["pt1"], "repeatedWords": ["word1"], "suggestions": ["adv1"], "compliment": "A genuine compliment.", "summary": "Detailed overview.", "qaPairs": [{ "question": "q", "answer": "a" }] } Transcript:\n${conversationLog}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysisData = JSON.parse(aiResponseText);
    analysisData.userId = req.user.id; 
    const newInterview = await Interview.create(analysisData);

    res.json(newInterview); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews', verifyToken, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Secure Backend running on http://localhost:${PORT}`);
  if(process.env.JWT_SECRET) console.log('🔐 JWT Security Enabled');
});




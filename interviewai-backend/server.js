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
    const prompt = `
      You are an expert technical interviewer. Listen to the candidate's audio response.
      
      Return a strict JSON object with exactly these keys:
      {
        "transcript": "the exact words the candidate spoke in the audio",
        "evaluation": "your brief evaluation of their answer",
        "nextQuestion": "your relevant follow-up question"
      }
      Do not include any markdown formatting like \`\`\`json. Return ONLY the raw JSON object.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Pass BOTH the prompt and the audio file to the model
    const result = await model.generateContent([prompt, audioPart]);
    let aiResponseText = result.response.text();
    
    // Clean up response just in case Gemini includes markdown wrappers
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON Gemini gave us
    const parsedData = JSON.parse(aiResponseText);
    
    console.log(`Candidate said: "${parsedData.transcript}"`);

    // Send everything back to the React UI
    res.json({ 
      candidateTranscript: parsedData.transcript,
      // Combine the evaluation and the next question so it flows nicely in the UI text log
      aiResponse: `${parsedData.evaluation}\n\n${parsedData.nextQuestion}`,
      // NEW: Send just the question text separately so the AI voice doesn't read the evaluation out loud
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

// 5. Final Interview Analysis (Phase 5 - Strict Scorecard)
app.post('/api/analyze-interview', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript provided for analysis' });
    }

    // Convert the transcript array into a readable string for Gemini
    const conversationLog = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    const prompt = `
      You are an incredibly strict, highly experienced technical interviewer. You just finished conducting an interview.
      Review the following interview transcript and provide a brutally honest, highly critical evaluation of the candidate.
      
      Transcript:
      ${conversationLog}
      
      Return a strict JSON object with EXACTLY these keys. Do not include markdown formatting (like \`\`\`json).
      {
        "score": <number between 1-100 based on their performance>,
        "strengths": [<array of 3 short string bullet points highlighting what they did well>],
        "weaknesses": [<array of 3 short string bullet points highlighting areas for improvement>],
        "repeatedWords": [<array of words the candidate overused as filler, e.g., "like", "um", "basically">],
        "summary": "<A detailed, strict paragraph giving your honest professional opinion on their performance and whether you would hire them>",
        "qaPairs": [
           { "question": "<extract the AI's question>", "answer": "<extract the candidate's answer>" }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    let aiResponseText = result.response.text();
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysisData = JSON.parse(aiResponseText);
    res.json(analysisData);

  } catch (error) {
    console.error('Analysis error:', error);
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
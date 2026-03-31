require('dotenv').config();

async function checkMyModels() {
  console.log("🔍 Checking your specific API Key...");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("❌ ERROR: No API key found in .env file!");
    return;
  }

  try {
    // We are making a direct web request to Google, bypassing the SDK entirely
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
       console.log("\n❌ GOOGLE REJECTED THE KEY:");
       console.log(data.error.message);
       return;
    }

    console.log("\n✅ SUCCESS! Your key has access to these text models:");
    let foundModels = false;
    
    data.models.forEach(m => {
       // We only want models that support text generation (generateContent)
       if(m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
           console.log(`👉 ${m.name.replace('models/', '')}`);
           foundModels = true;
       }
    });

    if (!foundModels) {
        console.log("❌ Your key is valid, but it doesn't have access to any text models!");
    }

  } catch (err) {
    console.log("❌ Network Error:", err.message);
  }
}

checkMyModels();
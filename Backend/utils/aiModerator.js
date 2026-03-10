const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.verifyReport = async (title, description, category) => {
  try {
    // 1. Check if the key exists before trying to call the AI
    if (!process.env.GEMINI_API_KEY) {
      console.error("🚨 AI ERROR: GEMINI_API_KEY is missing or undefined!");
      return "pending"; // Graceful fallback to manual review
    }

    // 2. Initialize the AI strictly INSIDE the function so the .env is loaded
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Strict Prompt Engineering
    const prompt = `
      You are an automated content moderator for a civic incident reporting platform.
      Your job is to read the report and determine if it is spam or legitimate.
      
      Legitimate reports: Real-world events, crimes, infrastructure issues, civic complaints, or observations.
      Spam: Keyboard mashing (e.g., "asdfasdf"), obvious test data, hate speech, or completely irrelevant text.
      
      Report Title: "${title}"
      Report Category: "${category}"
      Report Description: "${description}"

      RESPOND STRICTLY WITH EXACTLY ONE WORD. 
      If it is legitimate, reply with: approved
      If it is spam, a test, or suspicious, reply with: pending
    `;

    // 4. Call the AI
    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text().trim().toLowerCase();

    console.log(`🤖 AI Moderator Analyzed: "${title}" | Decision: ${aiResponseText}`);

    // 5. Clean the output (Just in case the AI adds a period or extra spaces)
    if (aiResponseText.includes("approved")) {
      return "approved";
    } else {
      return "pending";
    }

  } catch (error) {
    // 🛑 THE SELF-HEALING CATCH: Prevents server crashes if Google is down
    console.error("🚨 AI Moderation Failed. Defaulting to manual review. Error:", error.message);
    return "pending";
  }
};
// File: backend/utils/aiModerator.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.verifyReport = async (title, description, category) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert content moderator for an anonymous incident reporting platform.
      Evaluate the following report to determine if it is a valid incident or spam/gibberish.
      
      Rules for approval:
      - It must describe a plausible incident, observation, or concern.
      - It must not be pure keyboard smash (e.g., "asdfghjkl").
      - It must not be blatant advertising or bot spam.
      
      Category: ${category}
      Title: ${title}
      Description: ${description}

      Reply with EXACTLY ONE WORD:
      If valid, reply: APPROVED
      If invalid, spam, or highly suspicious, reply: PENDING
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    // If the AI says APPROVED, return 'approved', else return 'pending'
    return text.includes("APPROVED") ? "approved" : "pending";
  } catch (error) {
    console.error("AI Moderation Error:", error);
    // Fail safe: If the AI API crashes, default to pending so nothing bad gets posted
    return "pending"; 
  }
};
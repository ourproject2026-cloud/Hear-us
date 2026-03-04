const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.verifyReport = async (title, description, category) => {
  try {
    // 🚀 FIX: Use 'gemini-1.5-flash-latest' for better stability
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      You are an expert content moderator for 'HearUs'. 
      Filter out JUNK/SPAM. Reply with EXACTLY ONE WORD: APPROVED or PENDING.
      Report: ${title} - ${description} (${category})
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    console.log(`🤖 AI Decision for "${title}": ${text}`);
    return text.includes("APPROVED") ? "approved" : "pending";

  } catch (error) {
    // 🛡️ CRITICAL: Return a fallback so the server doesn't crash
    console.error("AI Moderation Error (Server staying online):", error.message);
    return "pending"; 
  }
};
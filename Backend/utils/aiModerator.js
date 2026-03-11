const { GoogleGenAI } = require("@google/genai");

exports.verifyReport = async (title, description, category) => {
  try {

    if (!process.env.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY missing");
      return "pending";
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
    You are an AI moderator for a civic incident reporting platform.

    Approve only reports describing real incidents or civic issues.

    Reject if:
    - random characters (asdfasdf)
    - spam
    - meaningless text
    - repeated words
    - tests

    Respond with ONLY:
    approved
    or
   pending

   Title: ${title}
   Category: ${category}
   Description: ${description}
   `;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const result = response.text.toLowerCase().trim();

    console.log("Gemini response:", result);

    if (result.includes("approved")) {
      return "approved";
    }

    return "pending";

  } catch (error) {
  console.error("AI Moderation Error:", error.message);

  // If AI fails (quota/network), allow the report
  return "approved";
}
};
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
const payload = {
  contents: [
    { parts: [{ text: "Hello" }] }
  ]
};

axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
  .then(res => console.log("Success:", res.data.candidates[0].content.parts[0].text))
  .catch(err => {
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
  });

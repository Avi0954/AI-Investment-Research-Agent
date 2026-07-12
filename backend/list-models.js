import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;
axios.get(url)
  .then(res => {
    const models = res.data.models.map(m => m.name);
    console.log("Available models:", models.filter(m => m.includes('gemini')));
  })
  .catch(err => {
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
  });

const express = require('express');
const CryptoJS = require('crypto-js');
require('dotenv').config();
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(cors({
  origin: process.env.URL
}));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/message', async (req, res) => {
  const { message } = req.body;
  try {
    const bytes = CryptoJS.AES.decrypt(message, process.env.SECRET_KEY);
    if (bytes.sigBytes <= 0) {
      throw new Error("Decryption failed. Possible encoding or key mismatch."); 
    }
    const decryptedRequest = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedRequest) {
      throw new Error("Decryption resulted in empty string."); 
    }
    const model = genAI.getGenerativeModel({ model: "models/gemini-pro"});
    const result = await model.generateContent(decryptedRequest);
    const response = await result.response;
    const text = await response.text();
    const encryptedResponse = CryptoJS.AES.encrypt(text, process.env.SECRET_KEY).toString();
    res.json({ message: encryptedResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing your request');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
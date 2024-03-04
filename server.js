const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 8000;

app.post('/ollama', async (req, res) => {
    const { prompt, model } = req.body;

    try {
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: model,
            prompt: prompt,
            stream: false
        });

        res.json(ollamaResponse.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        let errorMessage = 'Internal Server Error';
        if (error.response) {
            errorMessage = error.response.data.error || errorMessage;
            res.status(error.response.status).send({ error: errorMessage });
        } else {
            res.status(500).send({ error: errorMessage });
        }
    }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

app.post('/openai/completions', async(req, res) => {
    const { prompt, model } = req.body;
    const options = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: model,
            messages: prompt
        })
    }
    try{
      const response = await fetch('https://api.openai.com/v1/chat/completions', options)
      const data = await response.json()
      res.send(data)
   } catch (error){
        console.error(error)
   }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


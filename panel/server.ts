import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/local-generate', upload.single('file'), async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({ 
        apiKey, 
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
      });

      const { prompt, model, systemInstruction, sourceText } = req.body;
      const file = req.file;

      const contents = { parts: [] as any[] };

      if (file) {
        contents.parts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        });
      } else if (sourceText) {
        contents.parts.push({ text: sourceText });
      }

      if (prompt) {
        contents.parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: model || "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || "You are an expert exam question generator.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                group: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                isFree: { type: Type.BOOLEAN },
                isPublished: { type: Type.BOOLEAN },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      questionHi: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      optionsHi: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.STRING },
                      correctAnswerHi: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      explanationHi: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      });

      let text = response.text || "[]";
      let json = [];
      try {
        json = JSON.parse(text.trim());
      } catch (e) {
        console.error("Failed to parse JSON", text);
        return res.status(500).json({ success: false, message: 'Failed to generate valid JSON' });
      }

      res.json({ success: true, data: json });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

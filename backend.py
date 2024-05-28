from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import whisper
from transformers import pipeline
import asyncio

app = FastAPI()

# Carga el modelo de transcripción de Whisper y el modelo de sentimientos de Hugging Face
model = None
sentiment_model = None

def load_models():
    global model, sentiment_model
    model = whisper.load_model("medium")
    sentiment_model = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_models)

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    contents = await file.read()
    with open("temp_audio.mp3", "wb") as f:
        f.write(contents)
    
    result = model.transcribe("temp_audio.mp3")
    transcription = result["text"]

    sentiment_result = sentiment_model(transcription)
    
    return JSONResponse(content={"text": transcription, "sentiment": sentiment_result})

# Configurar el middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

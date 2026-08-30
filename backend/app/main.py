from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Intelligent Land Record AI Engine",
    description="Microservice for Indic OCR, Computer Vision Pre-processing, and Data Extraction",
    version="1.0.0"
)

# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Land Record AI Microservice",
        "supported_languages": ["en", "hi", "te", "ta", "mr"]
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.reconstruction import router as reconstruction_router
from routes.room_design_engine import router as interior_design_router

app = FastAPI(
    title="EDVR AI 3D Reconstruction API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(reconstruction_router, prefix="/api")
app.include_router(interior_design_router, prefix="/api")


@app.get("/")
def home():
    return {
        "success": True,
        "message": "EDVR 3D Backend Running",
        "photo_policy": {
            "minimum": 2,
            "maximum": None,
            "note": "Unlimited photos; server resources and request-size limits still apply.",
        },
    }

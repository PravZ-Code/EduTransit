"""
Main FastAPI Application Entrypoint for EduTransit.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import router
from app.services.simulation_service import simulation_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch realistic simulation service
    print("[+] Initializing EduTransit Fleet Simulation Service...")
    await simulation_service.start()
    yield
    # Shutdown: Clean up simulation
    print("[-] Shutting down Fleet Simulation Service...")
    simulation_service.stop()

app = FastAPI(
    title="EduTransit Core Telematics API",
    description="Unified Intelligent Educational Transport Management Platform (100% Software / Zero-Hardware)",
    version="2026.1",
    lifespan=lifespan
)

# Enable permissive CORS for development (Next.js web & Flutter mobile)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "Welcome to EduTransit API Gateway",
        "docs_url": "/docs",
        "version": "2026.1",
        "system_status": "OPERATIONAL"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

"""
Nexla SDK Backend - FastAPI server bridging React frontend with Nexla Python SDK.
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from parent directory's .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="Nexla SDK Backend", version="1.0.0")

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Nexla backend is running"}


@app.post("/api/nexla/connect")
def connect_to_nexla():
    """
    Initialize and connect to Nexla using the SDK.
    Requires NEXLA_SERVICE_KEY or NEXLA_ACCESS_TOKEN in environment.
    """
    try:
        from nexla_sdk import NexlaClient
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Nexla SDK not installed. Run: pip install nexla-sdk",
        )

    service_key = os.getenv("NEXLA_SERVICE_KEY")
    access_token = os.getenv("NEXLA_ACCESS_TOKEN")

    if not service_key and not access_token:
        raise HTTPException(
            status_code=400,
            detail="Missing authentication. Set NEXLA_SERVICE_KEY or NEXLA_ACCESS_TOKEN in .env file.",
        )

    try:
        if service_key:
            client = NexlaClient(service_key=service_key)
        else:
            client = NexlaClient(access_token=access_token)

        # Attempt to get access token to verify connection
        token = client.get_access_token()
        return {
            "status": "connected",
            "message": "Successfully connected to Nexla",
            "token_preview": f"{token[:10]}..." if token and len(token) > 10 else "***",
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to connect to Nexla: {str(e)}")


@app.get("/api/nexla/nexsets")
def list_nexsets():
    """
    List Nexsets (datasets) from Nexla.
    """
    try:
        from nexla_sdk import NexlaClient
    except ImportError:
        raise HTTPException(status_code=500, detail="Nexla SDK not installed")

    service_key = os.getenv("NEXLA_SERVICE_KEY")
    access_token = os.getenv("NEXLA_ACCESS_TOKEN")

    if not service_key and not access_token:
        raise HTTPException(status_code=400, detail="Missing credentials")

    try:
        if service_key:
            client = NexlaClient(service_key=service_key)
        else:
            client = NexlaClient(access_token=access_token)

        nexsets = client.nexsets.list()
        # Convert objects to dicts for JSON response
        return [
            {
                "id": n.id,
                "name": n.name,
                "description": n.description,
                "status": n.status
            } for n in nexsets
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

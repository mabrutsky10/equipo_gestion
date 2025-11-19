import uvicorn
import logging
from app.presentation.api.main import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    uvicorn.run(
        "app.presentation.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )





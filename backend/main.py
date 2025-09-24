from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, entity_v1
from db.database import create_db_and_tables, SessionLocal
from db.models import Role, User as DBUser # Import models for initial setup

# ------------------------------------------------------------
# 1. INITIAL DATABASE SETUP (Run once, then comment out or remove)
# ------------------------------------------------------------
create_db_and_tables()

# Add default roles if they don't exist
db = SessionLocal()
try:
    if db.query(Role).filter(Role.name == "user").first() is None:
        db.add(Role(name="user"))
        print("Default 'user' role created.")
    if db.query(Role).filter(Role.name == "admin").first() is None:
        db.add(Role(name="admin"))
        print("Default 'admin' role created.")
    db.commit()
finally:
    db.close()
# ------------------------------------------------------------

# 2. FASTAPI APPLICATION INSTANCE
app = FastAPI(
    title="Backend Developer Internship API",
    description="Scalable REST API with Authentication & Role-Based Access.",
    version="1.0.0",
)

# 3. CORS MIDDLEWARE (Crucial for connecting Vanilla JS frontend)
# The frontend will run on a different port (e.g., file:// or port 8000), 
# so the backend must allow connections from it.
origins = [
    # Keep the originals
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",

    # ADD THESE SPECIFIC ORIGINS TO COVER YOUR FRONTEND SERVER:
    "http://127.0.0.1:5500",  # Your frontend's current host/port
    "http://localhost:5500",  # A common alias
    "null"  # For file:// access if you stopped using the 5500 server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. INCLUDE ROUTERS
app.include_router(auth.router)
app.include_router(entity_v1.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "API is running. Check /docs for Swagger UI documentation."}
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base
from config import SQLALCHEMY_DATABASE_URL
from typing import Generator

# Create the SQLAlchemy engine for MySQL
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# Define the session local class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    """Initializes the database and creates all tables."""
    # NOTE: In a real app, you would use Alembic/migrations after the initial setup.
    Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db() -> Generator:
    """Provides a database session for a single request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
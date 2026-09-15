"""
Database configuration and session management.

Uses SQLite by default for development simplicity, but supports PostgreSQL.
"""

from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os

from app.core.config import settings


# Create engine based on database URL
engine = create_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)


def create_db_and_tables() -> None:
    """Create all database tables."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session generator for dependency injection."""
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()

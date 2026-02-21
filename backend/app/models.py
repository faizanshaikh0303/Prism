from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    songs = relationship("Song", back_populates="user", cascade="all, delete-orphan")


class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=True)
    original_path = Column(String, nullable=True)
    # pending | processing | complete | error
    status = Column(String, default="pending", nullable=False)
    error_message = Column(String, nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="songs")
    stems = relationship("Stem", back_populates="song", cascade="all, delete-orphan")


class Stem(Base):
    __tablename__ = "stems"

    id = Column(Integer, primary_key=True, index=True)
    song_id = Column(Integer, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)
    # vocals | drums | bass | guitar | piano | other
    stem_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    song = relationship("Song", back_populates="stems")

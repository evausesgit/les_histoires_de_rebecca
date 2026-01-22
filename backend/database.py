import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Déterminer le chemin de la base de données
if os.environ.get("VERCEL"):
    # Vercel: utiliser /tmp (seul dossier writable)
    DATABASE_URL = "sqlite:////tmp/histoires.db"
elif os.environ.get("DATABASE_PATH"):
    # Coolify/Docker: utiliser le chemin configuré
    DATABASE_URL = f"sqlite:///{os.environ.get('DATABASE_PATH')}"
elif os.path.exists("/app/data"):
    # Coolify/Docker: dossier data monté
    DATABASE_URL = "sqlite:////app/data/histoires.db"
else:
    # Développement local
    DATABASE_URL = "sqlite:///./histoires.db"

print(f"Database URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

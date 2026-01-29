from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Style(Base):
    __tablename__ = "styles"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    est_predefini = Column(Boolean, default=False)
    date_creation = Column(DateTime, default=datetime.utcnow)

    livres = relationship("Livre", back_populates="style_rel")


class Livre(Base):
    __tablename__ = "livres"

    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    style_id = Column(Integer, ForeignKey("styles.id"), nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

    style_rel = relationship("Style", back_populates="livres")
    chapitres = relationship("Chapitre", back_populates="livre", cascade="all, delete-orphan")


class Chapitre(Base):
    __tablename__ = "chapitres"

    id = Column(Integer, primary_key=True, index=True)
    livre_id = Column(Integer, ForeignKey("livres.id"), nullable=False)
    titre = Column(String(255), nullable=False)
    ordre = Column(Integer, default=1)
    date_creation = Column(DateTime, default=datetime.utcnow)

    livre = relationship("Livre", back_populates="chapitres")
    contenus = relationship("Contenu", back_populates="chapitre", cascade="all, delete-orphan")


class Contenu(Base):
    __tablename__ = "contenus"

    id = Column(Integer, primary_key=True, index=True)
    chapitre_id = Column(Integer, ForeignKey("chapitres.id"), nullable=False)
    texte_utilisateur = Column(Text, nullable=True)
    texte_genere = Column(Text, nullable=True)
    resume = Column(Text, nullable=True)  # Résumé "Idée" auto-généré
    niveau_strictesse = Column(String(20), nullable=True)  # libre, modere, strict
    date_creation = Column(DateTime, default=datetime.utcnow)

    chapitre = relationship("Chapitre", back_populates="contenus")

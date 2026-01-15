from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
from models import Livre, Chapitre, Contenu
from schemas import (
    LivreCreate, LivreResponse,
    ChapitreCreate, ChapitreResponse,
    ContenuCreate, ContenuResponse,
    GenerationRequest, GenerationResponse
)
from claude_service import generer_histoire

# Création des tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Les Histoires de Rebecca",
    description="API pour créer et générer des histoires magiques pour Rebecca"
)

# CORS pour permettre au frontend de communiquer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== LIVRES ====================

@app.get("/livres", response_model=List[LivreResponse])
def lister_livres(db: Session = Depends(get_db)):
    """Liste tous les livres"""
    return db.query(Livre).all()


@app.post("/livres", response_model=LivreResponse)
def creer_livre(livre: LivreCreate, db: Session = Depends(get_db)):
    """Crée un nouveau livre"""
    db_livre = Livre(**livre.model_dump())
    db.add(db_livre)
    db.commit()
    db.refresh(db_livre)
    return db_livre


@app.get("/livres/{livre_id}", response_model=LivreResponse)
def obtenir_livre(livre_id: int, db: Session = Depends(get_db)):
    """Obtient un livre par son ID"""
    livre = db.query(Livre).filter(Livre.id == livre_id).first()
    if not livre:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    return livre


@app.delete("/livres/{livre_id}")
def supprimer_livre(livre_id: int, db: Session = Depends(get_db)):
    """Supprime un livre et tous ses chapitres"""
    livre = db.query(Livre).filter(Livre.id == livre_id).first()
    if not livre:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    db.delete(livre)
    db.commit()
    return {"message": "Livre supprimé"}


# ==================== CHAPITRES ====================

@app.get("/livres/{livre_id}/chapitres", response_model=List[ChapitreResponse])
def lister_chapitres(livre_id: int, db: Session = Depends(get_db)):
    """Liste tous les chapitres d'un livre"""
    return db.query(Chapitre).filter(Chapitre.livre_id == livre_id).order_by(Chapitre.ordre).all()


@app.post("/livres/{livre_id}/chapitres", response_model=ChapitreResponse)
def creer_chapitre(livre_id: int, chapitre: ChapitreCreate, db: Session = Depends(get_db)):
    """Crée un nouveau chapitre dans un livre"""
    livre = db.query(Livre).filter(Livre.id == livre_id).first()
    if not livre:
        raise HTTPException(status_code=404, detail="Livre non trouvé")

    db_chapitre = Chapitre(livre_id=livre_id, **chapitre.model_dump())
    db.add(db_chapitre)
    db.commit()
    db.refresh(db_chapitre)
    return db_chapitre


@app.delete("/chapitres/{chapitre_id}")
def supprimer_chapitre(chapitre_id: int, db: Session = Depends(get_db)):
    """Supprime un chapitre"""
    chapitre = db.query(Chapitre).filter(Chapitre.id == chapitre_id).first()
    if not chapitre:
        raise HTTPException(status_code=404, detail="Chapitre non trouvé")
    db.delete(chapitre)
    db.commit()
    return {"message": "Chapitre supprimé"}


# ==================== CONTENUS ====================

@app.get("/chapitres/{chapitre_id}/contenus", response_model=List[ContenuResponse])
def lister_contenus(chapitre_id: int, db: Session = Depends(get_db)):
    """Liste tous les contenus d'un chapitre"""
    return db.query(Contenu).filter(Contenu.chapitre_id == chapitre_id).all()


@app.post("/chapitres/{chapitre_id}/contenus", response_model=ContenuResponse)
def creer_contenu(chapitre_id: int, contenu: ContenuCreate, db: Session = Depends(get_db)):
    """Crée un nouveau contenu dans un chapitre"""
    chapitre = db.query(Chapitre).filter(Chapitre.id == chapitre_id).first()
    if not chapitre:
        raise HTTPException(status_code=404, detail="Chapitre non trouvé")

    db_contenu = Contenu(chapitre_id=chapitre_id, **contenu.model_dump())
    db.add(db_contenu)
    db.commit()
    db.refresh(db_contenu)
    return db_contenu


# ==================== GÉNÉRATION ====================

@app.post("/chapitres/{chapitre_id}/generer", response_model=ContenuResponse)
def generer_contenu(chapitre_id: int, request: GenerationRequest, db: Session = Depends(get_db)):
    """Génère une histoire avec Claude et la sauvegarde dans le chapitre"""
    chapitre = db.query(Chapitre).filter(Chapitre.id == chapitre_id).first()
    if not chapitre:
        raise HTTPException(status_code=404, detail="Chapitre non trouvé")

    try:
        texte_genere = generer_histoire(request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    db_contenu = Contenu(
        chapitre_id=chapitre_id,
        texte_utilisateur=request.prompt,
        texte_genere=texte_genere
    )
    db.add(db_contenu)
    db.commit()
    db.refresh(db_contenu)
    return db_contenu


@app.post("/generer-preview", response_model=GenerationResponse)
def generer_preview(request: GenerationRequest):
    """Génère une histoire sans la sauvegarder (prévisualisation)"""
    try:
        texte_genere = generer_histoire(request.prompt)
        return GenerationResponse(texte_genere=texte_genere)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROOT ====================

@app.get("/")
def root():
    return {"message": "Bienvenue dans Les Histoires de Rebecca!"}

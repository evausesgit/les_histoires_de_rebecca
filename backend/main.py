from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
import os

from sqlalchemy import text
from database import engine, get_db, Base
from models import Livre, Chapitre, Contenu, Style, Utilisateur


def migrer_base():
    """Ajoute les colonnes manquantes à la base de données"""
    with engine.connect() as conn:
        # Vérifier et ajouter les colonnes manquantes à la table contenus
        try:
            conn.execute(text("SELECT resume FROM contenus LIMIT 1"))
        except:
            conn.execute(text("ALTER TABLE contenus ADD COLUMN resume TEXT"))
            conn.commit()

        try:
            conn.execute(text("SELECT niveau_strictesse FROM contenus LIMIT 1"))
        except:
            conn.execute(text("ALTER TABLE contenus ADD COLUMN niveau_strictesse VARCHAR(20)"))
            conn.commit()

        try:
            conn.execute(text("SELECT types_faits FROM contenus LIMIT 1"))
        except:
            conn.execute(text("ALTER TABLE contenus ADD COLUMN types_faits VARCHAR(200)"))
            conn.commit()
from schemas import (
    LivreCreate, LivreResponse,
    ChapitreCreate, ChapitreResponse,
    ContenuCreate, ContenuResponse,
    GenerationRequest, GenerationResponse,
    StyleCreate, StyleResponse,
    GoogleLoginRequest, TokenResponse, UtilisateurResponse, RoleUpdateRequest
)
from claude_service import generer_histoire
from auth import (
    verifier_google_token, creer_jwt,
    require_ecrivain, require_admin
)

# Création des tables
Base.metadata.create_all(bind=engine)

# Styles prédéfinis
STYLES_PREDEFINIS = [
    {"nom": "Narratif", "description": "Un style narratif classique, fluide et immersif"},
    {"nom": "Poetique", "description": "Un style poetique et lyrique, avec des metaphores"},
    {"nom": "Suspense", "description": "Un style thriller/suspense, avec du rythme et de la tension"},
    {"nom": "Jeunesse", "description": "Un style adapte aux enfants et adolescents"},
    {"nom": "Fantastique", "description": "Un style fantastique/fantasy, atmosphere magique"},
    {"nom": "Humoristique", "description": "Un style humoristique et leger"},
    {"nom": "Historique", "description": "Un style historique avec attention aux details d'epoque"},
    {"nom": "Contemporain", "description": "Un style moderne et realiste"},
]


def initialiser_styles(db: Session):
    """Initialise les styles prédéfinis s'ils n'existent pas"""
    for style_data in STYLES_PREDEFINIS:
        existing = db.query(Style).filter(Style.nom == style_data["nom"]).first()
        if not existing:
            style = Style(
                nom=style_data["nom"],
                description=style_data["description"],
                est_predefini=True
            )
            db.add(style)
    db.commit()

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


# Initialisation au démarrage
@app.on_event("startup")
def startup_event():
    # Migration de la base de données
    migrer_base()

    # Initialisation des styles
    from database import SessionLocal
    db = SessionLocal()
    try:
        initialiser_styles(db)
    finally:
        db.close()


# ==================== AUTHENTIFICATION ====================

@app.post("/auth/google", response_model=TokenResponse)
def login_google(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authentification via Google. Le premier utilisateur devient admin."""
    google_info = verifier_google_token(request.token)

    # Chercher ou créer l'utilisateur
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.google_id == google_info["google_id"]
    ).first()

    if not utilisateur:
        # Premier utilisateur = admin
        nb_utilisateurs = db.query(Utilisateur).count()
        role = "admin" if nb_utilisateurs == 0 else "lecteur"

        utilisateur = Utilisateur(
            email=google_info["email"],
            nom=google_info["nom"],
            photo_url=google_info["photo_url"],
            google_id=google_info["google_id"],
            role=role,
        )
        db.add(utilisateur)
        db.commit()
        db.refresh(utilisateur)
    else:
        # Mettre à jour les infos Google
        utilisateur.nom = google_info["nom"]
        utilisateur.photo_url = google_info["photo_url"]
        db.commit()
        db.refresh(utilisateur)

    token = creer_jwt(utilisateur.id)
    return TokenResponse(
        access_token=token,
        utilisateur=UtilisateurResponse.model_validate(utilisateur),
    )


@app.get("/auth/me", response_model=UtilisateurResponse)
def get_me(utilisateur: Utilisateur = Depends(require_ecrivain)):
    """Retourne l'utilisateur courant (nécessite au moins écrivain)."""
    return utilisateur


# ==================== ADMIN ====================

@app.get("/admin/utilisateurs", response_model=List[UtilisateurResponse])
def lister_utilisateurs(
    admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Liste tous les utilisateurs (admin uniquement)."""
    return db.query(Utilisateur).order_by(Utilisateur.date_creation).all()


@app.put("/admin/utilisateurs/{utilisateur_id}/role")
def modifier_role(
    utilisateur_id: int,
    request: RoleUpdateRequest,
    admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Modifie le rôle d'un utilisateur (admin uniquement)."""
    if request.role not in ("lecteur", "ecrivain", "admin"):
        raise HTTPException(status_code=400, detail="Role invalide")

    utilisateur = db.query(Utilisateur).filter(Utilisateur.id == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    utilisateur.role = request.role
    db.commit()
    db.refresh(utilisateur)
    return UtilisateurResponse.model_validate(utilisateur)


# ==================== STYLES ====================

@app.get("/styles", response_model=List[StyleResponse])
def lister_styles(db: Session = Depends(get_db)):
    """Liste tous les styles disponibles"""
    return db.query(Style).order_by(Style.est_predefini.desc(), Style.nom).all()


@app.post("/styles", response_model=StyleResponse)
def creer_style(
    style: StyleCreate,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Crée un nouveau style personnalisé"""
    existing = db.query(Style).filter(Style.nom == style.nom).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un style avec ce nom existe déjà")

    db_style = Style(**style.model_dump(), est_predefini=False)
    db.add(db_style)
    db.commit()
    db.refresh(db_style)
    return db_style


@app.delete("/styles/{style_id}")
def supprimer_style(
    style_id: int,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Supprime un style personnalisé (les prédéfinis ne peuvent pas être supprimés)"""
    style = db.query(Style).filter(Style.id == style_id).first()
    if not style:
        raise HTTPException(status_code=404, detail="Style non trouvé")
    if style.est_predefini:
        raise HTTPException(status_code=400, detail="Les styles prédéfinis ne peuvent pas être supprimés")

    # Mettre à null le style_id des livres qui utilisent ce style
    db.query(Livre).filter(Livre.style_id == style_id).update({"style_id": None})
    db.delete(style)
    db.commit()
    return {"message": "Style supprimé"}


# ==================== LIVRES ====================

@app.get("/livres", response_model=List[LivreResponse])
def lister_livres(db: Session = Depends(get_db)):
    """Liste tous les livres"""
    livres = db.query(Livre).options(joinedload(Livre.style_rel)).all()
    # Convertir style_rel en style pour la réponse
    for livre in livres:
        livre.style = livre.style_rel
    return livres


@app.post("/livres", response_model=LivreResponse)
def creer_livre(
    livre: LivreCreate,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Crée un nouveau livre"""
    if livre.style_id:
        style = db.query(Style).filter(Style.id == livre.style_id).first()
        if not style:
            raise HTTPException(status_code=404, detail="Style non trouvé")

    db_livre = Livre(**livre.model_dump())
    db.add(db_livre)
    db.commit()
    db.refresh(db_livre)
    # Charger le style pour la réponse
    if db_livre.style_id:
        db_livre.style = db.query(Style).filter(Style.id == db_livre.style_id).first()
    return db_livre


@app.get("/livres/{livre_id}", response_model=LivreResponse)
def obtenir_livre(livre_id: int, db: Session = Depends(get_db)):
    """Obtient un livre par son ID"""
    livre = db.query(Livre).options(joinedload(Livre.style_rel)).filter(Livre.id == livre_id).first()
    if not livre:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    livre.style = livre.style_rel
    return livre


@app.delete("/livres/{livre_id}")
def supprimer_livre(
    livre_id: int,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
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
def creer_chapitre(
    livre_id: int,
    chapitre: ChapitreCreate,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
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
def supprimer_chapitre(
    chapitre_id: int,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
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
def creer_contenu(
    chapitre_id: int,
    contenu: ContenuCreate,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Crée un nouveau contenu dans un chapitre"""
    chapitre = db.query(Chapitre).filter(Chapitre.id == chapitre_id).first()
    if not chapitre:
        raise HTTPException(status_code=404, detail="Chapitre non trouvé")

    db_contenu = Contenu(chapitre_id=chapitre_id, **contenu.model_dump())
    db.add(db_contenu)
    db.commit()
    db.refresh(db_contenu)
    return db_contenu


@app.delete("/contenus/{contenu_id}")
def supprimer_contenu(
    contenu_id: int,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Supprime un contenu"""
    contenu = db.query(Contenu).filter(Contenu.id == contenu_id).first()
    if not contenu:
        raise HTTPException(status_code=404, detail="Contenu non trouvé")
    db.delete(contenu)
    db.commit()
    return {"message": "Contenu supprimé"}


# ==================== GÉNÉRATION ====================

@app.post("/chapitres/{chapitre_id}/generer", response_model=ContenuResponse)
def generer_contenu(
    chapitre_id: int,
    request: GenerationRequest,
    _user: Utilisateur = Depends(require_ecrivain),
    db: Session = Depends(get_db),
):
    """Génère une histoire avec Claude et la sauvegarde dans le chapitre"""
    chapitre = db.query(Chapitre).filter(Chapitre.id == chapitre_id).first()
    if not chapitre:
        raise HTTPException(status_code=404, detail="Chapitre non trouvé")

    # Récupérer le style du livre associé
    livre = db.query(Livre).options(joinedload(Livre.style_rel)).filter(Livre.id == chapitre.livre_id).first()
    style_description = None
    if livre and livre.style_rel:
        style_description = livre.style_rel.description

    # Récupérer les chapitres précédents pour le contexte
    chapitres_precedents = db.query(Chapitre).filter(
        Chapitre.livre_id == chapitre.livre_id,
        Chapitre.ordre < chapitre.ordre
    ).order_by(Chapitre.ordre).all()

    # Construire le contexte des chapitres précédents
    contexte_precedent = []
    for chap in chapitres_precedents:
        contenus = db.query(Contenu).filter(Contenu.chapitre_id == chap.id).all()
        textes = [c.texte_genere for c in contenus if c.texte_genere]
        if textes:
            contexte_precedent.append({
                "titre": chap.titre,
                "contenu": "\n\n".join(textes)
            })

    try:
        resultat = generer_histoire(
            request.prompt,
            style_description,
            contexte_precedent,
            request.niveau_strictesse or "modere",
            request.types_faits or []
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    db_contenu = Contenu(
        chapitre_id=chapitre_id,
        texte_utilisateur=request.prompt,
        texte_genere=resultat["texte"],
        resume=resultat["resume"],
        niveau_strictesse=request.niveau_strictesse or "modere",
        types_faits=",".join(request.types_faits) if request.types_faits else None
    )
    db.add(db_contenu)
    db.commit()
    db.refresh(db_contenu)
    return db_contenu


@app.post("/generer-preview", response_model=GenerationResponse)
def generer_preview(
    request: GenerationRequest,
    _user: Utilisateur = Depends(require_ecrivain),
):
    """Génère une histoire sans la sauvegarder (prévisualisation)"""
    try:
        texte_genere = generer_histoire(request.prompt)
        return GenerationResponse(texte_genere=texte_genere)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROOT ====================

# Chemin vers les fichiers statiques du frontend
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Servir les fichiers statiques du frontend si le dossier existe
if os.path.exists(STATIC_DIR):
    # Monter les assets statiques
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{path:path}")
    def serve_frontend_routes(path: str):
        # Pour le SPA routing - renvoyer index.html pour les routes non-API
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Bienvenue dans Les Histoires de Rebecca!"}

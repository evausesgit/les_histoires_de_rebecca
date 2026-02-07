from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Style schemas
class StyleBase(BaseModel):
    nom: str
    description: str


class StyleCreate(StyleBase):
    pass


class StyleResponse(StyleBase):
    id: int
    est_predefini: bool
    date_creation: datetime

    class Config:
        from_attributes = True


# Livre schemas
class LivreBase(BaseModel):
    titre: str
    description: Optional[str] = None
    style_id: Optional[int] = None


class LivreCreate(LivreBase):
    pass


class LivreResponse(LivreBase):
    id: int
    date_creation: datetime
    style: Optional[StyleResponse] = None

    class Config:
        from_attributes = True


# Chapitre schemas
class ChapitreBase(BaseModel):
    titre: str
    ordre: Optional[int] = 1


class ChapitreCreate(ChapitreBase):
    pass


class ChapitreResponse(ChapitreBase):
    id: int
    livre_id: int
    date_creation: datetime

    class Config:
        from_attributes = True


# Contenu schemas
class ContenuBase(BaseModel):
    texte_utilisateur: Optional[str] = None


class ContenuCreate(ContenuBase):
    pass


class ContenuResponse(ContenuBase):
    id: int
    chapitre_id: int
    texte_genere: Optional[str] = None
    resume: Optional[str] = None
    niveau_strictesse: Optional[str] = None
    types_faits: Optional[str] = None
    date_creation: datetime

    class Config:
        from_attributes = True


# Schema pour la génération de texte
class GenerationRequest(BaseModel):
    prompt: str
    niveau_strictesse: Optional[str] = "modere"  # libre, modere, strict
    types_faits: Optional[list[str]] = []  # historique, imaginaire, effrayant, intrigant, drole


class GenerationResponse(BaseModel):
    texte_genere: str
    resume: Optional[str] = None


# Auth schemas
class GoogleLoginRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    utilisateur: "UtilisateurResponse"


class UtilisateurResponse(BaseModel):
    id: int
    email: str
    nom: str
    photo_url: Optional[str] = None
    role: str
    date_creation: datetime

    class Config:
        from_attributes = True


class RoleUpdateRequest(BaseModel):
    role: str

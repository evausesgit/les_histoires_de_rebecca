from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Livre schemas
class LivreBase(BaseModel):
    titre: str
    description: Optional[str] = None


class LivreCreate(LivreBase):
    pass


class LivreResponse(LivreBase):
    id: int
    date_creation: datetime

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
    date_creation: datetime

    class Config:
        from_attributes = True


# Schema pour la génération de texte
class GenerationRequest(BaseModel):
    prompt: str


class GenerationResponse(BaseModel):
    texte_genere: str

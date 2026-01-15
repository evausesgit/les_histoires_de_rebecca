import subprocess
import shlex
from typing import Optional


def generer_histoire(prompt: str, style: Optional[str] = None) -> str:
    """
    Appelle Claude CLI pour générer une histoire pour enfant.

    Args:
        prompt: Le thème ou l'idée de l'histoire fourni par l'utilisateur
        style: La description du style d'écriture à utiliser (optionnel)

    Returns:
        Le texte généré par Claude
    """

    style_instruction = ""
    if style:
        style_instruction = f"\n- Avec {style}"

    prompt_complet = f"""Tu es un auteur de roman.

Génère un chapitre de livre inspiré du thème suivant :
{prompt}

Contraintes du chapitre :
- Respecte ce style d’écriture : {style_instruction}
- Longueur : environ 900 à 1600 mots
- Le chapitre doit raconter une histoire complète avec :
  1) Une scène d’ouverture immersive (lieu + ambiance + action)
  2) Un objectif ou un problème clair pour le personnage principal
  3) Un élément déclencheur (événement, rencontre, découverte)
  4) Une progression avec 2 à 4 événements importants
  5) Une tension légère ou un obstacle (adapté au ton du récit)
  6) Une résolution partielle (tout n’est pas forcément terminé)
  7) Une fin qui donne envie de lire la suite (mini cliffhanger)

Règles d’écriture :
- Écris directement le chapitre, sans introduction ni commentaire.
- Utilise un rythme fluide : narration + dialogues + descriptions équilibrés
- Reste cohérent : personnages, lieux, ton, époque, logique interne

Écris maintenant le chapitre."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt_complet],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            raise Exception(f"Erreur Claude CLI: {result.stderr}")

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        raise Exception("La génération a pris trop de temps")
    except FileNotFoundError:
        raise Exception("Claude CLI n'est pas installé ou accessible")

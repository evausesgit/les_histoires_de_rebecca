import subprocess
import shlex
import os
import logging
from typing import Optional

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def generer_histoire(prompt: str, style: Optional[str] = None) -> str:
    """
    Appelle Claude CLI pour générer une histoire pour enfant.

    Args:
        prompt: Le thème ou l'idée de l'histoire fourni par l'utilisateur
        style: La description du style d'écriture à utiliser (optionnel)

    Returns:
        Le texte généré par Claude
    """

    # DEBUG: Afficher les infos d'environnement
    logger.debug("=" * 50)
    logger.debug("DEBUG CLAUDE SERVICE")
    logger.debug("=" * 50)
    logger.debug(f"HOME: {os.environ.get('HOME', 'NOT SET')}")
    logger.debug(f"USER: {os.environ.get('USER', 'NOT SET')}")
    logger.debug(f"ANTHROPIC_API_KEY: {'SET' if os.environ.get('ANTHROPIC_API_KEY') else 'NOT SET'}")

    # Vérifier si le dossier .claude existe
    home = os.environ.get('HOME', '/root')
    claude_dir = os.path.join(home, '.claude')
    logger.debug(f"Claude config dir: {claude_dir}")
    logger.debug(f"Claude config dir exists: {os.path.exists(claude_dir)}")

    if os.path.exists(claude_dir):
        logger.debug(f"Contenu de {claude_dir}: {os.listdir(claude_dir)}")

    # Vérifier où est installé claude
    which_result = subprocess.run(["which", "claude"], capture_output=True, text=True)
    logger.debug(f"which claude: {which_result.stdout.strip()}")
    logger.debug(f"which claude stderr: {which_result.stderr.strip()}")

    # Vérifier la version de claude
    version_result = subprocess.run(["claude", "--version"], capture_output=True, text=True)
    logger.debug(f"claude --version: {version_result.stdout.strip()}")
    logger.debug(f"claude --version stderr: {version_result.stderr.strip()}")

    style_instruction = ""
    if style:
        style_instruction = f"\n- Avec {style}"

    prompt_complet = f"""Tu es un auteur de roman.

Génère un chapitre de livre inspiré du thème suivant :
{prompt}

Contraintes du chapitre :
- Respecte ce style d'écriture : {style_instruction}
- Longueur : environ 900 à 1600 mots
- Le chapitre doit raconter une histoire complète avec :
  1) Une scène d'ouverture immersive (lieu + ambiance + action)
  2) Un objectif ou un problème clair pour le personnage principal
  3) Un élément déclencheur (événement, rencontre, découverte)
  4) Une progression avec 2 à 4 événements importants
  5) Une tension légère ou un obstacle (adapté au ton du récit)
  6) Une résolution partielle (tout n'est pas forcément terminé)
  7) Une fin qui donne envie de lire la suite (mini cliffhanger)

Règles d'écriture :
- Écris directement le chapitre, sans introduction ni commentaire.
- Utilise un rythme fluide : narration + dialogues + descriptions équilibrés
- Reste cohérent : personnages, lieux, ton, époque, logique interne

Écris maintenant le chapitre."""

    try:
        logger.debug("Lancement de la commande claude...")
        logger.debug(f"Prompt length: {len(prompt_complet)} chars")

        result = subprocess.run(
            ["claude", "-p", prompt_complet],
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ}  # Passer toutes les variables d'environnement
        )

        logger.debug(f"Return code: {result.returncode}")
        logger.debug(f"STDOUT length: {len(result.stdout)} chars")
        logger.debug(f"STDOUT (first 500): {result.stdout[:500]}")
        logger.debug(f"STDERR: {result.stderr}")

        if result.returncode != 0:
            logger.error(f"Claude CLI error: {result.stderr}")
            raise Exception(f"Erreur Claude CLI: {result.stderr}")

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        logger.error("Timeout expired")
        raise Exception("La génération a pris trop de temps")
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {e}")
        raise Exception("Claude CLI n'est pas installé ou accessible")
    except Exception as e:
        logger.error(f"Exception: {e}")
        raise

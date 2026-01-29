import subprocess
import os
import logging
from typing import Optional, List, Dict

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def generer_histoire(prompt: str, style: Optional[str] = None, chapitres_precedents: Optional[List[Dict]] = None, niveau_strictesse: str = "modere") -> Dict[str, str]:
    """
    Appelle Claude CLI pour générer une histoire pour enfant.

    Args:
        prompt: Le thème ou l'idée de l'histoire fourni par l'utilisateur
        style: La description du style d'écriture à utiliser (optionnel)
        chapitres_precedents: Liste des chapitres précédents avec leur titre et contenu (optionnel)
        niveau_strictesse: Niveau de fidélité à la description (libre, modere, strict)

    Returns:
        Dict avec 'texte' (le chapitre) et 'resume' (le résumé des éléments ajoutés)
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

    # Construire l'instruction de style
    style_instruction = ""
    if style:
        style_instruction = f"\n- Style d'écriture : {style}"

    # Construire le contexte des chapitres précédents
    contexte_histoire = ""
    if chapitres_precedents and len(chapitres_precedents) > 0:
        logger.debug(f"Nombre de chapitres précédents: {len(chapitres_precedents)}")
        contexte_histoire = "\n\n=== CHAPITRES PRÉCÉDENTS (pour cohérence) ===\n"
        for chap in chapitres_precedents:
            contexte_histoire += f"\n--- {chap['titre']} ---\n{chap['contenu']}\n"
        contexte_histoire += "\n=== FIN DES CHAPITRES PRÉCÉDENTS ===\n"

    # Instructions selon le niveau de strictesse
    if niveau_strictesse == "libre":
        strictesse_instruction = """
LIBERTÉ CRÉATIVE :
- Tu peux ajouter librement de nouveaux personnages secondaires si cela enrichit l'histoire
- Tu peux inventer des lieux, des détails et des sous-intrigues
- La description sert de point de départ, tu peux l'enrichir créativement
- Laisse libre cours à ton imagination tout en gardant une cohérence narrative"""
    elif niveau_strictesse == "strict":
        strictesse_instruction = """
STRICTESSE MAXIMALE :
- Suis UNIQUEMENT et EXACTEMENT ce qui est décrit dans la description
- N'invente AUCUN nouveau personnage non mentionné
- N'ajoute AUCUN lieu, événement ou contexte non spécifié
- Utilise SEULEMENT les éléments explicitement donnés
- Zéro extrapolation, zéro ajout créatif non demandé
- Si un détail n'est pas mentionné, ne l'invente pas"""
    else:  # modere (par défaut)
        strictesse_instruction = """
FIDÉLITÉ MODÉRÉE :
- Respecte les éléments principaux de la description (personnages, lieu, intrigue)
- Tu peux ajouter des détails mineurs pour enrichir la narration (descriptions, ambiance)
- Évite d'introduire de nouveaux personnages importants non mentionnés
- Les ajouts doivent rester cohérents avec ce qui est décrit"""

    prompt_complet = f"""Tu es un auteur de roman.
{contexte_histoire}
Génère le prochain chapitre de livre inspiré du thème suivant :
{prompt}

Contraintes du chapitre :{style_instruction}
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
- NE PAS écrire de numéro de chapitre au début (pas de "Chapitre 1", "Chapitre 2", etc.)
- Écris directement le chapitre, sans introduction ni commentaire
- Utilise un rythme fluide : narration + dialogues + descriptions équilibrés
- Reste cohérent avec les chapitres précédents : mêmes personnages, lieux, ton, époque, logique interne
- Les personnages doivent garder leur personnalité et leurs caractéristiques établies
{strictesse_instruction}

=== FORMAT DE RÉPONSE ===
Tu dois répondre en DEUX parties séparées par la ligne "---RESUME---" :

1) D'abord le chapitre complet

---RESUME---

2) Puis un résumé concis (3-5 lignes max) qui liste :
- Les nouveaux personnages introduits (si applicable)
- Les nouveaux lieux découverts (si applicable)
- Les éléments d'intrigue ajoutés ou révélés
- Les points clés à retenir pour la suite

Écris maintenant le chapitre suivi du résumé."""

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

        # Parser la réponse pour séparer le chapitre du résumé
        output = result.stdout.strip()

        if "---RESUME---" in output:
            parts = output.split("---RESUME---", 1)
            texte = parts[0].strip()
            resume = parts[1].strip() if len(parts) > 1 else ""
        else:
            # Si le séparateur n'est pas trouvé, tout est considéré comme texte
            texte = output
            resume = ""

        return {"texte": texte, "resume": resume}

    except subprocess.TimeoutExpired:
        logger.error("Timeout expired")
        raise Exception("La génération a pris trop de temps")
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {e}")
        raise Exception("Claude CLI n'est pas installé ou accessible")
    except Exception as e:
        logger.error(f"Exception: {e}")
        raise

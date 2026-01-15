import subprocess
import shlex


def generer_histoire(prompt: str) -> str:
    """
    Appelle Claude CLI pour générer une histoire pour enfant.

    Args:
        prompt: Le thème ou l'idée de l'histoire fourni par l'utilisateur

    Returns:
        Le texte généré par Claude
    """

    prompt_complet = f"""Tu es un conteur d'histoires pour enfants.
Génère une histoire douce et magique pour une petite fille nommée Rebecca.

Thème demandé par maman : {prompt}

L'histoire doit être :
- Adaptée aux enfants (3-8 ans)
- Poétique et pleine de merveilles
- Avec une morale positive
- D'environ 300-500 mots

Raconte l'histoire directement, sans introduction ni commentaire."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt_complet],
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            raise Exception(f"Erreur Claude CLI: {result.stderr}")

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        raise Exception("La génération a pris trop de temps")
    except FileNotFoundError:
        raise Exception("Claude CLI n'est pas installé ou accessible")

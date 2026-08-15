#!/usr/bin/env bash
# Retour immédiat sur les deux contraintes dures du projet.
# Non bloquant : signale sans interrompre. L'application dure est en CI.
set -uo pipefail

fichier=$(jq -r '.tool_input.file_path // empty')
[[ -z "$fichier" || ! -f "$fichier" ]] && exit 0
[[ "$fichier" != *"/src/"* ]] && exit 0

if grep -qE 'fonts\.(googleapis|gstatic)\.com|https?://cdn\.' "$fichier"; then
  echo "Ressource tierce détectée dans $fichier — le projet ne sert que depuis son domaine." >&2
fi

if grep -q 'isMobile' "$fichier"; then
  echo "isMobile détecté dans $fichier — artefact de maquette, une seule arborescence responsive." >&2
fi

exit 0

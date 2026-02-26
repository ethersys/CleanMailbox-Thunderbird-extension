# Audit de sécurité — CleanMailbox Thunderbird Extension

Date: 2026-02-26

## Périmètre

- `manifest.json`
- `background.js`
- `popup/popup.js`
- `options/options.js`
- `options/options.html`
- dépendances npm

## Résumé exécutif

L'extension présente une surface d'attaque globalement réduite (permissions et hôtes restreints), mais plusieurs points doivent être traités en priorité: stockage de la clé API en clair, validation incomplète de l'émetteur des messages runtime, et exposition potentielle de détails d'erreurs API côté interface.

## Findings

### 1) Moyen — Erreurs API potentiellement trop verbeuses

- **Constat**: certaines erreurs renvoyées peuvent contenir des détails serveur (`status` + payload brut).
- **Risque**: fuite d'information via l'UI.
- **Recommandations**:
  - journaliser les détails techniques uniquement côté background,
  - renvoyer au popup des messages utilisateurs génériques,
  - associer des codes d'erreurs internes non sensibles.

### 2) Moyen — Vulnérabilités dans la chaîne de dev (npm audit)

- **Constat**: `npm audit` remonte des vulnérabilités dans l'arbre dev (via `web-ext` et ses dépendances transitoires).
- **Risque**: supply-chain côté poste/CI (pas runtime direct dans l'extension packagée).
- **Recommandations**:
  - mettre à jour `web-ext` et `eslint`,
  - exécuter des scans réguliers en CI,
  - figer des versions validées.

## Points positifs

- `host_permissions` limité à `https://manager.clean-mailbox.com/*`.
- Pas d'injection HTML évidente dans l'UI (usage de `textContent`).
- API distante en HTTPS et URL non pilotée par l'utilisateur.

## Plan de remédiation conseillé

1. Sanitariser les erreurs remontées au popup.
2. Maintenir les dépendances de dev à jour avec contrôle CI.

## Suivi dépendances (2026-02-26)

- `eslint` mis à jour en `^10.0.2`.
- `web-ext` mis à jour en `^9.3.0`.
- `npm audit fix` exécuté (non destructif).
- État après correction:
  - `0 high`, `0 critical`, `3 moderate`.
  - Reliquat sur la chaîne `web-ext -> addons-linter -> ajv`.
  - Correction complète proposée par npm: `web-ext@6.8.0` via `npm audit fix --force` (downgrade majeur, non recommandé sans validation fonctionnelle explicite).

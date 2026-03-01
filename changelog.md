# Changelog CleanMailbox Thunderbird Extension

Ce fichier résume les changements importants pour les **utilisateurs finaux** à partir de la version **0.11.0**.  
Les détails techniques et le journal complet restent dans `history.md`.

## 0.12.0 — 2026-02-28

- **Signalement spam et retour API**
  - L’extension tient compte du champ `success` renvoyé par l’API CleanMailbox.
  - Si l’API indique `success: false` (par ex. email non passé par CleanMailbox), un message « Déclaration spam échouée : [raison] » s’affiche ; le message est tout de même déplacé vers **Indésirables**.
- **Blacklist par domaine**
  - Nouveau bouton « Ajouter tout le domaine [domaine] à la Blacklist » : blacklist de l’ensemble du domaine de l’expéditeur (envoi de `*@domaine` à l’API).
  - Message de confirmation dédié : « Domaine ajouté à la blacklist avec succès ! »
- **Libellés dynamiques des boutons**
  - Le bouton d’ajout d’adresse affiche désormais « Ajouter [email expéditeur] à la Blacklist ».
  - Le bouton d’ajout de domaine affiche « Ajouter tout le domaine [domaine] à la Blacklist » lorsque l’expéditeur est connu.
- **Correctif signalement spam sous Thunderbird**
  - Correction du « NetworkError when attempting to fetch resource » : l’appel API report utilise désormais XMLHttpRequest pour recevoir correctement les réponses 4xx (ex. 401) et afficher la raison renvoyée par l’API.

## 0.11.0 — 2026-02-26

- **Sécurité de la clé API clarifiée**
  - La manière dont la clé API CleanMailbox est stockée (en local dans Thunderbird) est désormais documentée de façon explicite.
  - Le README explique les risques en cas d’accès au profil Thunderbird et rappelle les bonnes pratiques (rotation/révocation de la clé via le manager CleanMailbox).
- **Documentation sécurité enrichie**
  - Nouvelle section « Sécurité — clé API » dans la documentation utilisateur.
  - Un document dédié (`.doc/security.md`) décrit plus en détail les décisions prises côté sécurité.
- **Protection renforcée contre les extensions malveillantes**
  - L’extension vérifie désormais que les messages internes proviennent bien d’elle-même avant de les traiter.
  - En pratique, cela réduit le risque qu’une autre extension tente d’abuser des actions de signalement ou de blacklist.
- **Déplacement automatique vers Indésirables**
  - Après « Signaler comme Spam » ou « Ajouter à la Blacklist », le message est désormais déplacé automatiquement dans le dossier **Indésirables**.
- **Interface du popup**
  - La police du popup est alignée sur celle de l’interface Thunderbird (même rendu que dans les paramètres).
- **Correctif déplacement vers Indésirables**
  - Correction d’une erreur lors du déplacement vers Indésirables (utilisation du dossier Junk réel du compte au lieu d’un dossier virtuel).


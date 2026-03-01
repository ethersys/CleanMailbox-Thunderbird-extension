[![Changelog](https://img.shields.io/badge/changelog-view%20details-lightgrey?style=flat-square&logo=gitbook&logoColor=white)](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/blob/main/changelog.md)
[![Release](https://img.shields.io/badge/release-0.12.0-blue?style=flat-square)](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-orange?style=flat-square)](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/blob/main/LICENSE)
![Thunderbird](https://img.shields.io/badge/Thunderbird-140+-6366f1?style=flat-square&logo=thunderbird&logoColor=white)
![Last Commit](https://img.shields.io/github/last-commit/ethersys/CleanMailbox-Thunderbird-extension/main?style=flat-square)
[![Issues](https://img.shields.io/github/issues/ethersys/CleanMailbox-Thunderbird-extension?style=flat-square&color=44cc11)](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/issues)

---

# CleanMailbox Thunderbird Extension

**Dépôt :** [https://github.com/ethersys/CleanMailbox-Thunderbird-extension](https://github.com/ethersys/CleanMailbox-Thunderbird-extension)

Extension Thunderbird (140+) pour signaler un spam ou ajouter l'expéditeur (ou tout un domaine) à la blacklist CleanMailbox, puis déplacer le message traité vers le dossier **Indésirables**.

[CleanMailbox](https://clean-mailbox.com/) est un service français de pré-traitement des emails (anti-virus, anti-spam, anti-phishing, filtrage, challenge humain de l'expéditeur).

CleanMailbox est une marque de la société Camille Arpaillange / SIRET 53021905400026. Cette extension est un projet communautaire indépendant et n’est pas affiliée, soutenue ni approuvée par CleanMailbox.

## A propos d'ETHERSYS

[ETHERSYS](https://www.ethersys.fr/) est un hébergeur web toulousain qui propose des espaces d'hébergement très performants avec plusieurs services packagés (noms de domaine, emailing) et qui assure un support humain réactif par téléphone avec des administrateurs système.

Nous utilisons nous-même et proposons en option à nos clients les services de CleanMailbox.

## Installation simple

Téléchargez le fichier cleanmailbox.xpi de la [dernière release](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/releases)  et suivez [l'installation manuelle](https://github.com/ethersys/CleanMailbox-Thunderbird-extension?tab=readme-ov-file#installation-manuelle-dans-thunderbird).

## 1) Fonctionnement du projet (technique)

Extension en cours de développement ; fournie « tel quel », sans garantie de fonctionnement ni de compatibilité.

Testé sur Thunderbird v148.

### Architecture

- `manifest.json` déclare l'extension en Manifest V3 avec un `message_display_action`.
- `popup/popup.js` gère l'interface utilisateur et déclenche les actions.
- `background.js` centralise toute la logique métier :
  - récupération/encodage base64 du message brut (compatibilité `BinaryString` et `File`),
  - appels HTTP vers l'API CleanMailbox,
  - validation de la configuration et parsing des adresses email,
  - déplacement du message vers le dossier `junk` (Indésirables) après succès.
- `options/options.html` + `options/options.js` gèrent la configuration locale (`email`, `apiKey`).
- `_locales/fr/messages.json` contient les messages i18n utilisés dans le popup.

### API CleanMailbox utilisée

- Signalement spam : `POST https://manager.clean-mailbox.com/public-api/report`
  - body JSON : `{ "file": "<contenu-rfc822-base64>" }`
- Ajout blacklist : `PUT https://manager.clean-mailbox.com/public-api/domain/{domaine}/bl`
  - body JSON : `{ "address": "<expediteur@domaine>" }` (adresse complète) ou `{ "address": "*@<domaine>" }` pour blacklister tout un domaine
- Headers communs :
  - `Api-Key: <votre_api_key>`
  - `email: <votre_email_cleanmailbox>`

### Permissions Thunderbird utilisées

- `messagesRead` : lecture du message courant.
- `messagesMove` : déplacement du message vers Indésirables.
- `accountsRead` : accès au dossier spécial `junk`.
- `storage` : stockage local de la configuration.

### Sécurité — clé API

Cette extension conserve actuellement `email` et `apiKey` dans `browser.storage.local` afin d'éviter une ressaisie à chaque session.

**Avertissement :** ce stockage local n'est pas chiffré par l'extension. En cas d'accès au profil Thunderbird (machine compromise, vol, sauvegarde non protégée), la clé API peut être extraite.

Bonnes pratiques recommandées :

- protéger l'accès au poste et au profil Thunderbird ;
- révoquer/faire tourner la clé API depuis le tableau de bord CleanMailbox au moindre doute ;
- consulter le détail des risques dans `.doc/security.md`.

### Prérequis de développement

- Node.js 24+
- npm 9+
- Thunderbird 140+

### Build local

```bash
npm install
npm run build
```

Le build vérifie les fichiers requis puis génère `cleanmailbox.xpi`.

### Installation manuelle dans Thunderbird

1. Ouvrir Thunderbird.
2. Aller dans **Modules complémentaires**.
3. Choisir **Installer un module depuis un fichier**.
4. Sélectionner `cleanmailbox.xpi`que vous avez généré ou téléchargé de la [dernière release](https://github.com/ethersys/CleanMailbox-Thunderbird-extension/releases).

## 2) Fonctionnement de l'extension (utilisateur final)

### Première configuration

1. Une fois l'extension installée, Thunderbird va ouvrir automatiquement une popin de configuration.
2. Saisir :
   - votre email de compte CleanMailbox,
   - votre clé API CleanMailbox (située dans "Mon Profil").
3. Enregistrer la configuration.

### Utilisation dans un email

1. Ouvrir un message dans Thunderbird.
2. Cliquer sur le bouton CleanMailbox présent dans les actions du message (zone Répondre/Transférer/Archiver).
3. Choisir :
   - **Signaler comme Spam** pour envoyer le message brut à CleanMailbox (si l'API indique que la détection n'a pas été transmise, un message explicatif s'affiche mais le message est tout de même déplacé vers Indésirables),
   - **Ajouter [email expéditeur] à la Blacklist** pour ajouter l'adresse de l'expéditeur sur le domaine du destinataire,
   - **Ajouter tout le domaine [domaine] à la Blacklist** pour blacklister l'ensemble du domaine de l'expéditeur (`*@domaine`).
4. Si l'action réussit, le message est déplacé automatiquement dans **Indésirables**.

### Résultat attendu

- Un message de confirmation s'affiche en cas de succès.
- Le message traité est déplacé dans le dossier **Indésirables**.
- En cas d'erreur (configuration manquante, message introuvable, erreur API), un message explicite est affiché.

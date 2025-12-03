# 📦 Dofus API - Technologie Émergente

Ce projet est une application web développée avec SvelteKit.  
Elle permet de naviguer dans les équipements de Dofus, consulter leurs effets, recettes et panoplies associées.

---

## 🔧 Technologies utilisées

- ✅ [SvelteKit](https://kit.svelte.dev/) – Framework moderne fullstack
- ✅ TypeScript
- ✅ JSON statique comme base de données (fichiers locaux)
- ✅ HTML/CSS
- ✅ Vite (serveur de développement)

---

## 🚀 Lancer le projet localement

### 1. Cloner le dépôt

git clone https://github.com/Titous84/Techno-Emergente---Projet-session
cd Techno-Emergente---Projet-session

2. Installer les dépendances

npm install

3. Lancer le serveur de développement

npm run dev

Ensuite, ouvre le navigateur à l'adresse :
👉 http://localhost:5173

🧭 Fonctionnalités
📋 Page d'accueil
- Accès à la liste des équipements

🛡️ Équipements
- Affichage du nom, niveau, type, description
- Illustration de l’équipement
- Effets avec icônes (ex: Vitalité, Force, PA...)
- Recette de craft avec images des ressources

🧢 Panoplies
- Si l’équipement fait partie d’une panoplie, les autres objets sont listés avec des liens

📁 Structure du projet

├── src/
│   ├── lib/
│   │   ├── data/              # Données JSON (équipements, ressources, panoplies)
│   │   └── services/          # Fonctions pour accéder aux données
│   └── routes/
│       ├── +page.svelte       # Page d’accueil
│       └── equipements/
│           ├── +page.svelte   # Liste des équipements
│           └── [nom]/+page.svelte  # Page de détail d’un équipement
├── static/                    # Fichiers statiques
├── package.json
└── README.md

🗃️ Données utilisées
Les données sont basées sur des fichiers .json stockés localement dans src/lib/data/ :
- equipements.json
- ressources.json
- panoplie.json

Les images proviennent de :
- https://api.dofusdb.fr/img/items/
- https://dofusdb.fr/icons/effects/

🙋‍♂️ Auteur
- 👤 Titous84
- GitHub : github.com/Titous84

📜 Licence
Ce projet est à but éducatif. Les données et images utilisées proviennent de Dofus et Ankama.
Aucune réutilisation commerciale n’est prévue.

---

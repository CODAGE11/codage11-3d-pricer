# CODAGE11 - Calculateur de Prix 3D

Application web complète pour calculer automatiquement les prix d'impression 3D avec analyse des fichiers STL/OBJ et visualisation 3D interactive.

## 🚀 Fonctionnalités

### Backend FastAPI
- ✅ Serveur FastAPI avec endpoints pour l'analyse de fichiers 3D
- ✅ Analyse automatique des modèles 3D (volume, surface, dimensions)
- ✅ Calcul intelligent des prix basé sur matériau, volume et complexité
- ✅ Support des formats STL, OBJ, PLY, STEP
- ✅ API REST avec CORS configuré

### Frontend moderne
- ✅ **Page d'accueil** : Drag & drop pour upload de fichiers 3D
- ✅ **Page d'upload** : Paramètres d'impression et analyse en temps réel
- ✅ **Visualiseur 3D** : Prévisualisation interactive avec Three.js
- ✅ **Page de pricing** : Devis détaillé et gestion des commandes
- ✅ **Interface responsive** avec Bootstrap 5

### Moteur de calcul de prix
- ✅ Calcul basé sur le volume du modèle 3D
- ✅ Différents matériaux (PLA, ABS, PETG, TPU) avec prix variables
- ✅ Estimation du temps d'impression selon la complexité
- ✅ Gestion des supports et post-traitement
- ✅ Marge configurable (25%)

### Visualisation 3D avancée
- ✅ Rendu 3D avec Three.js et WebGL
- ✅ Contrôles orbitaux (rotation, zoom, pan)
- ✅ Mode wireframe et contrôles de matériau
- ✅ Analyse d'imprimabilité visuelle
- ✅ Mesures et annotations

## 📁 Structure de fichiers

```
/
├── main.py                 # Serveur FastAPI
├── requirements.txt        # Dépendances Python
├── README.md              # Documentation
├── index.html             # Page d'accueil
├── upload.html            # Upload et paramètres
├── viewer.html            # Visualiseur 3D
├── pricing.html           # Devis et commandes
├── css/
│   ├── main.css          # Styles principaux
│   ├── upload.css        # Styles upload
│   └── viewer.css        # Styles visualiseur
└── js/
    ├── main.js           # Logique principale
    ├── file-handler.js   # Gestion fichiers
    ├── 3d-viewer.js      # Visualiseur 3D
    └── pricing-calculator.js # Calculs prix
```

## 🛠️ Installation et démarrage

### Prérequis
- Python 3.8+
- Navigateur web moderne (Chrome, Firefox, Edge)

### Installation des dépendances

```bash
pip install -r requirements.txt
```

### Démarrage de l'application

```bash
python main.py
```

L'application sera accessible à l'adresse : **http://localhost:8000**

## 📖 Utilisation

### 1. Workflow utilisateur
1. **Upload fichier 3D** sur la page d'accueil
2. **Configuration paramètres** d'impression (matériau, remplissage, etc.)
3. **Analyse automatique** et visualisation 3D
4. **Calcul prix** en temps réel
5. **Génération devis** détaillé
6. **Possibilité de commande**

### 2. Pages principales

#### Page d'accueil (`/`)
- Interface d'accueil avec drag & drop
- Présentation des fonctionnalités
- Affichage des matériaux disponibles

#### Page d'upload (`/upload`)
- Zone de téléchargement drag & drop
- Paramètres d'impression configurables
- Analyse en temps réel
- Prévisualisation 3D intégrée

#### Visualiseur 3D (`/viewer`)
- Rendu 3D haute qualité
- Contrôles avancés (éclairage, matériaux)
- Outils de mesure
- Export de captures d'écran

#### Gestion des devis (`/pricing`)
- Historique des devis
- Détails de tarification
- Gestion des commandes
- Export PDF

## 🔧 Configuration

### Matériaux supportés
- **PLA** : Standard, économique (25€/kg)
- **ABS** : Haute résistance (30€/kg)
- **PETG** : Résistant chimique (35€/kg)
- **TPU** : Flexible (45€/kg)

### Paramètres de pricing
- Temps machine : 15€/heure
- Post-traitement : 5€ base
- Marge : 25%
- Prix minimum : 5€

## 🌐 API Endpoints

### Principaux endpoints
- `GET /` : Page d'accueil
- `GET /api/materials` : Liste des matériaux
- `POST /api/analyze` : Analyse de fichier 3D
- `GET /api/quote/{id}` : Récupération d'un devis
- `POST /api/quote` : Création d'un devis

### Format de réponse d'analyse
```json
{
  "filename": "model.stl",
  "file_size_bytes": 1024000,
  "analysis": {
    "volume_cm3": 25.4,
    "surface_area_cm2": 156.2,
    "dimensions_cm": {"x": 5.2, "y": 4.8, "z": 6.1},
    "complexity_factor": 0.3,
    "is_watertight": true,
    "needs_supports": false
  },
  "pricing": {
    "material": {"type": "PLA", "weight_g": 31.5, "cost": 0.79},
    "print_time": {"hours": 2.5, "minutes": 150},
    "costs": {"total": 18.50}
  }
}
```

## 🔮 Améliorations futures

### Intégration 3D avancée
Pour une analyse 3D plus précise, installer trimesh :
```bash
pip install trimesh numpy
```

### Base de données
- Intégration PostgreSQL/MongoDB
- Gestion utilisateurs
- Historique persistant

### Fonctionnalités avancées
- Génération automatique de supports
- Simulation d'impression
- Intégration imprimantes 3D
- Notifications temps réel

## 🎨 Technologies utilisées

### Backend
- **FastAPI** : Framework web Python moderne
- **Python 3.8+** : Langage principal
- **Uvicorn** : Serveur ASGI

### Frontend
- **Bootstrap 5** : Framework CSS responsive
- **Three.js** : Bibliothèque 3D WebGL
- **Font Awesome** : Icônes
- **Vanilla JavaScript** : Interactions client

### Formats supportés
- **STL** : Standard pour impression 3D
- **OBJ** : Format 3D universel
- **PLY** : Format de nuage de points
- **STEP** : Format CAO professionnel

## 📝 Licence

Projet développé pour CODAGE11 - Tous droits réservés.

## 🤝 Contribution

Pour signaler un bug ou proposer une amélioration, contactez l'équipe CODAGE11.

---

**CODAGE11** - Impression 3D professionnelle 🚀
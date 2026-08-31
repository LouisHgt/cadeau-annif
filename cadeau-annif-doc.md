# Cadeau Anniversaire — Documentation projet

## 1. Objectif

Créer une courte expérience web interactive d’anniversaire, principalement visuelle, avec une direction artistique inspirée de la **PlayStation 1 / PSX**.

Le site ne doit pas ressembler à un jeu vidéo complet.  
Il s’agit plutôt d’une **petite scène 3D interactive et cinématique**, simple à comprendre et centrée sur un paquet cadeau.

L’objectif principal est de soigner :

- la mise en scène ;
- les animations ;
- les interactions ;
- le rendu rétro PS1 ;
- les modèles 3D low-poly ;
- les sons et petits détails visuels.

---

# 2. Stack technique

## Base

### Vite

Utilisé comme environnement de développement et système de build.

Rôle :

- serveur de développement local ;
- hot reload ;
- gestion des imports JavaScript ;
- build statique ;
- déploiement simple sur GitHub Pages.

Commandes principales :

```bash
npm install
npm run dev
npm run build
npm run preview
```

---

### JavaScript Vanilla

Pas de React, Vue ou autre framework frontend.

Le projet est suffisamment petit pour rester en JavaScript natif.

Avantages :

- structure légère ;
- contrôle total sur Three.js ;
- moins de dépendances ;
- plus simple pour les interactions 3D.

---

## 3D

### Three.js

Bibliothèque principale pour toute la scène 3D.

Utilisée pour :

- la caméra ;
- les lumières ;
- le rendu WebGL ;
- le chargement des fichiers `.glb` / `.gltf` ;
- les modèles du cadeau et du gâteau ;
- les sprites ;
- les interactions souris via `Raycaster` ;
- les shaders PS1 ;
- le rendu basse résolution.

Le format privilégié pour les modèles sera :

```text
.glb
```

Le GLB permet de regrouper dans un seul fichier :

- géométrie ;
- matériaux ;
- textures ;
- éventuellement animations.

---

## Animations

### GSAP

GSAP sera utilisé pour toutes les animations programmées.

Exemples :

- chute du cadeau ;
- rebonds ;
- tremblements ;
- déplacement du ruban ;
- chute du ruban ;
- ouverture du couvercle ;
- apparition du gâteau ;
- mouvement de caméra ;
- apparition des textes ;
- séquence finale.

On privilégiera les `Timeline` GSAP afin d’éviter une accumulation de `setTimeout()`.

---

## Interactions utilisateur

Les interactions 3D seront gérées avec :

```text
Pointer Events
+
Three.js Raycaster
```

Le Raycaster permet de détecter l’objet 3D situé sous la souris.

Il sera notamment utilisé pour :

- détecter le ruban ;
- commencer le drag ;
- calculer la progression du tirage ;
- détecter les bougies ;
- éteindre une flamme au clic.

GSAP ne sera pas utilisé pour détecter le drag 3D.

GSAP prendra le relais une fois qu’une interaction utilisateur est terminée.

---

# 3. Direction artistique

## Inspiration principale

Style visuel :

```text
PlayStation 1 / PSX
```

Le but n’est pas seulement d’utiliser des modèles avec peu de polygones.

Le rendu rétro doit venir de plusieurs limitations graphiques reproduites volontairement.

---

## Pipeline graphique PS1

Le rendu final devra progressivement inclure :

```text
modèle low-poly
        ↓
textures basse résolution
        ↓
NearestFilter
        ↓
flat shading
        ↓
vertex snapping / vertex jitter
        ↓
texture warping / affine mapping
        ↓
réduction de profondeur des couleurs
        ↓
dithering
        ↓
rendu basse résolution
        ↓
upscale sans interpolation
```

---

## Résolution interne

Résolution de départ :

```text
320 × 240
```

Le canvas sera ensuite agrandi pour remplir l’écran.

CSS :

```css
image-rendering: pixelated;
```

Le navigateur agrandira donc les pixels sans les lisser.

Format conservé :

```text
4:3
```

Des bandes noires sur les écrans modernes sont acceptables et peuvent même renforcer la direction artistique.

---

## Textures

Les textures devront être volontairement petites.

Tailles visées :

```text
64 × 64
128 × 128
256 × 256 maximum dans la majorité des cas
```

Filtrage Three.js :

```javascript
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
```

Pas de filtrage moderne.

Pas d’anisotropie importante.

---

## Flat shading

On évitera les surfaces trop lisses.

```javascript
material.flatShading = true;
```

Cela permet de conserver les facettes visibles des modèles low-poly.

---

## Vertex jitter

Le rendu PS1 utilisait une précision limitée pour la position des sommets.

Nous reproduirons volontairement ce comportement avec un shader.

Effet recherché :

- contours légèrement instables ;
- géométrie qui "saute" subtilement lors des mouvements ;
- impression caractéristique des jeux PS1.

L’effet devra rester subtil afin de garder un rendu agréable.

---

## Texture warping

Une autre caractéristique importante du rendu PS1 est la déformation des textures sur les surfaces 3D.

Cette technique sera étudiée après l’intégration du véritable modèle du cadeau.

---

## Couleurs et dithering

Le rendu final devra également limiter volontairement la précision des couleurs.

Objectifs :

- color banding ;
- dégradés moins propres ;
- ordered dithering ;
- palette légèrement contrainte.

L’idée est d’éviter complètement le rendu WebGL moderne parfaitement propre.

---

# 4. Assets 3D

## Cadeau

Le cadeau sera récupéré depuis une banque d’assets existante.

Critères importants :

- low-poly ;
- licence permettant la modification ;
- GLB / GLTF de préférence ;
- géométrie simple ;
- boîte et couvercle séparables ;
- ruban facilement isolable ;
- nœud facilement isolable.

Le modèle n’a pas besoin d’être directement "PS1".

Le pipeline graphique du site fera une grande partie du travail.

---

## Préparation dans Blender

Blender sera utilisé uniquement pour préparer les assets.

Pas besoin de modéliser entièrement les objets.

Les opérations principales seront :

- importer le modèle ;
- séparer les différentes parties ;
- renommer les objets ;
- déplacer éventuellement les pivots ;
- réduire éventuellement les textures ;
- exporter en GLB.

Structure souhaitée :

```text
Gift
├── Box
├── Lid
├── Ribbon
└── Bow
```

Le ruban pourra éventuellement être encore séparé :

```text
Ribbon
├── RibbonVertical
├── RibbonHorizontal
├── BowCenter
├── BowLeft
├── BowRight
├── TailLeft
└── TailRight
```

Mais cette séparation détaillée n’est pas obligatoire.

---

## Gâteau

Le gâteau sera également récupéré depuis une banque d’assets existante.

Critères :

- low-poly ;
- petite texture ;
- esthétique compatible PSX ;
- bougies séparables si possible.

Les flammes pourront être réalisées indépendamment sous forme de sprites 2D pixelisés.

---

# 5. Déroulé de l’expérience utilisateur

L’expérience doit rester courte.

Durée cible :

```text
30 à 60 secondes
```

Elle doit être très simple à comprendre.

---

## Étape 1 — Arrivée

L’écran est sombre.

La scène est déjà visible mais quasiment vide.

Le cadeau tombe depuis le haut de l’écran.

Animation :

```text
cadeau hors écran
      ↓
chute rapide
      ↓
impact au sol
      ↓
petit rebond
      ↓
second rebond léger
      ↓
stabilisation
```

Un petit mouvement ou tremblement de caméra pourra accompagner l’impact.

---

## Étape 2 — Invitation à tirer le ruban

Une instruction discrète apparaît.

Exemple :

```text
TIRE SUR LE RUBAN
```

Le texte doit respecter la direction artistique PS1.

Pas de gros bouton HTML moderne.

Lorsque la souris passe sur la partie interactive du ruban :

- le curseur peut changer ;
- le ruban peut légèrement réagir ;
- un petit feedback visuel peut indiquer qu’il est interactif.

---

## Étape 3 — Tirage du ruban

L’utilisateur clique sur une extrémité du ruban et déplace la souris.

Une variable représentera l’avancement :

```javascript
pullProgress
```

Valeurs :

```text
0 → ruban intact
1 → ruban entièrement tiré
```

Pendant le drag :

- une partie du ruban s’allonge ;
- une boucle du nœud rétrécit ;
- le nœud devient asymétrique ;
- le ruban donne l’impression de se défaire.

Il ne s’agira pas d’une vraie simulation physique.

Le comportement sera truqué avec des transformations contrôlées.

---

## Étape 4 — Le ruban se détache

Lorsque :

```text
pullProgress ≈ 1
```

l’utilisateur ne contrôle plus le ruban.

Une animation GSAP commence.

Le ruban :

- se détache ;
- glisse ;
- tombe au sol.

Une courte pause est conservée après l’animation.

---

## Étape 5 — Ouverture du cadeau

Après une courte attente :

- la boîte tremble légèrement ;
- le couvercle commence à bouger ;
- il se soulève ;
- il part légèrement vers l’arrière.

Le mouvement doit rester simple et lisible.

Pas besoin de simulation physique.

---

## Étape 6 — Apparition du gâteau

Le gâteau monte depuis l’intérieur du cadeau.

Pendant cette étape :

- l’ambiance peut s’assombrir légèrement ;
- la caméra peut se rapprocher ;
- les flammes deviennent visuellement importantes.

Le gâteau devient le nouveau centre de la scène.

---

## Étape 7 — Faire un vœu

Une nouvelle instruction apparaît :

```text
FAIS UN VŒU
```

Après une courte pause, l’utilisateur comprend qu’il doit interagir avec les bougies.

---

## Étape 8 — Éteindre les bougies

Chaque flamme est cliquable.

Le Raycaster détecte les clics.

Quand une bougie est sélectionnée :

```text
flamme visible
      ↓
clic
      ↓
flamme disparaît
      ↓
petit sprite de fumée
```

Les flammes peuvent être des sprites 2D avec quelques frames d’animation.

---

## Étape 9 — Finale

Lorsque toutes les bougies sont éteintes :

- petite pause ;
- changement de lumière éventuel ;
- mouvement lent de caméra ;
- message final.

Exemple :

```text
JOYEUX ANNIVERSAIRE

[PRÉNOM]
```

Une animation finale pourra ajouter :

- particules ;
- confettis ;
- petites étoiles ;
- musique ;
- message personnel.

La finale doit rester cohérente avec la DA PS1.

---

# 6. États de l’expérience

Une petite machine à états suffira.

Exemple :

```javascript
let state = "INTRO";
```

États prévus :

```text
INTRO
↓
WAITING_FOR_RIBBON
↓
PULLING_RIBBON
↓
RIBBON_RELEASE
↓
OPENING_BOX
↓
CAKE_REVEAL
↓
WAITING_FOR_WISH
↓
CANDLES
↓
FINALE
```

Cela évite que l’utilisateur puisse déclencher une interaction au mauvais moment.

Exemple :

```javascript
if (state !== "WAITING_FOR_RIBBON") return;
```

---

# 7. Structure du projet

Structure cible :

```text
cadeau-annif/
│
├── public/
│   │
│   └── assets/
│       │
│       ├── models/
│       │   ├── gift.glb
│       │   └── cake.glb
│       │
│       ├── textures/
│       │   ├── flame.png
│       │   ├── smoke.png
│       │   └── ...
│       │
│       └── sounds/
│           ├── impact.mp3
│           ├── ribbon.mp3
│           ├── candle.mp3
│           └── ...
│
├── src/
│   │
│   ├── main.js
│   │
│   ├── style.css
│   │
│   ├── scene.js
│   │
│   ├── retro-renderer.js
│   │
│   ├── animations.js
│   │
│   ├── interactions.js
│   │
│   └── gift-placeholder.js
│   │
│   └── ...
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# 8. Responsabilité des fichiers

## `main.js`

Point d’entrée du projet.

Responsabilités :

- initialiser les modules ;
- créer l’expérience ;
- démarrer la render loop ;
- connecter les différents systèmes.

Il doit progressivement rester assez léger.

---

## `scene.js`

Responsabilités :

- scène Three.js ;
- caméra ;
- lumières ;
- sol ;
- environnement ;
- chargement des modèles.

---

## `retro-renderer.js`

Toute la logique liée au rendu PS1.

Responsabilités :

- NearestFilter ;
- flat shading ;
- vertex snapping ;
- dithering ;
- color quantization ;
- shaders rétro ;
- réglages de résolution.

---

## `animations.js`

Animations GSAP.

Exemples :

```text
playGiftDrop()
releaseRibbon()
openGift()
revealCake()
playFinale()
```

---

## `interactions.js`

Interactions utilisateur.

Responsabilités :

- Raycaster ;
- Pointer Events ;
- drag du ruban ;
- gestion de `pullProgress` ;
- détection des bougies ;
- clics.

---

## `gift-placeholder.js`

Cadeau temporaire construit avec des primitives Three.js.

Utilisé pendant le développement avant d’avoir le véritable fichier `gift.glb`.

Il reproduit volontairement une structure proche du futur modèle final :

```text
Gift
├── Box
├── Lid
├── Ribbon
└── Bow
```

Cela permet de développer les animations avant de posséder le véritable asset.

---

# 9. Ordre de développement

## Milestone 1 — Base Three.js

Objectif :

```text
afficher une scène 3D propre
```

Inclut :

- caméra ;
- lumière ;
- sol ;
- placeholder du cadeau.

---

## Milestone 2 — Rendu PS1

Objectif prioritaire.

Mettre en place :

- 320 × 240 ;
- upscale pixelisé ;
- flat shading ;
- NearestFilter ;
- vertex jitter ;
- réduction des couleurs ;
- dithering.

Le projet doit déjà avoir une forte identité visuelle à ce stade.

---

## Milestone 3 — Chute du cadeau

GSAP :

- chute ;
- impact ;
- rebond ;
- stabilisation.

---

## Milestone 4 — Intégration du vrai cadeau

Lorsque le modèle sera récupéré :

```text
gift-placeholder
        ↓
gift.glb
```

Préparation éventuelle dans Blender.

Les objets devront être accessibles comme :

```text
Box
Lid
Ribbon
Bow
```

---

## Milestone 5 — Interaction ruban

Créer :

- détection du ruban ;
- Pointer Events ;
- drag ;
- `pullProgress` ;
- déformation visuelle du nœud.

---

## Milestone 6 — Libération du ruban

Lorsque le drag atteint la valeur maximale :

- désactiver le contrôle utilisateur ;
- lancer l’animation automatique ;
- faire tomber le ruban.

---

## Milestone 7 — Ouverture de la boîte

Animation du couvercle.

---

## Milestone 8 — Gâteau

Importer :

```text
cake.glb
```

Puis :

- cacher le gâteau dans la boîte ;
- le faire monter ;
- cadrer correctement la caméra.

---

## Milestone 9 — Bougies

Ajouter :

- flammes ;
- animation des flammes ;
- Raycaster ;
- interaction utilisateur ;
- fumée.

---

## Milestone 10 — Finale

Ajouter :

- texte ;
- message personnel ;
- lumière finale ;
- particules ;
- sons ;
- polish.

---

# 10. Principes à conserver

## Ne pas sur-développer

Le projet est volontairement simple.

Éviter :

- framework frontend inutile ;
- moteur physique ;
- système complexe de scènes ;
- vraie simulation de tissu ;
- architecture excessive.

---

## Tricher visuellement

Le ruban ne sera pas physiquement réaliste.

Le nœud sera animé selon `pullProgress`.

Le couvercle sera animé avec GSAP.

Les objets tomberont avec des animations préparées.

Le but est que l’illusion soit convaincante, pas que la simulation soit exacte.

---

## Le rendu PS1 est prioritaire

Un asset low-poly seul ne suffit pas.

Les éléments qui doivent réellement porter la DA sont :

1. basse résolution ;
2. textures basse résolution ;
3. nearest-neighbor ;
4. flat shading ;
5. vertex jitter ;
6. texture warping ;
7. profondeur de couleurs réduite ;
8. dithering ;
9. éclairage simple ;
10. géométrie low-poly.

---

## Garder l’expérience courte

Chaque étape doit servir la mise en scène.

Le site ne doit pas devenir un jeu ou une collection de mini-interactions.

Structure finale :

```text
cadeau tombe
↓
tirer le ruban
↓
ruban tombe
↓
boîte s’ouvre
↓
gâteau apparaît
↓
faire un vœu
↓
éteindre les bougies
↓
joyeux anniversaire
```

C’est le cœur du projet.

Deploiement :
git pull
npm ci
npm run build -- --base=/cadeau-annif/
sudo systemctl restart cadeau-annif // Si back touché

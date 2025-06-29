@echo off
echo.
echo ========================================
echo   🚀 Installation Expo SDK 53
echo ========================================
echo.

:: Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou pas dans le PATH
    echo    Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté: 
node --version

echo.
echo 🧹 Nettoyage des anciennes installations...
if exist node_modules (
    echo    Suppression de node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo    Suppression de package-lock.json...
    del package-lock.json
)
if exist yarn.lock (
    echo    Suppression de yarn.lock...
    del yarn.lock
)

echo.
echo ⚙️  Configuration npm pour Expo SDK 53...
echo legacy-peer-deps=true > .npmrc
echo    Configuration .npmrc créée

echo.
echo 📦 Installation d'Expo SDK 53...
npm install expo@53.0.12
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation d'Expo
    pause
    exit /b 1
)

echo.
echo 📦 Installation de React 19...
npm install react@19.0.0
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation de React 19
    pause
    exit /b 1
)

echo.
echo 📦 Installation des icônes vectorielles...
npm install @expo/vector-icons@14.1.0
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des icônes
    pause
    exit /b 1
)

echo.
echo 📦 Installation de React Native 0.79...
npm install react-native@0.79.3
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation de React Native
    pause
    exit /b 1
)

echo.
echo 📦 Installation de React Native Maps...
npm install react-native-maps@1.21.0
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des cartes
    pause
    exit /b 1
)

echo.
echo 📦 Installation des autres dépendances...
npm install @react-native-async-storage/async-storage@^2.1.0
npm install @react-navigation/bottom-tabs@^7.3.14
npm install @react-navigation/native@^7.1.10
npm install @react-navigation/stack@^7.1.1
npm install axios@^1.7.7
npm install react-native-gesture-handler@~2.21.0
npm install react-native-reanimated@~3.17.0
npm install react-native-safe-area-context@4.13.0
npm install react-native-screens@~4.5.0
npm install react-native-svg@15.9.0
npm install @react-native-community/netinfo@^11.4.1

echo.
echo 📦 Installation des modules Expo...
npx expo install expo-constants expo-image-picker expo-location expo-status-bar
npx expo install expo-task-manager expo-notifications expo-haptics expo-sensors

echo.
echo 📦 Installation des dépendances de développement...
npm install --save-dev @babel/core@^7.26.0
npm install --save-dev @expo/cli@^0.24.0
npm install --save-dev react-native-dotenv@^3.4.11

echo.
echo 🔧 Correction automatique des dépendances...
npx expo install --fix
if errorlevel 1 (
    echo ⚠️  Avertissement: expo install --fix a rencontré des problèmes
    echo    Cela peut être normal avec SDK 53
)

echo.
echo 🎯 Vérification de l'installation...
npx expo --version
if errorlevel 1 (
    echo ❌ Erreur: Expo CLI ne fonctionne pas correctement
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Installation terminée avec succès !
echo ========================================
echo.
echo 📋 Prochaines étapes:
echo    1. npx expo start        - Démarrer le serveur de développement
echo    2. npx expo start --android  - Ouvrir sur Android
echo    3. npx expo start --ios      - Ouvrir sur iOS
echo    4. npx expo start --web      - Ouvrir sur le web
echo.
echo 🔧 Commandes utiles:
echo    - npx expo start --clear     - Démarrer avec cache vidé
echo    - npx expo-doctor            - Diagnostiquer les problèmes
echo    - npx expo install --fix     - Corriger les dépendances
echo.
echo ⚠️  Notes importantes pour SDK 53:
echo    - React 19 est maintenant utilisé
echo    - New Architecture activée par défaut
echo    - Node 20+ recommandé (vous utilisez Node 23 ✅)
echo    - expo-background-task pas encore disponible (supprimé)
echo.

pause
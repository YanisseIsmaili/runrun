@echo off
echo.
echo ========================================
echo   🔧 Réparation Running App V3
echo ========================================
echo.

echo 🩺 Diagnostic du projet...
npx expo-doctor
echo.

echo 🔧 Options de réparation:
echo    1. Nettoyer le cache Metro
echo    2. Réinstaller node_modules
echo    3. Corriger les dépendances Expo
echo    4. Nettoage complet et réinstallation
echo    5. Vérifier les versions des packages
echo    6. Réparer les permissions (si erreurs de permissions)
echo    0. Retour au menu principal
echo.

set /p choice="Choisissez une option (1-6, 0 pour retour): "

if "%choice%"=="0" goto :end
if "%choice%"=="1" goto :clear_cache
if "%choice%"=="2" goto :reinstall_modules
if "%choice%"=="3" goto :fix_expo
if "%choice%"=="4" goto :full_clean
if "%choice%"=="5" goto :check_versions
if "%choice%"=="6" goto :fix_permissions

echo ❌ Option invalide
pause
goto :end

:clear_cache
echo.
echo 🧹 Nettoyage du cache Metro...
npx expo start --clear
goto :end

:reinstall_modules
echo.
echo 📦 Réinstallation de node_modules...
if exist node_modules (
    echo    Suppression de node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)
npm install
echo ✅ node_modules réinstallé
pause
goto :end

:fix_expo
echo.
echo 🔧 Correction des dépendances Expo...
npx expo install --fix
echo ✅ Dépendances Expo corrigées
pause
goto :end

:full_clean
echo.
echo 🧹 Nettoyage complet...
echo    ⚠️  Cela va supprimer tous les modules et réinstaller
set /p confirm="Êtes-vous sûr ? (o/N): "
if /i not "%confirm%"=="o" goto :end

if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)
if exist yarn.lock (
    del yarn.lock
)

echo    Réinstallation complète...
call install-sdk53.bat
goto :end

:check_versions
echo.
echo 📋 Vérification des versions...
echo.
echo Node.js:
node --version
echo.
echo npm:
npm --version
echo.
echo Expo:
npx expo --version
echo.
echo React:
npm list react
echo.
echo React Native:
npm list react-native
echo.
pause
goto :end

:fix_permissions
echo.
echo 🔐 Réparation des permissions...
echo    Nettoyage du cache npm global...
npm cache clean --force
echo    Réparation des permissions npm...
npm install -g npm@latest
echo ✅ Permissions réparées
pause
goto :end

:end
echo.
echo 👋 Retour au menu principal...
pause
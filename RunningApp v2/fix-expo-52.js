#!/usr/bin/env node

/**
 * Script de correction pour Expo SDK 52
 * Résout le problème ActivityIndicator size="large"
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🔧 ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function error(message) {
  console.log(`❌ ${message}`);
}

// 1. Nettoyer le cache
function clearCache() {
  try {
    log('Nettoyage du cache...');
    const { execSync } = require('child_process');
    
    // Nettoyer le cache Metro
    execSync('npx expo start --clear', { stdio: 'ignore' });
    
    // Nettoyer node_modules si nécessaire
    if (process.argv.includes('--clean')) {
      log('Nettoyage complet des dépendances...');
      execSync('rm -rf node_modules package-lock.json', { stdio: 'ignore' });
      execSync('npm install', { stdio: 'inherit' });
    }
    
    success('Cache nettoyé');
  } catch (err) {
    error('Erreur lors du nettoyage du cache');
  }
}

// 2. Vérifier les versions des packages
function checkPackageVersions() {
  try {
    log('Vérification des versions des packages...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredVersions = {
      'expo': '~52.0.17',
      '@react-navigation/native': '^7.0.15',
      '@react-navigation/stack': '^7.1.1',
      '@react-navigation/bottom-tabs': '^7.1.0',
      'react-native-screens': '~4.1.0',
      'react-native-safe-area-context': '4.12.0',
      'react-native': '0.76.3',
      'react': '18.3.1'
    };
    
    let needsUpdate = false;
    
    Object.entries(requiredVersions).forEach(([pkg, version]) => {
      if (dependencies[pkg] && dependencies[pkg] !== version) {
        log(`${pkg}: ${dependencies[pkg]} -> ${version}`);
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      log('Certains packages doivent être mis à jour');
      log('Exécutez: npx expo install --fix');
    } else {
      success('Versions des packages correctes');
    }
  } catch (err) {
    error('Erreur lors de la vérification des versions');
  }
}

// 3. Créer un patch pour ActivityIndicator
function createActivityIndicatorPatch() {
  try {
    log('Création du patch ActivityIndicator...');
    
    const patchContent = `
// Patch pour ActivityIndicator avec Expo SDK 52
import { ActivityIndicator as RNActivityIndicator } from 'react-native';
import React from 'react';

const FixedActivityIndicator = (props) => {
  const { size, ...otherProps } = props;
  
  // Convertir les valeurs string en nombres
  let fixedSize = size;
  if (size === 'large') {
    fixedSize = 40;
  } else if (size === 'small') {
    fixedSize = 20;
  }
  
  return React.createElement(RNActivityIndicator, { ...otherProps, size: fixedSize });
};

export { FixedActivityIndicator as ActivityIndicator };
export * from 'react-native';
`;
    
    // Créer le dossier patches s'il n'existe pas
    const patchesDir = 'patches';
    if (!fs.existsSync(patchesDir)) {
      fs.mkdirSync(patchesDir);
    }
    
    fs.writeFileSync(path.join(patchesDir, 'react-native-fix.js'), patchContent);
    success('Patch ActivityIndicator créé');
  } catch (err) {
    error('Erreur lors de la création du patch');
  }
}

// 4. Mettre à jour app.json
function updateAppJson() {
  try {
    log('Mise à jour de app.json...');
    
    let appJson;
    try {
      appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    } catch {
      appJson = { expo: {} };
    }
    
    // Ajouter les configurations nécessaires pour Expo SDK 52
    appJson.expo = {
      ...appJson.expo,
      experiments: {
        ...appJson.expo.experiments,
        reactCompiler: false
      },
      newArchEnabled: true
    };
    
    fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
    success('app.json mis à jour');
  } catch (err) {
    error('Erreur lors de la mise à jour de app.json');
  }
}

// 5. Instructions finales
function showFinalInstructions() {
  console.log('\n🎯 Instructions finales:');
  console.log('1. Redémarrez le serveur Metro: npx expo start --clear');
  console.log('2. Si le problème persiste, exécutez: npm run fix-expo-52 --clean');
  console.log('3. Vérifiez que tous vos écrans utilisent CustomActivityIndicator');
  console.log('\n📱 L\'application devrait maintenant fonctionner correctement !');
}

// Fonction principale
function main() {
  console.log('🚀 Correction automatique pour Expo SDK 52\n');
  
  clearCache();
  checkPackageVersions();
  createActivityIndicatorPatch();
  updateAppJson();
  showFinalInstructions();
}

// Ajouter le script aux package.json scripts
function addToPackageScripts() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'fix-expo-52': 'node fix-expo-52.js'
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    success('Script ajouté à package.json');
  } catch (err) {
    error('Erreur lors de l\'ajout du script');
  }
}

if (require.main === module) {
  main();
  addToPackageScripts();
}
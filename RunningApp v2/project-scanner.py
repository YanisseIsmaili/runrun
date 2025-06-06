import os
import json
import shutil
from pathlib import Path

def is_important_file(filename):
    """Détermine si un fichier est important pour la compilation."""
    important_files = {
        # Fichiers de configuration
        '.env', '.gitignore', 'package.json', 'tsconfig.json',
        'vite.config.ts', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js',
        'eslint.config.js', '.eslintrc.js', '.eslintrc.json',
        # Fichiers source principaux
        'index.html', 'main.tsx', 'main.jsx', 'main.ts', 'main.js',
        'App.tsx', 'App.jsx', 'App.ts', 'App.js'
    }
    important_extensions = {
        '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.env',
        '.py',  # Fichiers Python
        '.cs'   # Fichiers C#
    }
    
    # Exclure explicitement package-lock.json car il est trop long
    if filename == 'package-lock.json':
        return False
        
    return (filename in important_files or 
            any(filename.endswith(ext) for ext in important_extensions))

def get_flat_filename(original_path):
    """Convertit un chemin de fichier en nom de fichier plat."""
    # Remplace les séparateurs de dossier par des underscores
    flat_name = original_path.replace(os.sep, '_')
    # Supprime le point au début si présent (pour les fichiers cachés)
    if flat_name.startswith('.'):
        flat_name = 'dot_' + flat_name[1:]
    return flat_name

def scan_and_copy_project(project_path, dest_path):
    """Scanne le projet et copie les fichiers importants."""
    important_files = []
    
    try:
        # Créer le dossier de destination s'il n'existe pas
        os.makedirs(dest_path, exist_ok=True)
        
        for root, dirs, files in os.walk(project_path):
            # Ignorer les dossiers node_modules et dist
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if 'dist' in dirs:
                dirs.remove('dist')
            # Ignorer le dossier Scanned_files lui-même
            if os.path.basename(root) == 'Scanned_files':
                continue
                
            for file in files:
                if is_important_file(file):
                    # Chemin relatif pour le rapport
                    rel_path = os.path.relpath(os.path.join(root, file), project_path)
                    important_files.append(rel_path)
                    
                    # Copier le fichier avec un nom plat
                    src_file = os.path.join(root, file)
                    flat_name = get_flat_filename(rel_path)
                    dest_file = os.path.join(dest_path, flat_name)
                    
                    shutil.copy2(src_file, dest_file)
                
        # Trier les fichiers pour une meilleure lisibilité
        important_files.sort()
        
        return important_files
        
    except Exception as e:
        return f"Erreur lors du scan et de la copie: {str(e)}"

def main():
    # Utiliser le répertoire courant comme racine du projet
    project_path = os.getcwd()
    dest_path = os.path.join(project_path, 'Scanned_files')
    
    print("\nScan et copie du projet React/Vite...\n")
    files = scan_and_copy_project(project_path, dest_path)
    
    if isinstance(files, list):
        print("Fichiers originaux scannés:")
        for file in files:
            flat_name = get_flat_filename(file)
            print(f"- {file} -> {flat_name}")
        
        print("\nTotal:", len(files), "fichiers")
        print(f"\nTous les fichiers ont été copiés dans le dossier '{dest_path}'")
        print("Les noms de fichiers ont été aplanis (les séparateurs de dossier sont remplacés par des underscores)")
        print("Vous pouvez maintenant partager ce dossier pour obtenir de l'aide avec la compilation.")
    else:
        print(files)  # Afficher l'erreur

if __name__ == "__main__":
    main()
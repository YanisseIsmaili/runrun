import os
import threading
import time
from dotenv import load_dotenv
from app import create_app

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

def get_api_hosts():
    """Récupère la liste des IPs/hosts de l'API depuis les variables d'environnement"""
    api_hosts_str = os.getenv('API_HOST', 'localhost')
    
    # Séparer les hosts par virgule et nettoyer les espaces
    api_hosts = [host.strip() for host in api_hosts_str.split(',')]
    
    print(f"🌐 API Hosts configurés: {api_hosts}")
    return api_hosts

def get_api_port():
    """Récupère le port de l'API depuis les variables d'environnement"""
    api_port = int(os.getenv('API_PORT', os.getenv('PORT', '5000')))
    print(f"🔌 API Port configuré: {api_port}")
    return api_port

def start_server_on_host(host, port, debug_mode):
    """Démarre un serveur Flask sur un host spécifique"""
    try:
        print(f"🚀 Démarrage serveur sur {host}:{port}")
        app = create_app()
        app.run(
            host=host,
            port=port,
            debug=debug_mode,
            use_reloader=False,  # Important: désactive le reloader pour éviter les conflits
            threaded=True
        )
    except Exception as e:
        print(f"❌ Erreur serveur {host}:{port} - {e}")

def start_multiple_servers():
    """Démarre l'API sur plusieurs hosts simultanément"""
    hosts = get_api_hosts()
    port = get_api_port()
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Si un seul host, démarrage normal
    if len(hosts) == 1:
        print(f"🚀 Démarrage de l'API sur {hosts[0]}:{port}")
        print(f"🐛 Mode debug: {'Activé' if debug_mode else 'Désactivé'}")
        app = create_app()
        app.run(
            host=hosts[0],
            port=port,
            debug=debug_mode
        )
        return
    
    # Plusieurs hosts : créer un thread pour chaque serveur
    print(f"🚀 Démarrage de l'API sur {len(hosts)} interfaces simultanément")
    print(f"🐛 Mode debug: {'Activé' if debug_mode else 'Désactivé'}")
    
    threads = []
    
    for i, host in enumerate(hosts):
        # Pour éviter les conflits de port, on peut utiliser des ports différents
        # ou le même port si les interfaces sont différentes
        current_port = port + i if host not in ['0.0.0.0', 'localhost', '127.0.0.1'] else port
        
        thread = threading.Thread(
            target=start_server_on_host,
            args=(host, current_port, debug_mode),
            daemon=True,
            name=f"Flask-{host}-{current_port}"
        )
        threads.append(thread)
        thread.start()
        
        # Petit délai entre les démarrages
        time.sleep(0.5)
    
    print(f"✅ {len(threads)} serveurs démarrés")
    print("📋 URLs d'accès:")
    for i, host in enumerate(hosts):
        current_port = port + i if host not in ['0.0.0.0', 'localhost', '127.0.0.1'] else port
        print(f"   - http://{host}:{current_port}")
    
    print("\n🔄 Serveurs en cours d'exécution... (Ctrl+C pour arrêter)")
    
    try:
        # Garder le programme principal en vie
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Arrêt des serveurs...")

def start_single_server_all_interfaces():
    """Alternative : démarre un seul serveur écoutant sur toutes les interfaces"""
    port = get_api_port()
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Démarrage de l'API sur toutes les interfaces (0.0.0.0):{port}")
    print(f"🐛 Mode debug: {'Activé' if debug_mode else 'Désactivé'}")
    print("📋 L'API sera accessible via toutes les IPs de la machine")
    
    app = create_app()
    app.run(
        host='0.0.0.0',  # Écoute sur toutes les interfaces
        port=port,
        debug=debug_mode
    )

def main():
    """Fonction principale pour démarrer l'application"""
    
    # Choix du mode de démarrage
    mode = os.getenv('SERVER_MODE', 'multiple').lower()
    
    if mode == 'single':
        # Mode single : un serveur sur 0.0.0.0 (toutes interfaces)
        start_single_server_all_interfaces()
    else:
        # Mode multiple : un serveur par host spécifié
        start_multiple_servers()

if __name__ == '__main__':
    main()
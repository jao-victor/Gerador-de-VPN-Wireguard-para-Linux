from flask import Flask, render_template, request, jsonify, Response
import subprocess
import os
import stat

app = Flask(__name__)

def generate_wg_keys():
    try:
        privkey_proc = subprocess.run(['wg', 'genkey'], capture_output=True, text=True, check=True)
        private_key = privkey_proc.stdout.strip()
        
        pubkey_proc = subprocess.run(['wg', 'pubkey'], input=private_key, capture_output=True, text=True, check=True)
        public_key = pubkey_proc.stdout.strip()
        
        return private_key, public_key
    except subprocess.CalledProcessError as e:
        print(f"Error generating keys: {e}")
        return None, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate_keys', methods=['GET'])
def api_generate_keys():
    private_key, public_key = generate_wg_keys()
    if private_key and public_key:
        return jsonify({
            'success': True,
            'private_key': private_key,
            'public_key': public_key
        })
    return jsonify({'success': False, 'message': 'Erro ao gerar chaves com o wg'}), 500

@app.route('/api/generate_config', methods=['POST'])
def generate_config():
    data = request.json
    
    # Interface
    priv_key = data.get('private_key', '')
    address = data.get('address', '')
    listen_port = data.get('listen_port', '51820')
    dns = data.get('dns', '')
    
    # Peer
    peer_pub_key = data.get('peer_public_key', '')
    peer_endpoint = data.get('peer_endpoint', '')
    peer_allowed_ips = data.get('peer_allowed_ips', '')
    
    config_lines = []
    config_lines.append("[Interface]")
    config_lines.append(f"PrivateKey = {priv_key}")
    if address:
        config_lines.append(f"Address = {address}")
    if listen_port:
        config_lines.append(f"ListenPort = {listen_port}")
    if dns:
        config_lines.append(f"DNS = {dns}")
        
    config_lines.append("")
    config_lines.append("[Peer]")
    config_lines.append(f"PublicKey = {peer_pub_key}")
    if peer_endpoint:
        config_lines.append(f"Endpoint = {peer_endpoint}")
    if peer_allowed_ips:
        config_lines.append(f"AllowedIPs = {peer_allowed_ips}")
        
    config_content = "\n".join(config_lines) + "\n"
    
    saved_locally = False
    message = ''
    try:
        os.makedirs('/etc/wireguard', exist_ok=True)
        
        # Save privatekey
        with open('/etc/wireguard/privatekey', 'w') as f:
            f.write(priv_key)
        os.chmod('/etc/wireguard/privatekey', stat.S_IRUSR | stat.S_IWUSR)
        
        # Save publickey
        pub_key = data.get('public_key', '')
        if pub_key:
            with open('/etc/wireguard/publickey', 'w') as f:
                f.write(pub_key)
        
        # Save wg0.conf
        with open('/etc/wireguard/wg0.conf', 'w') as f:
            f.write(config_content)
        os.chmod('/etc/wireguard/wg0.conf', stat.S_IRUSR | stat.S_IWUSR)
        
        saved_locally = True
        message = 'Arquivos salvos em /etc/wireguard/.'
        
    except PermissionError:
        message = 'Permissão negada. Execute a aplicação com sudo para salvar em /etc/wireguard/.'
    except Exception as e:
        message = f'Erro ao salvar localmente: {str(e)}'
    
    return jsonify({
        'success': True,
        'config': config_content,
        'saved_locally': saved_locally,
        'message': message
    })

@app.route('/api/activate', methods=['POST'])
def activate_wireguard():
    message = ''
    success = False
    
    # Verifica se wg0.conf existe
    if not os.path.exists('/etc/wireguard/wg0.conf'):
        return jsonify({
            'success': False,
            'message': 'O arquivo /etc/wireguard/wg0.conf não foi encontrado. Salve a configuração primeiro.'
        })

    try:
        subprocess.run(['systemctl', 'enable', 'wg-quick@wg0'], check=True, capture_output=True)
        subprocess.run(['systemctl', 'restart', 'wg-quick@wg0'], check=True, capture_output=True)
        message = 'Interface wg0 ativada e configurada para iniciar com o sistema!'
        success = True
    except subprocess.CalledProcessError as e:
        err = e.stderr.decode().strip() if e.stderr else str(e)
        
        # systemctl esconde o erro real, vamos tentar pegar o journalctl
        try:
            journal_proc = subprocess.run(['journalctl', '-u', 'wg-quick@wg0.service', '-n', '20', '--no-pager'], capture_output=True, text=True)
            journal_out = journal_proc.stdout
            if 'resolvconf' in journal_out:
                err += '<br><br><b>Causa confirmada (Debian 13): Falta o resolvconf para configurar o DNS.</b><br>Execute no terminal: <code>sudo apt update && sudo apt install openresolv</code> e tente ativar novamente.'
            else:
                # Checar se tem DNS na config para dar uma dica genérica
                with open('/etc/wireguard/wg0.conf', 'r') as f:
                    if 'DNS' in f.read():
                        err += '<br><br><b>Dica (Debian 13):</b> Como você configurou um servidor DNS, o erro pode ser a falta do pacote resolvconf. Execute: <code>sudo apt install openresolv</code>'
        except Exception:
            pass
                
        message = f'Houve um erro ao tentar ativar a interface:<br>{err}'
    except FileNotFoundError:
        message = 'Comando systemctl não encontrado. Não foi possível ativar.'
    except PermissionError:
        message = 'Permissão negada. Execute a aplicação com sudo para ativar o WireGuard.'
    
    return jsonify({
        'success': success,
        'message': message
    })

if __name__ == '__main__':
    # Rodar apenas localmente em uma porta alta (51821) para evitar conflitos
    app.run(host='127.0.0.1', port=51821, debug=True)

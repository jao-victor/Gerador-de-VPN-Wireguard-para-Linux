# Wireguard Gateway

Uma aplicação web moderna (GUI) para facilitar a criação e o gerenciamento de configurações do WireGuard VPN, com foco em segurança, design atraente e usabilidade.

## Funcionalidades

- **Geração Automática de Chaves**: Cria chaves privadas e públicas com um clique.
- **Configuração Completa**: Gera configurações completas de Interface e Peer (`wg0.conf`).
- **Ativação Direta (Linux)**: Salva as configurações diretamente no diretório do sistema e ativa a interface do WireGuard automaticamente (requer permissão de root).
- **Tratamento de DNS Avançado**: Dicas e detecção de erros inteligentes para usuários do Debian 13 (necessidade do `openresolv`).
- **Download Seguro**: Possibilidade de baixar o arquivo `.conf` localmente caso não deseje (ou não tenha permissão para) salvar diretamente no sistema.

## Requisitos

- Python 3.8+
- [WireGuard](https://www.wireguard.com/install/) (`wg` e `wg-quick` instalados no sistema)
- No Debian 13, se for utilizar a função de DNS, instale o openresolv: `sudo apt install openresolv`

## Como Instalar e Rodar

1. Clone o repositório:
```bash
git clone https://github.com/jao-victor/Gerador-de-VPN-Wireguard-para-Linux.git
cd wireguard-gateway
```

2. (Opcional) Crie e ative um ambiente virtual:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute a aplicação:

**Modo Administrador** (Recomendado):
Permite salvar as chaves e o arquivo `.conf` diretamente na pasta `/etc/wireguard/` e permite a ativação automática da VPN direto pelo painel.
```bash
sudo python3 app.py
```

**Modo Normal** (Apenas para gerar os arquivos):
Os arquivos não serão salvos no sistema, mas você poderá baixá-los diretamente pelo navegador.
```bash
python3 app.py
```

Por fim, acesse no seu navegador:
**`http://127.0.0.1:51821`**

## Estrutura do Projeto

- `app.py`: Backend em Python (Flask) que gerencia as requisições e a comunicação com o sistema operacional (systemctl, wg).
- `templates/index.html`: Estrutura da interface de usuário.
- `static/`: Contém os estilos (CSS) e os scripts (Javascript) do painel.

## Tecnologias Utilizadas

- **Backend:** Python + Flask
- **Frontend:** HTML5, CSS3, Javascript Vanilla
- **Design:** Glassmorphism, CSS Custom Properties e responsividade nativa

## Licença

Este projeto é de código aberto sob a [Licença MIT](LICENSE). Sinta-se à vontade para contribuir!

# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request, render_template, redirect, url_for, make_response
from dotenv import load_dotenv
from flask_cors import CORS
import jwt
import os
import psycopg2
import bcrypt
from datetime import datetime, timedelta, UTC

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app)

# --- Configurações das Variáveis de Ambiente ---
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("Chave secreta (SECRET_KEY) não definida no arquivo .env.")
if not DB_PASSWORD:
    raise ValueError("Senha do banco de dados (DB_PASSWORD) não definida no arquivo .env.")

# --- Funções Auxiliares de Segurança e Banco de Dados ---


def get_db_connection():
    try:
        # Habilita sslmode='require' para garantir conexão estável e segura com o Supabase
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'
        )
        return conn
    except psycopg2.Error as e:
        print(f"Erro de conexão com o banco de dados: {e}")
        return None

def get_token_from_request():
    token = request.cookies.get('jwt_token')
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    return token

def validate_token(token=None):
    if not token:
        token = get_token_from_request()
    if not token:
        return None
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

def validate_admin_token():
    payload = validate_token()
    if not payload or not payload.get('is_admin', False):
        return None
    return payload

# ROTA DE MANUTENÇÃO (Keep-Alive): Mantém o Render acordado de forma automática
@app.route('/api/keep-alive', methods=['GET'])
def keep_alive():
    return jsonify({
        "status": "healthy", 
        "message": "Servidor do Diario de um Estagiario ativo!"
    }), 200

# --- Rotas para Servir Páginas HTML (Frontend) ---

@app.route('/')
def index():
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    token = request.cookies.get('jwt_token')
    if token and validate_token(token):
        return redirect(url_for('semae_index_page'))
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/admin')
def admin_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('admin.html')

# --- Rotas do Jogo do Estagiário (SEMAE - PI2) ---

@app.route('/pi2')
def semae_index_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('pi2/index.html')

@app.route('/pi2/sala')
def semae_sala_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('pi2/sala.html')

@app.route('/pi2/mesa')
def semae_mesa_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('pi2/mesa.html')

@app.route('/pi2/dia1')
def semae_dia1_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('pi2/dia_1.html')

@app.route('/pi2/ranking')
def semae_ranking_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('pi2/ranking.html')

@app.route('/logout')
def logout():
    response = make_response(redirect(url_for('login_page')))
    response.set_cookie(
        'jwt_token',
        '',
        expires=0,
        httponly=True,
        secure=False, 
        samesite='Lax',
        path='/'
    )
    return response

# --- APIs de Controle de Usuários e Inicialização ---

@app.route('/init-db')
def init_db():
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500

    try:
        cur = conn.cursor()
        
        # Cria a tabela de usuários
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Cria a tabela isolada de ranqueamento
        cur.execute("""
            CREATE TABLE IF NOT EXISTS semae_ranking (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR(50) NOT NULL,
                estrelas INTEGER DEFAULT 0,
                conquista_aranha BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Banco de dados e tabela isolada 'semae_ranking' verificados com sucesso!"}), 200
    except psycopg2.Error as e:
        print(f"Erro ao inicializar DB: {e}")
        return jsonify({"message": "Erro ao criar/verificar tabelas no banco de dados."}), 500

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500

    try:
        cur = conn.cursor()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Por padrão, novas contas são criadas como administradoras para este ambiente acadêmico
        cur.execute(
            "INSERT INTO users (username, password_hash, is_admin) VALUES (%s, %s, TRUE)",
            (username, hashed_password)
        )
        conn.commit()
        return jsonify({"message": "Conta criada com sucesso! Prossiga para o login."}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({"message": "Este nome de usuário já está registrado."}), 409
    except Exception as e:
        print(f"Erro no cadastro: {e}")
        return jsonify({"message": "Erro interno ao criar conta."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/login', methods=['POST'])
def api_login_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Nome de usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500

    try:
        cur = conn.cursor()
        cur.execute("SELECT id, username, password_hash, is_admin FROM users WHERE username = %s", (username,))
        user = cur.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            payload = {
                'user_id': user[0],
                'username': user[1],
                'is_admin': user[3],
                'exp': datetime.now(UTC) + timedelta(hours=2) # Sessão de 2 horas de duração
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

            response_data = jsonify({"message": "Login realizado com sucesso!"})
            response = make_response(response_data)

            response.set_cookie(
                'jwt_token',
                token,
                httponly=True,
                secure=False, # Altere para True em produção com HTTPS (Render)
                samesite='Lax',
                path='/'
            )
            return response
        else:
            return jsonify({"message": "Credenciais inválidas."}), 401
    except Exception as e:
        print(f"Erro no login: {e}")
        return jsonify({"message": "Erro interno de autenticação."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/me', methods=['GET'])
def get_current_user():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Token inválido ou expirado."}), 401

    return jsonify({
        "user_id": payload['user_id'],
        "username": payload['username'],
        "is_admin": payload.get('is_admin', False)
    }), 200

# --- Administração Unificada (Secret Admin / Supervision Dashboard) ---

@app.route('/users', methods=['GET'])
def get_users():
    if not validate_admin_token():
        return jsonify({"message": "Acesso negado."}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500

    try:
        cur = conn.cursor()
        # Une as tabelas para exibir informações de contas e o progresso do jogo de uma só vez
        cur.execute("""
            SELECT u.id, u.username, u.is_admin, u.created_at, r.estrelas, r.conquista_aranha
            FROM users u
            LEFT JOIN semae_ranking r ON u.id = r.user_id
            ORDER BY u.created_at DESC
        """)
        users = cur.fetchall()

        users_list = []
        for u in users:
            users_list.append({
                "id": u[0],
                "username": u[1],
                "is_admin": u[2],
                "created_at": u[3].strftime("%Y-%m-%d %H:%M:%S") if u[3] else None,
                "estrelas": u[4] if u[4] is not None else 0,
                "conquista_aranha": u[5] if u[5] is not None else False
            })
            
        return jsonify(users_list), 200
    except psycopg2.Error as e:
        print(f"Erro ao listar operadores: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao listar operadores."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not validate_admin_token():
        return jsonify({"message": "Acesso negado."}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500

    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))

        if cur.rowcount == 0:
            return jsonify({"message": "Operador não encontrado."}), 404

        conn.commit()
        return jsonify({"message": f"Operador ID {user_id} removido com sucesso."}), 200
    except psycopg2.Error as e:
        print(f"Erro ao deletar operador (ID: {user_id}): {e}")
        return jsonify({"message": "Ocorreu um erro interno ao remover o operador."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/server-status', methods=['GET'])
def api_server_status():
    token = get_token_from_request()
    if not validate_token(token):
        return jsonify({"message": "Não autorizado"}), 401
    
    # Retorna o status de conexão baseando-se na disponibilidade do banco de dados
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"storage_status": "green"}), 200
    else:
        return jsonify({"storage_status": "red"}), 200

# =====================================================================
# ROTAS DE API DA TABELA DE RANKING (SEMAE_RANKING)
# =====================================================================

@app.route('/api/save-score', methods=['POST'])
def save_score():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Não autorizado."}), 401
        
    data = request.get_json() or {}
    estrelas = data.get('estrelas', 0)
    conquista_aranha = data.get('conquista_aranha', False)
    username_jogo = data.get('username_jogo') # Pega o nome digitado no jogo (ex: 'aaa')
    
    user_id = payload['user_id']
    # Se o jogo não enviar um nome personalizado, usamos o usuário da conta como fallback
    username = username_jogo if username_jogo else payload['username']
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500
        
    try:
        cur = conn.cursor()
        # Atualiza o registro. Se o usuário já existir, atualiza o nome do jogo, estrelas e conquista
        cur.execute("""
            INSERT INTO semae_ranking (user_id, username, estrelas, conquista_aranha)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                estrelas = GREATEST(semae_ranking.estrelas, EXCLUDED.estrelas),
                conquista_aranha = semae_ranking.conquista_aranha OR EXCLUDED.conquista_aranha,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, username, estrelas, conquista_aranha))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Pontuação atualizada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao salvar pontuação: {e}")
        return jsonify({"message": "Erro interno ao atualizar pontuação."}), 500

@app.route('/api/get-ranking', methods=['GET'])
def get_ranking():
    token = get_token_from_request()
    if not validate_token(token):
        return jsonify({"message": "Não autorizado."}), 401
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco de dados."}), 500
        
    try:
        cur = conn.cursor()
        # Recupera as pontuações ativas ordenadas por Estrelas (DESC), conquista (DESC) e tempo (DESC)
        cur.execute("""
            SELECT id, username, estrelas, conquista_aranha 
            FROM semae_ranking 
            WHERE estrelas > 0 
            ORDER BY estrelas DESC, conquista_aranha DESC, updated_at DESC
            LIMIT 50
        """)
        users = cur.fetchall()
        cur.close()
        conn.close()
        
        ranking_list = []
        for u in users:
            ranking_list.append({
                "id": u[0],
                "username": u[1],
                "estrelas": u[2],
                "conquista_aranha": u[3]
            })
        
        return jsonify(ranking_list), 200
    except Exception as e:
        print(f"Erro ao carregar ranking: {e}")
        return jsonify({"message": "Erro interno ao carregar ranking."}), 500

if __name__ == '__main__':
    # Habilita a execução local na porta 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
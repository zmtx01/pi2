# =========================================================
# pi2/app.py
# =========================================================

# 1. IMPORTAÇÕES E CONFIGURAÇÕES DO SERVIDOR
import os
from datetime import datetime, timedelta, UTC
import psycopg2
import bcrypt
import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request, render_template, redirect, url_for, make_response
from flask_cors import CORS

load_dotenv()

app = Flask(__name__, template_folder='.')
app.json.ensure_ascii = False
CORS(app)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não configurada no .env")
if not DB_PASSWORD:
    raise ValueError("DB_PASSWORD não configurada no .env")


# 2. CONEXÃO COM O BANCO DE DADOS E SEGURANÇA
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'  # Obrigatório para estabilidade no Supabase
        )
        return conn
    except psycopg2.Error as e:
        print(f"Erro ao conectar com PostgreSQL: {e}")
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


# 3. ROTAS DO FRONTEND (PÁGINAS)
# Keep-Alive que acorda o Render e executa consulta para manter o Supabase ativo
@app.route('/api/keep-alive', methods=['GET'])
def keep_alive():
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1;")
            cur.close()
            conn.close()
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "message": "Render e Supabase mantidos ativos com sucesso!"
            }), 200
        except Exception as e:
            if conn: conn.close()
            return jsonify({"status": "warning", "database_error": str(e)}), 500
    return jsonify({"status": "healthy", "database": "disconnected"}), 200

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

@app.route('/pi2')
def semae_index_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('templates/index.html')

@app.route('/pi2/sala')
def semae_sala_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('templates/sala.html')

@app.route('/pi2/mesa')
def semae_mesa_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('templates/mesa.html')

# Redirecionamento de segurança para quem acessar a rota antiga do Dia 1
@app.route('/pi2/dia1')
def semae_dia1_page():
    return redirect(url_for('semae_mesa_page'))

@app.route('/pi2/ranking')
def semae_ranking_page():
    token = request.cookies.get('jwt_token')
    if not token or not validate_token(token):
        return redirect(url_for('login_page'))
    return render_template('templates/ranking.html')

@app.route('/logout')
def logout():
    response = make_response(redirect(url_for('login_page')))
    response.set_cookie('jwt_token', '', expires=0, httponly=True, secure=False, samesite='Lax', path='/')
    return response


# 4. APIS DE AUTENTICAÇÃO E SUPERVISÃO
@app.route('/init-db')
def init_db():
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco."}), 500
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
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
        cur.execute("""
            ALTER TABLE semae_ranking 
            ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0;
        """)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Tabelas verificadas com sucesso!"}), 200
    except psycopg2.Error as e:
        return jsonify({"message": f"Erro de banco: {e}"}), 500

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de banco de dados."}), 500

    try:
        cur = conn.cursor()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute(
            "INSERT INTO users (username, password_hash, is_admin) VALUES (%s, %s, TRUE)",
            (username, hashed_password)
        )
        conn.commit()
        return jsonify({"message": "Conta criada com sucesso!"}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({"message": "Nome de usuário já cadastrado."}), 409
    except Exception as e:
        return jsonify({"message": "Erro ao criar conta."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/login', methods=['POST'])
def api_login_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Campos obrigatórios ausentes."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco."}), 500

    try:
        cur = conn.cursor()
        cur.execute("SELECT id, username, password_hash, is_admin FROM users WHERE username = %s", (username,))
        user = cur.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            payload = {
                'user_id': user[0],
                'username': user[1],
                'is_admin': user[3],
                'exp': datetime.now(UTC) + timedelta(hours=2)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            response = make_response(jsonify({"message": "Login autorizado!"}))
            response.set_cookie('jwt_token', token, httponly=True, secure=False, samesite='Lax', path='/')
            return response
        return jsonify({"message": "Credenciais incorretas."}), 401
    except Exception as e:
        return jsonify({"message": "Erro no servidor."}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/me', methods=['GET'])
def get_current_user():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Sessão inválida."}), 401
    return jsonify({
        "user_id": payload['user_id'],
        "username": payload['username'],
        "is_admin": payload.get('is_admin', False)
    }), 200

@app.route('/users', methods=['GET'])
def get_users():
    if not validate_admin_token():
        return jsonify({"message": "Acesso negado."}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de banco."}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.username, u.is_admin, u.created_at, r.username, r.estrelas, r.conquista_aranha, r.updated_at, r.progresso
            FROM users u
            LEFT JOIN semae_ranking r ON u.id = r.user_id
            ORDER BY u.created_at DESC
        """)
        users = cur.fetchall()
        users_list = []
        for u in users:
            prog = u[8] if u[8] is not None else 0
            prog_texto = "Iniciante"
            if prog == 1: prog_texto = "Explorando Oficina"
            elif prog == 2: prog_texto = "Dia 1 Em Progresso"
            elif prog >= 3: prog_texto = "Dia 1 Concluído"

            users_list.append({
                "id": u[0],
                "username": u[1],
                "is_admin": u[2],
                "created_at": u[3].strftime("%Y-%m-%d %H:%M:%S") if u[3] else None,
                "nick_jogo": u[4] if u[4] is not None else "Iniciante",
                "estrelas": u[5] if u[5] is not None else 0,
                "conquista_aranha": u[6] if u[6] is not None else False,
                "updated_at": u[7].strftime("%Y-%m-%d %H:%M:%S") if u[7] else "Sem atividade",
                "progresso_texto": prog_texto
            })
        return jsonify(users_list), 200
    except psycopg2.Error as e:
        return jsonify({"message": f"Erro ao listar: {e}"}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not validate_admin_token():
        return jsonify({"message": "Acesso negado."}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de banco."}), 500

    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        if cur.rowcount == 0:
            return jsonify({"message": "Não encontrado."}), 404
        conn.commit()
        return jsonify({"message": f"Usuário {user_id} removido."}), 200
    except psycopg2.Error as e:
        return jsonify({"message": f"Erro ao remover: {e}"}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if conn: conn.close()

@app.route('/api/server-status', methods=['GET'])
def api_server_status():
    token = get_token_from_request()
    if not validate_token(token):
        return jsonify({"message": "Não autorizado"}), 401
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"storage_status": "green"}), 200
    return jsonify({"storage_status": "red"}), 200


# 5. ROTAS DE API DO RANKING E PROGRESSO
@app.route('/api/save-score', methods=['POST'])
def save_score():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Não autorizado."}), 401

    data = request.get_json() or {}
    estrelas = data.get('estrelas', 0)
    progresso = data.get('progresso', 0)
    conquista_aranha = data.get('conquista_aranha', False)
    username_jogo = data.get('username_jogo')

    user_id = payload['user_id']
    username = username_jogo if username_jogo else payload['username']

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão com o banco."}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO semae_ranking (user_id, username, estrelas, progresso, conquista_aranha)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                estrelas = GREATEST(semae_ranking.estrelas, EXCLUDED.estrelas),
                progresso = GREATEST(semae_ranking.progresso, EXCLUDED.progresso),
                conquista_aranha = semae_ranking.conquista_aranha OR EXCLUDED.conquista_aranha,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, username, estrelas, progresso, conquista_aranha))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Pontuação salva com sucesso!"}), 200
    except Exception as e:
        return jsonify({"message": "Erro ao atualizar pontuação."}), 500

@app.route('/api/get-ranking', methods=['GET'])
def get_ranking():
    token = get_token_from_request()
    if not validate_token(token):
        return jsonify({"message": "Não autorizado."}), 401

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão."}), 500

    try:
        cur = conn.cursor()
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

        ranking_list = [{
            "id": u[0],
            "username": u[1],
            "estrelas": u[2],
            "conquista_aranha": u[3]
        } for u in users]
        return jsonify(ranking_list), 200
    except Exception as e:
        return jsonify({"message": "Erro ao carregar ranking."}), 500

@app.route('/api/my-progress', methods=['GET'])
def get_my_progress():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Não autorizado."}), 401

    user_id = payload['user_id']
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão."}), 500

    try:
        cur = conn.cursor()
        cur.execute("SELECT username, estrelas, conquista_aranha, progresso FROM semae_ranking WHERE user_id = %s", (user_id,))
        res = cur.fetchone()
        cur.close()
        conn.close()

        if res:
            return jsonify({
                "username_jogo": res[0],
                "estrelas": res[1],
                "conquista_aranha": res[2],
                "progresso": res[3] if res[3] is not None else 0
            }), 200
        return jsonify({
            "username_jogo": "",
            "estrelas": 0,
            "conquista_aranha": False,
            "progresso": 0
        }), 200
    except Exception as e:
        return jsonify({"message": "Erro ao buscar progresso."}), 500

@app.route('/api/reset-my-progress', methods=['POST'])
def reset_my_progress():
    token = get_token_from_request()
    payload = validate_token(token)
    if not payload:
        return jsonify({"message": "Não autorizado."}), 401
    user_id = payload['user_id']
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Erro de conexão."}), 500
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE semae_ranking
            SET progresso = 0, estrelas = 0, conquista_aranha = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """, (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Progresso resetado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"message": "Erro ao resetar."}), 500    

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
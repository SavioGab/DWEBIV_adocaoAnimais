from flask import Flask, render_template, request, jsonify
import rule
import os

from supabase import create_client, Client
from dotenv import load_dotenv


# ==========================================
# CONFIGURAÇÃO DO .ENV
# ==========================================

caminho_env = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    ".env"
)

load_dotenv(caminho_env)


# ==========================================
# CONFIGURAÇÃO DO FLASK
# ==========================================

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)


# ==========================================
# CONEXÃO COM O SUPABASE
# ==========================================

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_PUBLISHABLE_KEY")
)


# ==========================================
# PÁGINAS
# ==========================================

@app.route('/')
def home():
    return render_template("index.html")


@app.route('/cadastro')
def pagina_cadastro():
    return render_template("cadastro.html")


@app.route('/login')
def pagina_login():
    return render_template("login.html")


@app.route('/animais')
def pagina_animais():
    return render_template("animais.html")


@app.route('/detalhe')
def pagina_detalhe():
    return render_template("detalhe.html")


# ==========================================
# CADASTRO
# ==========================================

@app.route('/api/cadastro', methods=['POST'])
def cadastro():

    dados = request.get_json()

    nome = dados.get("nome")
    email = dados.get("email")
    telefone = dados.get("telefone")
    senha = dados.get("senha")
    confirmar_senha = dados.get("confirmarSenha")


    # ------------------------------
    # VALIDAR NOME
    # ------------------------------

    if not nome or not rule.nome_valido(nome):
        return jsonify({
            "mensagem": "Nome inválido."
        }), 400


    # ------------------------------
    # VALIDAR E-MAIL
    # ------------------------------

    if not email or not rule.email_valido(email):
        return jsonify({
            "mensagem": "E-mail inválido."
        }), 400


    # ------------------------------
    # VALIDAR TELEFONE
    # ------------------------------

    if not telefone or not rule.telefone_valido(telefone):
        return jsonify({
            "mensagem": "Telefone inválido."
        }), 400


    # ------------------------------
    # VALIDAR SENHA
    # ------------------------------

    if not senha or not rule.senha_valida(senha):
        return jsonify({
            "mensagem": "Senha inválida."
        }), 400


    # ------------------------------
    # CONFIRMAR SENHA
    # ------------------------------

    if not confirmar_senha:
        return jsonify({
            "mensagem": "Confirme sua senha."
        }), 400


    if not rule.senhas_iguais(senha, confirmar_senha):
        return jsonify({
            "mensagem": "As senhas não são iguais."
        }), 400


    # ------------------------------
    # VERIFICAR E-MAIL EXISTENTE
    # ------------------------------

    usuario_existente = (
        supabase
        .table("usuarios")
        .select("id")
        .eq("email", email)
        .execute()
    )

    if usuario_existente.data:
        return jsonify({
            "mensagem": "Este e-mail já está cadastrado."
        }), 409


    # ------------------------------
    # CRIAR USUÁRIO
    # ------------------------------

    novo_usuario = {
        "nome": nome,
        "email": email,
        "senha": senha,
        "telefone": telefone
    }


    resposta = (
        supabase
        .table("usuarios")
        .insert(novo_usuario)
        .execute()
    )


    # ------------------------------
    # VERIFICAR CADASTRO
    # ------------------------------

    if not resposta.data:
        return jsonify({
            "mensagem": "Não foi possível realizar o cadastro."
        }), 500


    return jsonify({
        "mensagem": "Cadastro realizado com sucesso!"
    }), 200


# ==========================================
# LOGIN
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():

    dados = request.get_json()

    email = dados.get("email")
    senha = dados.get("senha")


    # ------------------------------
    # VALIDAR E-MAIL
    # ------------------------------

    if not email or not rule.email_valido(email):
        return jsonify({
            "mensagem": "E-mail inválido."
        }), 400


    # ------------------------------
    # VALIDAR SENHA
    # ------------------------------

    if not senha or not rule.senha_valida(senha):
        return jsonify({
            "mensagem": "Senha inválida."
        }), 400


    # ------------------------------
    # PROCURAR USUÁRIO
    # ------------------------------

    resposta = (
        supabase
        .table("usuarios")
        .select("id, nome, email, telefone")
        .eq("email", email)
        .eq("senha", senha)
        .execute()
    )


    # ------------------------------
    # VERIFICAR LOGIN
    # ------------------------------

    if not resposta.data:
        return jsonify({
            "mensagem": "E-mail ou senha incorretos."
        }), 401


    usuario = resposta.data[0]


    return jsonify({
        "mensagem": "Login realizado com sucesso!",
        "usuario": usuario
    }), 200


# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == '__main__':
    app.run(debug=True)
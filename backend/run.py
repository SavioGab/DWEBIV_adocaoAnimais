from flask import Flask, render_template, request, jsonify
import rule
import os

from supabase import create_client, Client
from dotenv import load_dotenv


# ==========================================
# CARREGAR .ENV
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
# CONEXÃO COM SUPABASE
# ==========================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


# Cliente normal
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
)


# Cliente administrativo
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
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


@app.route('/auth/confirm')
def confirmar_email():
    return render_template("confirmacao.html")


@app.route('/recuperar-senha')
def pagina_recuperar_senha():
    return render_template("recuperar-senha.html")


@app.route('/redefinir-senha')
def pagina_redefinir_senha():
    return render_template("redefinir-senha.html")


# ==========================================
# CONFIGURAÇÃO PÚBLICA DO SUPABASE
# ==========================================

@app.route('/api/supabase-config')
def supabase_config():

    return jsonify({
        "url": SUPABASE_URL,
        "key": SUPABASE_PUBLISHABLE_KEY
    })


# ==========================================
# CADASTRO
# ==========================================

@app.route('/api/cadastro', methods=['POST'])
def cadastro():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "mensagem": "Nenhum dado foi enviado."
        }), 400

    nome = dados.get("nome")
    email = dados.get("email")
    telefone = dados.get("telefone")
    senha = dados.get("senha")
    confirmar_senha = dados.get("confirmarSenha")


    # ==========================================
    # VALIDAÇÕES
    # ==========================================

    if not nome or not rule.nome_valido(nome):
        return jsonify({
            "mensagem": "Nome inválido."
        }), 400


    if not email or not rule.email_valido(email):
        return jsonify({
            "mensagem": "E-mail inválido."
        }), 400


    if not telefone or not rule.telefone_valido(telefone):
        return jsonify({
            "mensagem": "Telefone inválido."
        }), 400


    if not senha or not rule.senha_valida(senha):
        return jsonify({
            "mensagem": "Senha inválida."
        }), 400


    if not confirmar_senha:
        return jsonify({
            "mensagem": "Confirme sua senha."
        }), 400


    if not rule.senhas_iguais(senha, confirmar_senha):
        return jsonify({
            "mensagem": "As senhas não são iguais."
        }), 400


    # ==========================================
    # CRIAR USUÁRIO NO SUPABASE AUTH
    # ==========================================

    try:

        resposta_auth = supabase.auth.sign_up({

            "email": email,

            "password": senha,

            "options": {

                "data": {
                    "nome": nome,
                    "telefone": telefone
                },

                "email_redirect_to":
                    "http://127.0.0.1:5000/auth/confirm"
            }
        })


    except Exception as erro:

        print(
            "Erro ao criar usuário no Auth:",
            erro
        )

        mensagem_erro = str(erro).lower()


        if (
            "already registered" in mensagem_erro
            or "already exists" in mensagem_erro
            or "user already registered" in mensagem_erro
        ):

            return jsonify({
                "mensagem":
                    "Este e-mail já está cadastrado."
            }), 409


        return jsonify({
            "mensagem":
                "Não foi possível criar a conta."
        }), 500


    # ==========================================
    # VERIFICAR USUÁRIO
    # ==========================================

    if not resposta_auth.user:

        return jsonify({
            "mensagem":
                "Não foi possível criar a conta."
        }), 500


    auth_id = resposta_auth.user.id


    # ==========================================
    # SALVAR PERFIL
    # ==========================================

    novo_usuario = {

        "auth_id": auth_id,

        "nome": nome,

        "email": email,

        "telefone": telefone
    }


    try:

        resposta_perfil = (

            supabase_admin

            .table("usuarios")

            .insert(novo_usuario)

            .execute()
        )


    except Exception as erro:

        print(
            "Erro ao salvar dados do usuário:",
            erro
        )

        mensagem_erro = str(erro).lower()


        if "duplicate key" in mensagem_erro:

            return jsonify({
                "mensagem":
                    "Este e-mail já possui um perfil cadastrado."
            }), 409


        return jsonify({
            "mensagem":
                "Conta criada, mas não foi possível salvar os dados do perfil."
        }), 500


    # ==========================================
    # VERIFICAR PERFIL
    # ==========================================

    if not resposta_perfil.data:

        return jsonify({
            "mensagem":
                "Conta criada, mas não foi possível salvar os dados do perfil."
        }), 500


    # ==========================================
    # RESPOSTA
    # ==========================================

    return jsonify({

        "mensagem":
            "Conta criada! Verifique seu e-mail para confirmar a conta."

    }), 200


# ==========================================
# LOGIN
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():

    dados = request.get_json()

    if not dados:

        return jsonify({
            "mensagem":
                "Nenhum dado foi enviado."
        }), 400


    email = dados.get("email")

    senha = dados.get("senha")


    # ==========================================
    # VALIDAÇÕES
    # ==========================================

    if not email or not rule.email_valido(email):

        return jsonify({
            "mensagem":
                "E-mail inválido."
        }), 400


    if not senha or not rule.senha_valida(senha):

        return jsonify({
            "mensagem":
                "Senha inválida."
        }), 400


    # ==========================================
    # LOGIN NO SUPABASE AUTH
    # ==========================================

    try:

        resposta_auth = (

            supabase.auth.sign_in_with_password({

                "email": email,

                "password": senha
            })
        )


    except Exception as erro:

        print(
            "Erro no login:",
            erro
        )

        mensagem_erro = str(erro).lower()


        # ==========================================
        # E-MAIL NÃO CONFIRMADO
        # ==========================================

        if (
            "email not confirmed" in mensagem_erro
            or "email_not_confirmed" in mensagem_erro
        ):

            return jsonify({
                "mensagem":
                    "Confirme seu e-mail antes de fazer login."
            }), 401


        return jsonify({
            "mensagem":
                "E-mail ou senha incorretos."
        }), 401


    # ==========================================
    # VERIFICAR USUÁRIO
    # ==========================================

    if not resposta_auth.user:

        return jsonify({
            "mensagem":
                "E-mail ou senha incorretos."
        }), 401


    auth_id = resposta_auth.user.id


    # ==========================================
    # BUSCAR PERFIL
    # ==========================================

    try:

        resposta_perfil = (

            supabase_admin

            .table("usuarios")

            .select(
                "id, auth_id, nome, email, telefone"
            )

            .eq(
                "auth_id",
                auth_id
            )

            .execute()
        )


    except Exception as erro:

        print(
            "Erro ao buscar perfil:",
            erro
        )

        return jsonify({
            "mensagem":
                "Não foi possível carregar os dados do usuário."
        }), 500


    # ==========================================
    # VERIFICAR PERFIL
    # ==========================================

    if not resposta_perfil.data:

        return jsonify({
            "mensagem":
                "Usuário autenticado, mas perfil não encontrado."
        }), 404


    usuario = resposta_perfil.data[0]


    # ==========================================
    # RESPOSTA
    # ==========================================

    return jsonify({

        "mensagem":
            "Login realizado com sucesso!",

        "usuario":
            usuario
    }), 200


# ==========================================
# RECUPERAÇÃO DE SENHA
# ==========================================

@app.route('/api/recuperar-senha', methods=['POST'])
def recuperar_senha():

    dados = request.get_json()


    # ==========================================
    # VERIFICAR DADOS
    # ==========================================

    if not dados:

        return jsonify({
            "mensagem":
                "Nenhum dado foi enviado."
        }), 400


    email = dados.get("email")


    # ==========================================
    # VALIDAR E-MAIL
    # ==========================================

    if not email or not rule.email_valido(email):

        return jsonify({
            "mensagem":
                "Digite um e-mail válido."
        }), 400


    # ==========================================
    # ENVIAR E-MAIL DE RECUPERAÇÃO
    # ==========================================

    try:

        supabase.auth.reset_password_for_email(

            email,

            {
                "redirect_to":
                    "http://127.0.0.1:5000/redefinir-senha"
            }
        )


    except Exception as erro:

        print(
            "Erro ao enviar recuperação:",
            erro
        )

        mensagem_erro = str(erro).lower()


        # ==========================================
        # LIMITE DE ENVIO DE E-MAIL
        # ==========================================

        if "rate limit" in mensagem_erro:

            return jsonify({
                "mensagem":
                    "Muitas tentativas de envio. Aguarde alguns minutos e tente novamente."
            }), 429


        # ==========================================
        # OUTROS ERROS
        # ==========================================

        return jsonify({
            "mensagem":
                "Não foi possível enviar o e-mail de recuperação."
        }), 500


    # ==========================================
    # RESPOSTA
    # ==========================================

    return jsonify({

        "mensagem":
            "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha."

    }), 200


# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == '__main__':

    app.run(
        debug=True
    )
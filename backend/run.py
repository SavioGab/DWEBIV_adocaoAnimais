from flask import Flask, render_template, request, jsonify, session
import rule
import os
import secrets

from supabase import create_client, Client

# O nome da classe de opções mudou entre versões do supabase-py
try:
    from supabase import ClientOptions
except ImportError:
    try:
        from supabase.client import ClientOptions
    except ImportError:
        from supabase import SyncClientOptions as ClientOptions

from dotenv import load_dotenv


# ==========================================
# CARREGAR .ENV
# ==========================================

caminho_env = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    ".env"
)

load_dotenv(caminho_env)


def variavel_obrigatoria(nome):

    valor = os.getenv(nome)

    if not valor:
        raise RuntimeError(
            f"A variável {nome} não foi encontrada. "
            f"Crie o arquivo .env na raiz do projeto "
            f"(use o .env.example como modelo)."
        )

    return valor


# ==========================================
# CONFIGURAÇÃO DO FLASK
# ==========================================

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)


# Chave usada para assinar o cookie de sessão (login).
# Se não existir no .env, uma chave temporária é criada
# (o login é perdido sempre que o servidor reiniciar).
app.secret_key = os.getenv("SECRET_KEY")

if not app.secret_key:
    print(
        "AVISO: SECRET_KEY não definida no .env. "
        "Usando chave temporária."
    )
    app.secret_key = secrets.token_hex(32)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# ==========================================
# CONEXÃO COM SUPABASE
# ==========================================

SUPABASE_URL = variavel_obrigatoria("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = variavel_obrigatoria("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_ROLE_KEY = variavel_obrigatoria("SUPABASE_SERVICE_ROLE_KEY")

# Endereço do site (usado nos links enviados por e-mail)
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:5000").rstrip("/")


def novo_cliente():
    """
    Cria um cliente Supabase NOVO a cada uso.

    O cliente guarda a sessão do último usuário que fez
    login. Se ele fosse compartilhado, um usuário poderia
    herdar a sessão de outro. O fluxo "implicit" faz os
    links de e-mail chegarem com #access_token (e não com
    ?code=), pois o código PKCE ficaria preso ao Python.
    """

    return create_client(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        options=ClientOptions(
            flow_type="implicit",
            persist_session=False,
            auto_refresh_token=False
        )
    )


# Cliente administrativo (somente no servidor!)
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(
        persist_session=False,
        auto_refresh_token=False
    )
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
# DESFAZER CONTA (ROLLBACK DO CADASTRO)
# ==========================================

def desfazer_conta(auth_id):

    try:
        supabase_admin.auth.admin.delete_user(str(auth_id))

    except Exception as erro:
        print("Erro ao desfazer conta:", erro)


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
            "mensagem":
                f"A senha deve ter pelo menos {rule.SENHA_MINIMA} caracteres."
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

        resposta_auth = novo_cliente().auth.sign_up({

            "email": email,

            "password": senha,

            "options": {

                "data": {
                    "nome": nome,
                    "telefone": telefone
                },

                "email_redirect_to":
                    f"{BASE_URL}/auth/confirm"
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


    # Com a confirmação de e-mail ativa, o Supabase NÃO
    # devolve erro quando o e-mail já existe: devolve um
    # usuário "falso" com a lista de identities vazia.
    identidades = getattr(resposta_auth.user, "identities", None)

    if identidades is not None and len(identidades) == 0:

        return jsonify({
            "mensagem":
                "Este e-mail já está cadastrado."
        }), 409


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


        # Desfaz a criação do usuário no Auth para não
        # deixar uma conta sem perfil (conta "órfã").
        desfazer_conta(auth_id)


        if "duplicate key" in mensagem_erro:

            return jsonify({
                "mensagem":
                    "Este e-mail já possui um perfil cadastrado."
            }), 409


        return jsonify({
            "mensagem":
                "Não foi possível concluir o cadastro. Tente novamente."
        }), 500


    # ==========================================
    # VERIFICAR PERFIL
    # ==========================================

    if not resposta_perfil.data:

        desfazer_conta(auth_id)

        return jsonify({
            "mensagem":
                "Não foi possível concluir o cadastro. Tente novamente."
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


    if not senha or senha.strip() == "":

        return jsonify({
            "mensagem":
                "Digite sua senha."
        }), 400


    # ==========================================
    # LOGIN NO SUPABASE AUTH
    # ==========================================

    try:

        resposta_auth = (

            novo_cliente().auth.sign_in_with_password({

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
    # INICIAR SESSÃO (COOKIE ASSINADO PELO SERVIDOR)
    # ==========================================

    session.clear()

    session["auth_id"] = str(auth_id)
    session["usuario"] = usuario


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

        novo_cliente().auth.reset_password_for_email(

            email,

            {
                "redirect_to":
                    f"{BASE_URL}/redefinir-senha"
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
# USUÁRIO LOGADO
# ==========================================

@app.route('/api/me')
def usuario_logado():

    usuario = session.get("usuario")

    if not usuario:

        return jsonify({
            "logado": False
        }), 401

    return jsonify({
        "logado": True,
        "usuario": usuario
    }), 200


# ==========================================
# LOGOUT
# ==========================================

@app.route('/api/logout', methods=['POST'])
def logout():

    session.clear()

    return jsonify({
        "mensagem": "Logout realizado com sucesso."
    }), 200


# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == '__main__':

    app.run(
        debug=os.getenv("FLASK_DEBUG", "1") == "1"
    )
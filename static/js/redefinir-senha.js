// ==========================================
// REDEFINIR SENHA - ADOTAPET
// ==========================================

const formRedefinirSenha =
    document.getElementById("formRedefinirSenha");

const senha =
    document.getElementById("senha");

const confirmarSenha =
    document.getElementById("confirmar-senha");

const erroSenha =
    document.getElementById("erro-senha");

const erroConfirmarSenha =
    document.getElementById("erro-confirmar-senha");

const mensagemRedefinirSenha =
    document.getElementById("mensagem-redefinir-senha");

const botaoRedefinir =
    document.getElementById("botaoRedefinir");

const botaoSenha =
    document.getElementById("botaoSenha");

const botaoConfirmarSenha =
    document.getElementById("botaoConfirmarSenha");

let clienteSupabase = null;


// ==========================================
// MOSTRAR / ESCONDER SENHA
// ==========================================

function alternarSenha(campo, botao) {

    if (campo.type === "password") {

        campo.type = "text";

        botao.textContent = "🙈";

        botao.setAttribute(
            "aria-label",
            "Esconder senha"
        );

    } else {

        campo.type = "password";

        botao.textContent = "👁";

        botao.setAttribute(
            "aria-label",
            "Mostrar senha"
        );
    }
}


botaoSenha.addEventListener(
    "click",
    function () {
        alternarSenha(
            senha,
            botaoSenha
        );
    }
);


botaoConfirmarSenha.addEventListener(
    "click",
    function () {
        alternarSenha(
            confirmarSenha,
            botaoConfirmarSenha
        );
    }
);


// ==========================================
// LIMPAR MENSAGENS
// ==========================================

function limparMensagens() {

    erroSenha.textContent = "";
    erroConfirmarSenha.textContent = "";
    mensagemRedefinirSenha.textContent = "";

    erroSenha.style.display = "none";
    erroConfirmarSenha.style.display = "none";
    mensagemRedefinirSenha.style.display = "none";
}


// ==========================================
// MOSTRAR MENSAGEM
// ==========================================

function mostrarMensagem(mensagem) {

    mensagemRedefinirSenha.textContent =
        mensagem;

    mensagemRedefinirSenha.style.display =
        "block";
}


// ==========================================
// INICIALIZAR SUPABASE
// ==========================================

async function iniciarSupabase() {

    try {

        const resposta =
            await fetch("/api/supabase-config");

        const configuracao =
            await resposta.json();

        clienteSupabase =
            window.supabase.createClient(
                configuracao.url,
                configuracao.key
            );

        return true;

    } catch (erro) {

        console.error(
            "Erro ao iniciar Supabase:",
            erro
        );

        mostrarMensagem(
            "Não foi possível iniciar a recuperação de senha."
        );

        return false;
    }
}


// ==========================================
// PREPARAR SESSÃO DE RECUPERAÇÃO
// ==========================================

async function prepararRecuperacao() {

    try {

        // ----------------------------------
        // 1. Verifica se já existe sessão
        // ----------------------------------

        const sessaoAtual =
            await clienteSupabase.auth.getSession();

        if (sessaoAtual.data.session) {
            console.log(
                "Sessão de recuperação encontrada."
            );

            return true;
        }


        // ----------------------------------
        // 2. Verifica o hash da URL
        // ----------------------------------

        const hash =
            window.location.hash.substring(1);

        const parametrosHash =
            new URLSearchParams(hash);

        const accessToken =
            parametrosHash.get(
                "access_token"
            );

        const refreshToken =
            parametrosHash.get(
                "refresh_token"
            );


        // ----------------------------------
        // 3. Se houver tokens, cria sessão
        // ----------------------------------

        if (accessToken && refreshToken) {

            console.log(
                "Token de recuperação encontrado."
            );

            const resultado =
                await clienteSupabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

            if (resultado.error) {
                throw resultado.error;
            }

            console.log(
                "Sessão de recuperação criada."
            );

            // Remove os tokens da URL
            // depois de criar a sessão.
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

            return true;
        }


        // ----------------------------------
        // 4. Verifica o parâmetro ?code=
        // ----------------------------------

        const parametrosURL =
            new URLSearchParams(
                window.location.search
            );

        const codigo =
            parametrosURL.get("code");


        if (codigo) {

            console.log(
                "Código de recuperação encontrado."
            );

            const resultado =
                await clienteSupabase.auth
                    .exchangeCodeForSession(codigo);

            if (resultado.error) {
                throw resultado.error;
            }

            console.log(
                "Sessão criada através do código."
            );

            // Remove o código da URL.
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

            return true;
        }


        // ----------------------------------
        // 5. Nada foi encontrado
        // ----------------------------------

        console.log(
            "Nenhum token ou código encontrado."
        );

        mostrarMensagem(
            "O link de recuperação é inválido ou expirou."
        );

        return false;


    } catch (erro) {

        console.error(
            "Erro ao preparar recuperação:",
            erro
        );

        mostrarMensagem(
            "O link de recuperação é inválido ou expirou."
        );

        return false;
    }
}


// ==========================================
// REDEFINIR SENHA
// ==========================================

formRedefinirSenha.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        // ----------------------------------
        // Verifica senha
        // ----------------------------------

        if (senha.value.trim() === "") {

            erroSenha.textContent =
                "Digite uma nova senha.";

            erroSenha.style.display =
                "block";

            senha.focus();

            return;
        }


        // ----------------------------------
        // Verifica confirmação
        // ----------------------------------

        if (
            confirmarSenha.value.trim() === ""
        ) {

            erroConfirmarSenha.textContent =
                "Confirme sua nova senha.";

            erroConfirmarSenha.style.display =
                "block";

            confirmarSenha.focus();

            return;
        }


        // ----------------------------------
        // Verifica se são iguais
        // ----------------------------------

        if (
            senha.value !==
            confirmarSenha.value
        ) {

            erroConfirmarSenha.textContent =
                "As senhas não são iguais.";

            erroConfirmarSenha.style.display =
                "block";

            senha.value = "";
            confirmarSenha.value = "";

            senha.focus();

            return;
        }


        // ----------------------------------
        // Desabilita botão
        // ----------------------------------

        botaoRedefinir.disabled = true;

        botaoRedefinir.textContent =
            "Alterando senha...";


        try {

            // ----------------------------------
            // Verifica sessão atual
            // ----------------------------------

            const resultadoSessao =
                await clienteSupabase.auth.getSession();

            if (
                !resultadoSessao.data.session
            ) {

                mostrarMensagem(
                    "O link de recuperação expirou. Solicite um novo link."
                );

                return;
            }


            // ----------------------------------
            // Atualiza senha
            // ----------------------------------

            const resultado =
                await clienteSupabase.auth.updateUser({
                    password: senha.value
                });


            if (resultado.error) {
                throw resultado.error;
            }


            // ----------------------------------
            // Sucesso
            // ----------------------------------

            mostrarMensagem(
                "Senha alterada com sucesso! Redirecionando..."
            );


            setTimeout(
                function () {
                    window.location.href =
                        "/login";
                },
                1000
            );


        } catch (erro) {

            console.error(
                "Erro ao redefinir senha:",
                erro
            );

            mostrarMensagem(
                "Não foi possível alterar a senha. Solicite um novo link de recuperação."
            );

        } finally {

            botaoRedefinir.disabled = false;

            botaoRedefinir.textContent =
                "Redefinir senha";
        }
    }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarPagina() {

    const supabaseIniciado =
        await iniciarSupabase();

    if (!supabaseIniciado) {
        return;
    }

    await prepararRecuperacao();
}

iniciarPagina();
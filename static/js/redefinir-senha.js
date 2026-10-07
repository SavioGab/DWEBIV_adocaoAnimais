// ==========================================
// REDEFINIR SENHA - ADOTAPET
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
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

const mensagemRedefinicao =
    document.getElementById("mensagem-redefinicao");

const botaoRedefinir =
    document.getElementById("botaoRedefinir");

const botaoSenha =
    document.getElementById("botaoSenha");

const botaoConfirmarSenha =
    document.getElementById("botaoConfirmarSenha");


// ==========================================
// SUPABASE
// ==========================================

// Nome diferente para evitar conflito
// com outra variável chamada "supabase".

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
    mensagemRedefinicao.textContent = "";

    erroSenha.style.display = "none";
    erroConfirmarSenha.style.display = "none";
    mensagemRedefinicao.style.display = "none";
}


// ==========================================
// MOSTRAR MENSAGEM
// ==========================================

function mostrarMensagem(mensagem) {

    mensagemRedefinicao.textContent =
        mensagem;

    mensagemRedefinicao.style.display =
        "block";
}


// ==========================================
// INICIALIZAR SUPABASE
// ==========================================

async function inicializarSupabase() {

    try {

        const resposta = await fetch(
            "/api/supabase-config"
        );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar a configuração do Supabase."
            );
        }


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
            "Erro ao inicializar Supabase:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar a página. Tente novamente."
        );


        return false;
    }
}


// ==========================================
// PEGAR TOKEN DO LINK
// ==========================================

async function prepararSessao() {

    const hash =
        window.location.hash.substring(1);


    const parametros =
        new URLSearchParams(hash);


    const accessToken =
        parametros.get("access_token");


    const refreshToken =
        parametros.get("refresh_token");


    const tipo =
        parametros.get("type");


    // ==========================================
    // VERIFICAR TOKEN
    // ==========================================

    if (!accessToken || !refreshToken) {

        mostrarMensagem(
            "Este link de recuperação é inválido ou expirou."
        );


        botaoRedefinir.disabled = true;


        return false;
    }


    // ==========================================
    // VERIFICAR TIPO
    // ==========================================

    if (
        tipo &&
        tipo !== "recovery"
    ) {

        mostrarMensagem(
            "Este link não é válido para redefinição de senha."
        );


        botaoRedefinir.disabled = true;


        return false;
    }


    // ==========================================
    // CRIAR SESSÃO
    // ==========================================

    try {

        const { error } =
            await clienteSupabase.auth.setSession({

                access_token:
                    accessToken,

                refresh_token:
                    refreshToken

            });


        if (error) {

            console.error(
                "Erro ao criar sessão:",
                error
            );


            mostrarMensagem(
                "Este link de recuperação é inválido ou expirou."
            );


            botaoRedefinir.disabled = true;


            return false;
        }


        // ==========================================
        // REMOVER TOKEN DA URL
        // ==========================================

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


        return true;


    } catch (erro) {

        console.error(
            "Erro ao preparar sessão:",
            erro
        );


        mostrarMensagem(
            "Não foi possível validar o link de recuperação."
        );


        botaoRedefinir.disabled = true;


        return false;
    }
}


// ==========================================
// INICIAR PÁGINA
// ==========================================

async function iniciarPagina() {

    const supabaseInicializado =
        await inicializarSupabase();


    if (!supabaseInicializado) {

        return;
    }


    await prepararSessao();
}


iniciarPagina();


// ==========================================
// FORMULÁRIO
// ==========================================

formRedefinirSenha.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        limparMensagens();


        // ======================================
        // VALIDAR SENHA VAZIA
        // ======================================

        if (senha.value.trim() === "") {

            erroSenha.textContent =
                "Digite uma senha.";

            erroSenha.style.display =
                "block";

            senha.focus();

            return;
        }


        // ======================================
        // VALIDAR CONFIRMAÇÃO VAZIA
        // ======================================

        if (confirmarSenha.value.trim() === "") {

            erroConfirmarSenha.textContent =
                "Confirme sua senha.";

            erroConfirmarSenha.style.display =
                "block";

            confirmarSenha.focus();

            return;
        }


        // ======================================
        // VERIFICAR SENHAS IGUAIS
        // ======================================

        if (senha.value !== confirmarSenha.value) {

            erroConfirmarSenha.textContent =
                "As senhas não são iguais.";

            erroConfirmarSenha.style.display =
                "block";

            confirmarSenha.focus();

            return;
        }


        // ======================================
        // VERIFICAR SUPABASE
        // ======================================

        if (!clienteSupabase) {

            mostrarMensagem(
                "A página ainda não foi carregada completamente."
            );

            return;
        }


        // ======================================
        // DESABILITAR BOTÃO
        // ======================================

        botaoRedefinir.disabled =
            true;

        botaoRedefinir.textContent =
            "Alterando...";


        // ======================================
        // ALTERAR SENHA
        // ======================================

        try {

            const { error } =
                await clienteSupabase.auth.updateUser({

                    password:
                        senha.value

                });


            // ======================================
            // VERIFICAR ERRO
            // ======================================

            if (error) {

                console.error(
                    "Erro ao alterar senha:",
                    error
                );


                mostrarMensagem(
                    "Não foi possível alterar sua senha. O link pode ter expirado."
                );


                botaoRedefinir.disabled =
                    false;

                botaoRedefinir.textContent =
                    "Redefinir senha";

                return;
            }


            // ======================================
            // SUCESSO
            // ======================================

            window.location.href =
                "/login";

        } catch (erro) {

            console.error(
                "Erro ao redefinir senha:",
                erro
            );


            mostrarMensagem(
                "Não foi possível alterar sua senha. Tente novamente."
            );


            botaoRedefinir.disabled =
                false;

            botaoRedefinir.textContent =
                "Redefinir senha";
        }

    }
);
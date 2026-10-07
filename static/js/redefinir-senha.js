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


let supabase = null;


// ==========================================
// MENSAGENS
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

    mensagemRedefinicao.textContent = mensagem;

    mensagemRedefinicao.style.display = "block";
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


        supabase = window.supabase.createClient(
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


    // Não encontrou os tokens

    if (!accessToken || !refreshToken) {

        mostrarMensagem(
            "Este link de recuperação é inválido ou expirou."
        );

        botaoRedefinir.disabled = true;

        return false;
    }


    // Verificar se é recuperação de senha

    if (tipo && tipo !== "recovery") {

        mostrarMensagem(
            "Este link não é válido para redefinição de senha."
        );

        botaoRedefinir.disabled = true;

        return false;
    }


    try {

        const { error } =
            await supabase.auth.setSession({

                access_token: accessToken,

                refresh_token: refreshToken
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


        // Remover os tokens da barra de endereço

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
// REDEFINIR SENHA
// ==========================================

formRedefinirSenha.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        // ==========================================
        // VALIDAR SENHA
        // ==========================================

        if (senha.value.trim() === "") {

            erroSenha.textContent =
                "Digite uma nova senha.";

            erroSenha.style.display =
                "block";

            senha.focus();

            return;
        }


        if (confirmarSenha.value.trim() === "") {

            erroConfirmarSenha.textContent =
                "Confirme sua nova senha.";

            erroConfirmarSenha.style.display =
                "block";

            confirmarSenha.focus();

            return;
        }


        if (senha.value !== confirmarSenha.value) {

            erroConfirmarSenha.textContent =
                "As senhas não são iguais.";

            erroConfirmarSenha.style.display =
                "block";

            senha.value = "";
            confirmarSenha.value = "";

            senha.focus();

            return;
        }


        // ==========================================
        // VERIFICAR SUPABASE
        // ==========================================

        if (!supabase) {

            mostrarMensagem(
                "A página ainda não foi carregada completamente."
            );

            return;
        }


        // ==========================================
        // ALTERAR SENHA
        // ==========================================

        botaoRedefinir.disabled = true;

        botaoRedefinir.textContent =
            "Alterando...";


        try {

            const { error } =
                await supabase.auth.updateUser({

                    password: senha.value

                });


            if (error) {

                console.error(
                    "Erro ao alterar senha:",
                    error
                );

                mostrarMensagem(
                    "Não foi possível alterar sua senha. O link pode ter expirado."
                );

                return;
            }


            // ==========================================
            // SUCESSO
            // ==========================================

            mostrarMensagem(
                "Senha alterada com sucesso! Você já pode fazer login."
            );


            senha.value = "";
            confirmarSenha.value = "";


        } catch (erro) {

            console.error(
                "Erro ao redefinir senha:",
                erro
            );

            mostrarMensagem(
                "Não foi possível alterar sua senha."
            );


        } finally {

            botaoRedefinir.disabled = false;

            botaoRedefinir.textContent =
                "Redefinir senha";
        }
    }
);
// ==========================================
// LOGIN - ADOTAPET
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const formLogin = document.getElementById("formLogin");

const email = document.getElementById("email");
const senha = document.getElementById("senha");

const erroEmail = document.getElementById("erro-email");
const erroSenha = document.getElementById("erro-senha");

const mensagemLogin = document.getElementById("mensagem-login");

const botaoEntrar = document.getElementById("botaoEntrar");
const botaoSenha = document.getElementById("botaoSenha");


// ==========================================
// MOSTRAR / ESCONDER SENHA
// ==========================================

botaoSenha.addEventListener("click", function () {

    if (senha.type === "password") {

        senha.type = "text";

        botaoSenha.textContent = "🙈";

        botaoSenha.setAttribute(
            "aria-label",
            "Esconder senha"
        );

    } else {

        senha.type = "password";

        botaoSenha.textContent = "👁";

        botaoSenha.setAttribute(
            "aria-label",
            "Mostrar senha"
        );
    }

});


// ==========================================
// FUNÇÃO PARA LIMPAR MENSAGENS
// ==========================================

function limparMensagens() {

    erroEmail.textContent = "";
    erroSenha.textContent = "";
    mensagemLogin.textContent = "";

    erroEmail.style.display = "none";
    erroSenha.style.display = "none";
    mensagemLogin.style.display = "none";

}


// ==========================================
// LOGIN
// ==========================================

formLogin.addEventListener("submit", async function (event) {

    event.preventDefault();

    limparMensagens();


    // ======================================
    // VALIDAÇÃO DO E-MAIL
    // ======================================

    if (email.value.trim() === "") {

        erroEmail.textContent = "Digite seu e-mail.";
        erroEmail.style.display = "block";

        email.focus();

        return;
    }


    if (!email.checkValidity()) {

        erroEmail.textContent =
            "Digite um e-mail válido.";

        erroEmail.style.display = "block";

        email.focus();

        return;
    }


    // ======================================
    // VALIDAÇÃO DA SENHA
    // ======================================

    if (senha.value.trim() === "") {

        erroSenha.textContent =
            "Digite sua senha.";

        erroSenha.style.display = "block";

        senha.focus();

        return;
    }


    // ======================================
    // PREPARA OS DADOS
    // ======================================

    const dadosLogin = {

        email: email.value.trim(),

        senha: senha.value

    };


    // ======================================
    // DESABILITA O BOTÃO
    // ======================================

    botaoEntrar.disabled = true;

    botaoEntrar.textContent = "Entrando...";


    try {

        // ==================================
        // ENVIA PARA O BACK-END
        // ==================================

        const resposta = await fetch(
            "/api/login",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(dadosLogin)

            }
        );


        // ==================================
        // RECEBE A RESPOSTA DO BACK-END
        // ==================================

        const resultado = await resposta.json();


        // ==================================
        // LOGIN BEM-SUCEDIDO
        // ==================================

        if (resposta.ok) {

            /*
             * O back-end poderá retornar algo
             * como:
             *
             * {
             *     sucesso: true,
             *     usuario: {...}
             * }
             */

            // Guarda os dados do usuário
            // para serem utilizados posteriormente
            if (resultado.usuario) {

                sessionStorage.setItem(
                    "usuario",
                    JSON.stringify(resultado.usuario)
                );

            }


            // Vai para a página principal
            window.location.href = "/animais";

            return;
        }


        // ==================================
        // ERRO DE LOGIN
        // ==================================

        mensagemLogin.textContent =
            resultado.mensagem ||
            "E-mail ou senha incorretos.";

        mensagemLogin.style.display = "block";


    } catch (erro) {

        // ==================================
        // ERRO DE CONEXÃO
        // ==================================

        mensagemLogin.textContent =
            "Não foi possível conectar ao servidor. Tente novamente.";

        mensagemLogin.style.display = "block";

        console.error(
            "Erro ao realizar login:",
            erro
        );

    } finally {

        // ==================================
        // DEVOLVE O BOTÃO AO NORMAL
        // ==================================

        botaoEntrar.disabled = false;

        botaoEntrar.textContent = "Entrar";

    }

});
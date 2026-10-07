const formRecuperarSenha =
    document.getElementById("formRecuperarSenha");

const email =
    document.getElementById("email");

const erroEmail =
    document.getElementById("erro-email");

const mensagemRecuperacao =
    document.getElementById("mensagem-recuperacao");

const botaoEnviar =
    document.getElementById("botaoEnviar");


function limparMensagens() {

    erroEmail.textContent = "";
    mensagemRecuperacao.textContent = "";

    erroEmail.style.display = "none";
    mensagemRecuperacao.style.display = "none";
}


formRecuperarSenha.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        // ==========================================
        // VALIDAR E-MAIL
        // ==========================================

        if (email.value.trim() === "") {

            erroEmail.textContent =
                "Digite seu e-mail.";

            erroEmail.style.display =
                "block";

            email.focus();

            return;
        }


        if (!email.checkValidity()) {

            erroEmail.textContent =
                "Digite um e-mail válido.";

            erroEmail.style.display =
                "block";

            email.focus();

            return;
        }


        // ==========================================
        // ENVIAR PEDIDO
        // ==========================================

        botaoEnviar.disabled = true;

        botaoEnviar.textContent =
            "Enviando...";


        try {

            const resposta = await fetch(
                "/api/recuperar-senha",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email.value.trim()
                    })
                }
            );


            const resultado =
                await resposta.json();


            // ==========================================
            // SUCESSO
            // ==========================================

            if (resposta.ok) {

                mensagemRecuperacao.textContent =
                    "Link enviado! Verifique seu e-mail para redefinir sua senha.";

                mensagemRecuperacao.style.display =
                    "block";

                email.value = "";

                return;
            }


            // ==========================================
            // ERRO
            // ==========================================

            mensagemRecuperacao.textContent =
                resultado.mensagem ||
                "Não foi possível enviar o link.";

            mensagemRecuperacao.style.display =
                "block";


        } catch (erro) {

            mensagemRecuperacao.textContent =
                "Não foi possível conectar ao servidor. Tente novamente.";

            mensagemRecuperacao.style.display =
                "block";

            console.error(
                "Erro ao recuperar senha:",
                erro
            );


        } finally {

            botaoEnviar.disabled = false;

            botaoEnviar.textContent =
                "Enviar link";
        }
    }
);
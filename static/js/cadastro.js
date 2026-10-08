// ==========================================
// CADASTRO - ADOTAPET
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const formCadastro = document.getElementById("formCadastro");

const nome = document.getElementById("nome");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmar-senha");

const erroNome = document.getElementById("erro-nome");
const erroEmail = document.getElementById("erro-email");
const erroTelefone = document.getElementById("erro-telefone");
const erroSenha = document.getElementById("erro-senha");
const erroConfirmarSenha =
    document.getElementById("erro-confirmar-senha");

const mensagemCadastro =
    document.getElementById("mensagem-cadastro");

const botaoCadastrar =
    document.getElementById("botaoCadastrar");

const botaoSenha =
    document.getElementById("botaoSenha");

const botaoConfirmarSenha =
    document.getElementById("botaoConfirmarSenha");


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


botaoSenha.addEventListener("click", function () {

    alternarSenha(senha, botaoSenha);

});


botaoConfirmarSenha.addEventListener("click", function () {

    alternarSenha(confirmarSenha, botaoConfirmarSenha);

});


// ==========================================
// LIMPAR MENSAGENS
// ==========================================

function limparMensagens() {

    erroNome.textContent = "";
    erroEmail.textContent = "";
    erroTelefone.textContent = "";
    erroSenha.textContent = "";
    erroConfirmarSenha.textContent = "";
    mensagemCadastro.textContent = "";
    mensagemCadastro.classList.remove("sucesso");

    erroNome.style.display = "none";
    erroEmail.style.display = "none";
    erroTelefone.style.display = "none";
    erroSenha.style.display = "none";
    erroConfirmarSenha.style.display = "none";
    mensagemCadastro.style.display = "none";
}


// ==========================================
// FORMULÁRIO DE CADASTRO
// ==========================================

formCadastro.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        // ======================================
        // VALIDAR NOME
        // ======================================

        const nomeDigitado = nome.value.trim();

        const nomes = nomeDigitado.split(/\s+/);

        const nomeValido =
            nomes.length >= 2 &&
            nomes[0].length >= 3 &&
            nomes[nomes.length - 1].length >= 3 &&
            nomes.every(
                nomeAtual =>
                    /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/
                        .test(nomeAtual)
            );


        if (!nomeValido) {

            erroNome.textContent =
                "Digite seu nome completo.";

            erroNome.style.display = "block";

            nome.focus();

            return;
        }


        // ======================================
        // VALIDAR E-MAIL
        // ======================================

        if (email.value.trim() === "") {

            erroEmail.textContent =
                "Digite seu e-mail.";

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
        // VALIDAR TELEFONE
        // ======================================

        const numerosTelefone =
            telefone.value.replace(/\D/g, "");


        if (numerosTelefone.length !== 11) {

            erroTelefone.textContent =
                "Digite um telefone válido com 11 números.";

            erroTelefone.style.display = "block";

            telefone.focus();

            return;
        }


        // ======================================
        // VALIDAR SENHA
        // ======================================

        if (senha.value.trim() === "") {

            erroSenha.textContent =
                "Digite uma senha.";

            erroSenha.style.display = "block";

            senha.focus();

            return;
        }


        if (senha.value.length < 6) {

            erroSenha.textContent =
                "A senha deve ter pelo menos 6 caracteres.";

            erroSenha.style.display = "block";

            senha.focus();

            return;
        }


        // ======================================
        // VALIDAR CONFIRMAÇÃO DA SENHA
        // ======================================

        if (confirmarSenha.value.trim() === "") {

            erroConfirmarSenha.textContent =
                "Confirme sua senha.";

            erroConfirmarSenha.style.display = "block";

            confirmarSenha.focus();

            return;
        }


        // ======================================
        // VERIFICAR SE AS SENHAS SÃO IGUAIS
        // ======================================

        if (senha.value !== confirmarSenha.value) {

            erroConfirmarSenha.textContent =
                "As senhas não são iguais.";

            erroConfirmarSenha.style.display = "block";

            senha.value = "";
            confirmarSenha.value = "";

            senha.focus();

            return;
        }


        // ======================================
        // PREPARAR DADOS PARA O BACK-END
        // ======================================

        const dadosCadastro = {

            nome: nomeDigitado,

            email: email.value.trim(),

            telefone: numerosTelefone,

            senha: senha.value,

            confirmarSenha: confirmarSenha.value

        };


        // ======================================
        // DESABILITAR BOTÃO
        // ======================================

        botaoCadastrar.disabled = true;

        botaoCadastrar.textContent =
            "Criando conta...";


        try {

            // ==================================
            // ENVIAR PARA O BACK-END
            // ==================================

            const resposta = await fetch(
                "/api/cadastro",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(
                        dadosCadastro
                    )

                }
            );


            // ==================================
            // RECEBER RESPOSTA DO BACK-END
            // ==================================

            const resultado =
                await resposta.json();


            // ==================================
            // CADASTRO REALIZADO
            // ==================================

            if (resposta.ok) {

                mensagemCadastro.textContent =
                    resultado.mensagem ||
                    "Cadastro realizado! Verifique seu e-mail.";

                mensagemCadastro.classList.add("sucesso");

                mensagemCadastro.style.display =
                    "block";

                formCadastro.reset();


                // Não redireciona automaticamente.
                // O usuário precisa confirmar o e-mail
                // antes de fazer login.


                return;
            }


            // ==================================
            // ERRO DEVOLVIDO PELO BACK-END
            // ==================================

            mensagemCadastro.textContent =
                resultado.mensagem ||
                "Não foi possível realizar o cadastro.";

            mensagemCadastro.style.display =
                "block";


        } catch (erro) {

            // ==================================
            // ERRO DE CONEXÃO
            // ==================================

            mensagemCadastro.textContent =
                "Não foi possível conectar ao servidor. Tente novamente.";

            mensagemCadastro.style.display =
                "block";


            console.error(
                "Erro ao realizar cadastro:",
                erro
            );


        } finally {

            // ==================================
            // DEVOLVE O BOTÃO AO NORMAL
            // ==================================

            botaoCadastrar.disabled = false;

            botaoCadastrar.textContent =
                "Criar conta";

        }

    }
);
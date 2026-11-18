// ==========================================
// CAPTCHA (Cloudflare Turnstile)
// ==========================================
//
// O widget (carregado por api.js) coloca, dentro do formulário,
// um campo escondido chamado "cf-turnstile-response" com o token
// assim que a pessoa passa na verificação.
//
// Cada token vale UMA única vez. Por isso, depois de qualquer
// envio ao servidor (com sucesso ou erro), o widget é reiniciado.

const MENSAGEM_CAPTCHA = "Confirme que você não é um robô.";


function obterTokenCaptcha() {

    const campo = document.querySelector(
        '[name="cf-turnstile-response"]'
    );

    return campo ? campo.value : "";
}


function reiniciarCaptcha() {

    if (window.turnstile) {
        window.turnstile.reset();
    }
}

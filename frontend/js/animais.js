// ==========================================
// ANIMAIS - ADOTAPET
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const listaAnimais =
    document.getElementById("lista-animais");

const carregando =
    document.getElementById("carregando");

const erroAnimais =
    document.getElementById("erro-animais");

const nenhumAnimal =
    document.getElementById("nenhum-animal");

const pesquisa =
    document.getElementById("pesquisa");

const filtroTipo =
    document.getElementById("filtro-tipo");


// Guarda os animais recebidos do banco
let animais = [];


// ==========================================
// CARREGAR ANIMAIS
// ==========================================

async function carregarAnimais() {

    carregando.hidden = false;
    erroAnimais.hidden = true;
    nenhumAnimal.hidden = true;

    listaAnimais.innerHTML = "";


    try {

        /*
         * O back-end deverá disponibilizar:
         *
         * GET /api/animais
         *
         * Ele deverá buscar os animais no banco
         * de dados.
         */

        const resposta = await fetch(
            "/api/animais"
        );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar animais."
            );

        }


        const dados = await resposta.json();


        /*
         * Esperamos receber algo parecido com:
         *
         * {
         *     animais: [
         *         {
         *             id: 1,
         *             nome: "Luna",
         *             tipo: "cachorro",
         *             raca: "Pitbull",
         *             imagem: "...",
         *             localizacao: "Recife - PE",
         *             status: "DISPONIVEL"
         *         }
         *     ]
         * }
         */

        animais = dados.animais || [];


        carregando.hidden = true;


        // Mostra somente animais disponíveis
        const animaisDisponiveis =
            animais.filter(
                animal =>
                    animal.status === "DISPONIVEL"
            );


        exibirAnimais(animaisDisponiveis);


    } catch (erro) {

        console.error(
            "Erro ao carregar animais:",
            erro
        );

        carregando.hidden = true;

        erroAnimais.hidden = false;

    }

}


// ==========================================
// EXIBIR ANIMAIS
// ==========================================

function exibirAnimais(lista) {

    listaAnimais.innerHTML = "";

    nenhumAnimal.hidden = true;


    if (lista.length === 0) {

        nenhumAnimal.hidden = false;

        return;

    }


    lista.forEach(function (animal) {

        const card =
            criarCardAnimal(animal);

        listaAnimais.appendChild(card);

    });

}


// ==========================================
// CRIAR CARD DO ANIMAL
// ==========================================

function criarCardAnimal(animal) {

    const card =
        document.createElement("article");

    card.classList.add("card-animal");


    // --------------------------------------
    // IMAGEM
    // --------------------------------------

    const imagem =
        document.createElement("img");

    imagem.classList.add("imagem-animal");

    imagem.src =
        animal.imagem || "img/pet-placeholder.jpg";

    imagem.alt =
        `Foto de ${animal.nome}`;


    imagem.onerror = function () {

        this.src = "img/pet-placeholder.jpg";

    };


    // --------------------------------------
    // INFORMAÇÕES
    // --------------------------------------

    const informacoes =
        document.createElement("div");

    informacoes.classList.add(
        "informacoes-animal"
    );


    const nome =
        document.createElement("h2");

    nome.textContent =
        animal.nome;


    const tipo =
        document.createElement("p");

    tipo.innerHTML =
        `<strong>Tipo:</strong> ${animal.tipo}`;


    const raca =
        document.createElement("p");

    raca.innerHTML =
        `<strong>Raça:</strong> ${animal.raca}`;


    const localizacao =
        document.createElement("p");

    localizacao.innerHTML =
        `<strong>Localização:</strong> ${animal.localizacao}`;


    // --------------------------------------
    // STATUS
    // --------------------------------------

    const status =
        document.createElement("span");

    status.classList.add(
        "status-disponivel"
    );

    status.textContent =
        "Disponível para adoção";


    // --------------------------------------
    // BOTÃO ADOTAR
    // --------------------------------------

    const botaoAdotar =
        document.createElement("button");

    botaoAdotar.type = "button";

    botaoAdotar.classList.add(
        "botao-adotar"
    );

    botaoAdotar.textContent =
        "Adotar";


    botaoAdotar.addEventListener(
        "click",
        function () {

            verificarDisponibilidade(
                animal.id,
                botaoAdotar
            );

        }
    );


    // --------------------------------------
    // MONTAGEM DO CARD
    // --------------------------------------

    informacoes.appendChild(nome);
    informacoes.appendChild(tipo);
    informacoes.appendChild(raca);
    informacoes.appendChild(localizacao);
    informacoes.appendChild(status);
    informacoes.appendChild(botaoAdotar);

    card.appendChild(imagem);
    card.appendChild(informacoes);


    return card;

}


// ==========================================
// VERIFICAR DISPONIBILIDADE
// ==========================================

async function verificarDisponibilidade(
    animalId,
    botao
) {

    botao.disabled = true;

    botao.textContent =
        "Verificando...";


    try {

        /*
         * Antes de permitir a adoção,
         * consultamos o back-end.
         *
         * GET /api/animais/:id
         *
         * O back-end consulta novamente
         * o banco de dados.
         */

        const resposta =
            await fetch(
                `/api/animais/${animalId}`
            );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível verificar o animal."
            );

        }


        const dados =
            await resposta.json();


        const animal =
            dados.animal;


        // ----------------------------------
        // ANIMAL AINDA DISPONÍVEL
        // ----------------------------------

        if (
            animal &&
            animal.status === "DISPONIVEL"
        ) {

            /*
             * O animal ainda está disponível.
             *
             * Agora podemos ir para a tela
             * de detalhes/solicitação de adoção.
             */

            window.location.href =
                `detalhes.html?id=${animal.id}`;

            return;

        }


        // ----------------------------------
        // ANIMAL JÁ FOI ADOTADO
        // ----------------------------------

        alert(
            "Esse animal não está mais disponível para adoção."
        );


        // Atualiza a lista
        carregarAnimais();


    } catch (erro) {

        console.error(
            "Erro ao verificar disponibilidade:",
            erro
        );


        alert(
            "Não foi possível verificar a disponibilidade. Tente novamente."
        );


    } finally {

        botao.disabled = false;

        botao.textContent =
            "Adotar";

    }

}


// ==========================================
// PESQUISA
// ==========================================

function filtrarAnimais() {

    const texto =
        pesquisa.value
            .trim()
            .toLowerCase();


    const tipoSelecionado =
        filtroTipo.value;


    const resultado =
        animais.filter(function (animal) {

            // Apenas disponíveis
            if (
                animal.status !==
                "DISPONIVEL"
            ) {

                return false;

            }


            // Pesquisa
            const correspondePesquisa =
                !texto ||
                animal.nome
                    .toLowerCase()
                    .includes(texto) ||

                animal.raca
                    .toLowerCase()
                    .includes(texto) ||

                animal.localizacao
                    .toLowerCase()
                    .includes(texto);


            // Tipo
            const correspondeTipo =
                tipoSelecionado === "todos" ||
                animal.tipo
                    .toLowerCase() ===
                tipoSelecionado;


            return (
                correspondePesquisa &&
                correspondeTipo
            );

        });


    exibirAnimais(resultado);

}


// ==========================================
// EVENTOS DOS FILTROS
// ==========================================

pesquisa.addEventListener(
    "input",
    filtrarAnimais
);

filtroTipo.addEventListener(
    "change",
    filtrarAnimais
);


// ==========================================
// INICIAR PÁGINA
// ==========================================

carregarAnimais();
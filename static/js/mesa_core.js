// =========================================================
// static/js/mesa_core.js
// =========================================================

// 1. ESTADOS GLOBAIS E AUXILIARES
let chamadoAtivo = false;
let chamadosAberto = false;
let primeiraVisitaRealizada = false;

let jogoAtivo = false;
let modoMenuAcl = false; // Controle do menu interativo de acessibilidade no CMD
let faseAtual = 0;
let errosFase = 0;
let errosTotaisNoDia = 0;
let digitando = false;
let progressoDoUsuario = window.location.protocol === 'file:' ? 0 : -1;

let paginaAtual = 0;
let paginasLiberadas = 1;
let cadernoTravado = false;

const nomeSalvoRaw = localStorage.getItem('nomeEstagiario');
const nomeEstagiario = (nomeSalvoRaw || 'Estagiário').toUpperCase();
let roteiroAtual = [];

// LEITURA INSTANTÂNEA DA FASE SALVA (SEM ESPERAR REDE OU F5)
const faseSalvaLocal = localStorage.getItem(nomeEstagiario + '_fase_ativa');
if (faseSalvaLocal !== null) {
    faseAtual = parseInt(faseSalvaLocal, 10);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function carregarCartuchoNativoDia1(nome) {
    const nomeUpper = (nome || 'ESTAGIÁRIO').toUpperCase();
    return [
        {
            prompt: "ATENDIMENTO SE-CTI-26-0001\n\nO primeiro passo é verificar se o terminal\nestá funcionando corretamente.\n\nFaça o computador apresentar:\nTESTE DE TERMINAL INICIADO",
            esperado: ['print("teste de terminal iniciado")', "print('teste de terminal iniciado')"],
            dica_valor: "teste de terminal iniciado",
            erroMsg: "Use o comando print com parênteses e aspas para exibir a mensagem.",
            sucesso: "TESTE DE TERMINAL INICIADO\n\n<span class='transicao-verde'>[✓] TERMINAL OPERACIONAL</span>",
            proxEspera: 1000
        },
        {
            prompt: "O terminal está funcionando.\n\nO usuário deste chamado é:\n\nRafael Mendes\n\nFaça o computador perguntar o nome do usuário e aguardar a resposta.\nA pergunta deverá ser:\n<span class='interacao-amarela'>Qual é o nome do usuário?</span>",
            esperado: ['input("qual é o nome do usuário?")', "input('qual é o nome do usuário?')"],
            dica_valor: "Qual é o nome do usuário?",
            erroMsg: "O programa precisa fazer a pergunta usando a função input().",
            sucesso: "<span class='transicao-verde'>Qual é o nome do usuário?</span>"
        },
        {
            prompt: "",
            esperado: ['rafael mendes'],
            dica_valor: "Rafael Mendes",
            erroMsg: "Digite exatamente o nome do solicitante (Rafael Mendes).",
            sucesso: "<span class='transicao-verde'>[✓] INFORMAÇÃO CAPTURADA</span>\n\nUsuário informado:\nRafael Mendes",
            proxFaseSimulada: true,
            proxEspera: 1000
        },
        {
            prompt: "A informação foi recebida, mas precisamos guardá-la\npara não perguntar novamente.\n\nComplete o comando:\n\nusuario = ________(\"Qual é o nome do usuário?\")",
            esperado: ['input', 'input()', 'usuario=input("qual é o nome do usuário?")', "usuario=input('qual é o nome do usuário?')"],
            dica_valor: "input",
            erroMsg: "Preencha a lacuna com a função usada para receber dados do usuário.",
            sucesso: "<span class='transicao-verde'>[✓] INFORMAÇÃO ARMAZENADA</span>",
            proxEspera: 1000,
            substituirComando: 'usuario = input("Qual é o nome do usuário?")'
        },
        {
            prompt: "Agora mostre o nome do usuário utilizando a variável <span class='interacao-amarela'>usuario</span>.",
            esperado: ['print(usuario)'],
            dica_variavel: "usuario",
            erroMsg: "Use print() referenciando a variável 'usuario' (sem usar aspas).",
            sucesso: "Rafael Mendes\n\n<span class='transicao-verde'>[✓] VARIÁVEL UTILIZADA</span>",
            proxEspera: 1000
        },
        {
            prompt: "========================================\n             ESTAÇÃO ATD-07\n========================================\n\nO usuário informou que a estação está ligada.\n\nRegistre essa informação usando a variável:\n<span class='interacao-amarela'>computador_ligado</span>\n\nO valor deve representar VERDADEIRO.",
            esperado: ['computador_ligado = True', 'computador_ligado = true', 'computador_ligado=True', 'computador_ligado=true'],
            dica_variavel: "computador_ligado",
            dica_valor: "True",
            erroMsg: "Crie a variável 'computador_ligado' e atribua a ela o valor booleano True.",
            sucesso: "<span class='transicao-verde'>[✓] ESTADO REGISTRADO</span>\n\nATD-07\nCOMPUTADOR: LIGADO",
            proxEspera: 1000
        },
        {
            prompt: "A informação sobre o estado da estação foi registrada.\n\nAgora a estação também precisa saber o que fazer\nquando o computador NÃO estiver ligado.\n\nOrganize as instruções abaixo para formar o código correto:\n\n[ print(\"VERIFICAR ESTAÇÃO\") ]\n[ else: ]\n[ if computador_ligado: ]\n[ print(\"ESTAÇÃO OPERACIONAL\") ]\n\nDigite as linhas na ordem correta, uma por vez, e pressione Enter.",
            esperado: ['if computador_ligado:', 'if computador_ligado == True:', 'if computador_ligado == true:'],
            dica_variavel: "if computador_ligado:",
            erroMsg: "A estrutura de decisão deve começar avaliando a condição com 'if'.",
            sucesso: "",
            proxEspera: 0
        },
        {
            prompt: "",
            esperado: ['    print("estação operacional")', '    print(\'estação operacional\')', 'print("estação operacional")', 'print(\'estação operacional\')'],
            dica_valor: '    print("ESTAÇÃO OPERACIONAL")',
            erroMsg: "O que acontece se a condição for verdadeira? Digite o comando esperado.",
            sucesso: "",
            proxEspera: 0
        },
        {
            prompt: "",
            esperado: ['else:'],
            dica_valor: "else:",
            erroMsg: "Use 'else:' para definir o caminho alternativo.",
            sucesso: "",
            proxEspera: 0
        },
        {
            prompt: "",
            esperado: ['    print("verificar estação")', '    print(\'verificar estação\')', 'print("verificar estação")', 'print(\'verificar estação\')'],
            dica_valor: '    print("VERIFICAR ESTAÇÃO")',
            erroMsg: "O que acontece se a condição for falsa? Digite o comando esperado.",
            sucesso: "<span class='transicao-verde'>[✓] IF / ELSE CONCLUÍDO</span>",
            proxEspera: 1200
        },
        {
            prompt: "O supervisor precisa do resultado final.\n\nA estação está ligada.\n\nO diagnóstico deve apresentar:\n[OK] DIAGNÓSTICO CONCLUÍDO\n\nMonte a instrução necessária para que o terminal\nconfirme o diagnóstico.\n\n(Comece verificando a condição na 1ª linha)",
            esperado: ['if computador_ligado:', 'if computador_ligado == True:'],
            dica_variavel: "if computador_ligado:",
            erroMsg: "Você precisa verificar a condição novamente usando 'if'.",
            sucesso: "",
            proxEspera: 0
        },
        {
            prompt: "",
            esperado: ['    print("[ok] diagnóstico concluído")', '    print(\'[ok] diagnóstico concluído\')', 'print("[ok] diagnóstico concluído")', 'print(\'[ok] diagnóstico concluído\')'],
            dica_valor: '    print("[OK] DIAGNÓSTICO CONCLUÍDO")',
            erroMsg: "Execute a ação esperada dentro do if usando o print().",
            sucesso: `[OK] DIAGNÓSTICO CONCLUÍDO\n\n<span class='transicao-verde'>[✓] DIAGNÓSTICO CONCLUÍDO</span>\n\n=======================================\n             DIAGNÓSTICO REGISTRADO\n=======================================\n\nRESPOSTA DO MARCOS:\n\n${nomeUpper},\n\nPrimeiro atendimento concluído.\n\nVocê começou verificando se o terminal funcionava. Depois aprendeu a receber informações, guardá-las e tomar decisões usando if e else.\n\nEsse é o princípio.\n\n— Marcos Almeida\nSupervisor de TI\n\n=======================================\n\n<span class='interacao-amarela' style='cursor:pointer' onclick='encerrarDia()'>[ ENCERRAR DIA ]</span>`
        }
    ];
}

function garantirRoteiroCarregado() {
    if (roteiroAtual && roteiroAtual.length > 0) return;

    if (typeof window.obterRoteiroDia1 === 'function') {
        roteiroAtual = window.obterRoteiroDia1(nomeEstagiario);
    } else if (typeof obterRoteiroDia1 === 'function') {
        roteiroAtual = obterRoteiroDia1(nomeEstagiario);
    }

    if (!roteiroAtual || roteiroAtual.length === 0) {
        roteiroAtual = carregarCartuchoNativoDia1(nomeEstagiario);
    }
}


// 2. INICIALIZAÇÃO DA MESA E IMAGENS
function revelarCenario(imgElement) {
    const abrirCortina = () => {
        document.body.style.transition = 'opacity 0.4s ease-in-out';
        document.body.style.opacity = '1';
    };

    if (imgElement && imgElement.complete && imgElement.naturalWidth !== 0) {
        abrirCortina();
    } else if (imgElement) {
        imgElement.onload = abrirCortina;
        imgElement.onerror = abrirCortina;
    }
    setTimeout(abrirCortina, 200);
}

async function inicializarMesa() {
    const imgMesa = document.getElementById('imagem-mesa');
    const baseImg = window.location.protocol === 'file:' ? '../static/img/' : '/static/img/';
    const temAranha = nomeSalvoRaw ? (localStorage.getItem(nomeEstagiario + '_conquistaAranha') === 'true') : false;

    if (imgMesa) {
        imgMesa.src = baseImg + (temAranha ? 'mesa2.png' : 'mesa.png');
        revelarCenario(imgMesa);
    }

    garantirRoteiroCarregado();

    if (window.location.protocol !== 'file:') {
        try {
            const res = await fetch('/api/my-progress');
            if (res.ok) {
                const data = await res.json();
                progressoDoUsuario = data.progresso;

                const telaBackdrop = document.getElementById('tela-backdrop');
                if (telaBackdrop && telaBackdrop.style.display === 'flex') {
                    clicarTela();
                }

                if (data.conquista_aranha === true) {
                    localStorage.setItem(nomeEstagiario + '_conquistaAranha', 'true');
                    if (imgMesa) imgMesa.src = baseImg + 'mesa2.png';
                }

                if (data.progresso === 2) {
                    primeiraVisitaRealizada = true;
                    chamadoAtivo = true; // Chamado existe no sistema...
                    
                    // ...MAS A LUZ FICA APAGADA POIS JÁ FOI ATENDIDO!
                    const luz = document.getElementById('luz-telefone');
                    if (luz) luz.classList.remove('ativa');

                    const faseSalva = localStorage.getItem(nomeEstagiario + '_fase_ativa');
                    if (faseSalva !== null) faseAtual = parseInt(faseSalva, 10);
                } else if (data.progresso >= 3) {
                    primeiraVisitaRealizada = true;
                    chamadoAtivo = false;
                    atualizarVisualChamadoConcluido();
                }
            }
        } catch (e) {
            progressoDoUsuario = 0;
        }
    }
}



function clicarTela() {
    fecharArquivos();
    fecharChamados();

    const telaBackdrop = document.getElementById('tela-backdrop');
    const manualWrapper = document.getElementById('manual-wrapper');

    if (manualWrapper && manualWrapper.style.display === 'block') {
        telaBackdrop.style.backgroundColor = 'transparent';
        telaBackdrop.style.pointerEvents = 'none';
        focarTela();
    } else {
        telaBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        telaBackdrop.style.pointerEvents = 'auto';
        telaBackdrop.style.zIndex = '460';
    }

    telaBackdrop.style.display = 'flex';

    const areaInput = document.getElementById('area-input');
    const historico = document.getElementById('historico-linhas');
    const input = document.getElementById('prompt-input');

    if (areaInput && (!jogoAtivo || faseAtual < roteiroAtual.length)) {
        areaInput.style.display = 'flex';
        areaInput.style.opacity = '1';
    }

    if (progressoDoUsuario === 2 && !jogoAtivo) {
        iniciarTerminalJogo();
        return;
    }

    // Régua de 16 '=' no celular e 55 '=' no computador
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
    const divisoriaCmd = isMobile ? "================" : "=======================================================";
    const tituloTerminal = isMobile ? "TERMINAL SEMAE" : "       TERMINAL OPERACIONAL SEMAE";

    if (!jogoAtivo && !modoMenuAcl && historico) {
        if (!historico.innerHTML.includes("Microsoft Windows")) {
            historico.innerHTML = `
<div class="aviso-azul-acl" style="color: #38bdf8; margin-bottom: 12px; font-weight: bold;">Para ativar a acessibilidade utilize o comando ACL_ON no terminal.</div>
Microsoft Windows [versão 10.0.19045]
(c) Microsoft Corporation. Todos os direitos reservados.

${divisoriaCmd}
${tituloTerminal}
${divisoriaCmd}
<div class="interacao-amarela" style="margin-top:30px;">Nenhum atendimento iniciado. Verifique seus chamados.</div>`;
        }
    }

    // No computador foca o input de imediato; no celular NÃO foca para o teclado virtual não subir na frente
    if (!isMobile) {
        setTimeout(() => {
            if (input && !input.disabled) input.focus();
        }, 50);
    }
}

function fecharTela() {
    const telaBackdrop = document.getElementById('tela-backdrop');
    telaBackdrop.style.display = 'none';
    telaBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    telaBackdrop.style.pointerEvents = 'auto';
}

function focarTela() {
    document.getElementById('tela-backdrop').style.zIndex = '480';
    document.getElementById('manual-wrapper').style.zIndex = '450';
}

function focarManual() {
    document.getElementById('manual-wrapper').style.zIndex = '490';
    document.getElementById('tela-backdrop').style.zIndex = '450';
}

function fecharTudo() {
    fecharTela();
    fecharManual();
    fecharArquivos();
    fecharChamados();
}

function clicarArquivos() {
    fecharTela();
    fecharManual();
    document.getElementById('arquivos-backdrop').style.display = 'flex';
}

function fecharArquivos() {
    document.getElementById('arquivos-backdrop').style.display = 'none';
}


// 4. SISTEMA DE CHAMADOS
function clicarChamados() {
    fecharTela();
    fecharManual();
    chamadosAberto = true;
    document.getElementById('chamados-backdrop').style.display = 'flex';

    if (chamadoAtivo || progressoDoUsuario >= 2) {
        montarPainelChamadoAtivo();
    }
}

function fecharChamados() {
    document.getElementById('chamados-backdrop').style.display = 'none';

    if (chamadosAberto && !primeiraVisitaRealizada) {
        primeiraVisitaRealizada = true;
        setTimeout(() => acenderLuzChamado(), 2000);
    }
    chamadosAberto = false;
}

function acenderLuzChamado() {
    chamadoAtivo = true;
    const luz = document.getElementById('luz-telefone');
    if (luz) luz.classList.add('ativa');
    montarPainelChamadoAtivo();
}

// =========================================================
// static/js/mesa_core.js -> Seção 4: montarPainelChamadoAtivo()
// =========================================================
function montarPainelChamadoAtivo() {
    const sidebarLista = document.getElementById('sidebar-lista');
    const painelPrincipal = document.getElementById('painel-chamados-conteudo');

    if (!sidebarLista || !painelPrincipal) return;

    // Resgate seguro dos metadados do chamado
    const chamado = (typeof chamadoDia1 !== 'undefined') ? chamadoDia1 : (window.chamadoDia1 || {
        codigo: "SE-CTI-26-0001",
        assunto: "Diagnóstico básico da estação de trabalho",
        solicitante: "Rafael Mendes",
        setor: "Atendimento ao Usuário",
        equipamento: "ATD-07",
        prioridade: "Normal",
        historico: "O usuário Rafael Mendes informou ao TI que a estação de trabalho ATD-07 apresentou um comportamento inesperado durante o expediente.<br><br>Segundo o usuário, o computador está ligado e conectado à rede, porém algumas informações não estão sendo apresentadas corretamente.",
        supervisor: "Marcos Almeida"
    });

    // Identificação dos 3 estados possíveis do chamado
    const isConcluido = (progressoDoUsuario >= 3);
    const isEmAndamento = (progressoDoUsuario === 2 || faseAtual > 0);

    let textoStatus = 'Pendente';
    let corStatus = 'var(--cor-destaque)';
    let bgStatus = 'rgba(255, 159, 28, 0.15)';

    if (isConcluido) {
        textoStatus = 'Concluído';
        corStatus = 'var(--cor-sucesso)';
        bgStatus = 'rgba(69, 207, 138, 0.15)';
    } else if (isEmAndamento) {
        textoStatus = 'Em atendimento';
        corStatus = 'var(--cor-destaque)';
        bgStatus = 'rgba(255, 159, 28, 0.2)';
    }

    // 1. Atualiza a barra lateral
    sidebarLista.innerHTML = `
        <div class="item-chamado" id="item-chamado-sidebar" tabindex="0">
            <span class="item-status" id="badge-sidebar" style="background-color: ${bgStatus}; color: ${corStatus}; border-color: ${corStatus};">${textoStatus}</span>
            <div class="item-codigo">${chamado.codigo}</div>
            <div class="item-assunto">${chamado.assunto}</div>
        </div>
    `;

    // 2. Decide qual botão exibir na base da janela
    let botoesAcaoHtml = '';
    if (isConcluido) {
        botoesAcaoHtml = `
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn-iniciar-atendimento btn-concluido" id="btn-refazer-atd" tabindex="0" onclick="refazerAtendimento()">[ REFAZER ATENDIMENTO ]</button>
                <button class="btn-iniciar-atendimento btn-concluido" id="btn-rever-atd" tabindex="0" onclick="reverAtendimento()">[ REVER ATENDIMENTO ]</button>
            </div>
        `;
    } else if (isEmAndamento) {
        botoesAcaoHtml = `<button class="btn-iniciar-atendimento" id="btn-iniciar-jogo" tabindex="0" onclick="iniciarTerminalJogo()">[ CONTINUAR ATENDIMENTO ]</button>`;
    } else {
        botoesAcaoHtml = `<button class="btn-iniciar-atendimento" id="btn-iniciar-jogo" tabindex="0" onclick="iniciarTerminalJogo()">[ INICIAR ATENDIMENTO ]</button>`;
    }

    // 3. Monta o corpo completo do painel de chamados
    painelPrincipal.innerHTML = `
        <div class="cabecalho-chamado" id="secao-cabecalho-chamado" tabindex="0">
            <div>
                <div class="codigo-chamado">${chamado.codigo}</div>
                <div class="assunto-chamado">${chamado.assunto}</div>
            </div>
        </div>

        <div class="grid-metadados" id="secao-metadados-chamado" tabindex="0">
            <div><strong>Número:</strong> <span style="color:#fff;">${chamado.codigo}</span></div>
            <div><strong>Solicitante:</strong> <span style="color:#fff;">${chamado.solicitante}</span></div>
            <div><strong>Setor:</strong> <span style="color:#fff;">${chamado.setor}</span></div>
            <div><strong>Equipamento:</strong> <span style="color:#fff;">${chamado.equipamento}</span></div>
            <div><strong>Prioridade:</strong> <span style="color:#fff;">${chamado.prioridade}</span></div>
            <div><strong>Status:</strong> <span id="chamado-status" style="color:${corStatus}; font-weight:bold;">${textoStatus}</span></div>
        </div>

        <div class="secao-titulo">Histórico</div>
        <div class="texto-corpo" id="secao-historico-chamado" tabindex="0">${chamado.historico}</div>

        <div class="secao-titulo">Encaminhamento do Supervisor</div>
        <div class="bloco-encaminhamento" id="secao-encaminhamento-chamado" tabindex="0">
            ${chamado.supervisor} — Supervisor de TI<br><br>
            <span>${nomeEstagiario}</span>,<br><br>
            Este será seu primeiro atendimento.<br><br>
            Antes de tentar corrigir qualquer coisa, faça um diagnóstico básico da estação.<br>
            Comece pelo terminal.<br><br>
            — Marcos Almeida<br>Supervisor de TI
        </div>

        ${botoesAcaoHtml}
    `;

    if (typeof mapearItensChamadosA11y === 'function') {
        mapearItensChamadosA11y();
    }
}

function atualizarVisualChamadoConcluido() {
    progressoDoUsuario = 3;
    chamadoAtivo = false;
    montarPainelChamadoAtivo();
}


// 5. MOTOR DO CADERNO 3D
function clicarManual() {
    fecharArquivos();
    fecharChamados();

    const manualBackdrop = document.getElementById('manual-backdrop');
    const manualWrapper = document.getElementById('manual-wrapper');
    const telaBackdrop = document.getElementById('tela-backdrop');

    manualBackdrop.style.display = 'block';
    manualWrapper.style.display = 'block';
    paginaAtual = 0;
    cadernoTravado = false;
    resetarPaginasCaderno();

    if (telaBackdrop && telaBackdrop.style.display === 'flex') {
        telaBackdrop.style.backgroundColor = 'transparent';
        telaBackdrop.style.pointerEvents = 'none';
        focarTela();
    } else {
        manualWrapper.style.zIndex = '450';
    }
}

function fecharManual() {
    document.getElementById('manual-backdrop').style.display = 'none';
    document.getElementById('manual-wrapper').style.display = 'none';
}

function abrirManualNaUltimaPagina() {
    fecharArquivos();
    fecharChamados();

    const manualBackdrop = document.getElementById('manual-backdrop');
    const manualWrapper = document.getElementById('manual-wrapper');
    const telaBackdrop = document.getElementById('tela-backdrop');

    if (telaBackdrop && telaBackdrop.style.display === 'flex') {
        telaBackdrop.style.backgroundColor = 'transparent';
        telaBackdrop.style.pointerEvents = 'none';
    }

    const input = document.getElementById('prompt-input');
    if (input) input.blur();

    manualBackdrop.style.display = 'block';
    manualWrapper.style.display = 'block';

    const paginas = document.querySelectorAll('#caderno .pagina');
    let maxIndex = Math.min(paginasLiberadas - 1, paginas.length - 1);
    paginaAtual = Math.max(0, maxIndex);
    cadernoTravado = false;

    paginas.forEach((pag, idx) => {
        pag.className = 'pagina';
        if (idx === paginaAtual) pag.classList.add('ativa');
    });

    focarManual();
}

function resetarPaginasCaderno() {
    const paginas = document.querySelectorAll('#caderno .pagina');
    paginas.forEach((pag, idx) => {
        pag.className = 'pagina';
        if (idx === 0) pag.classList.add('ativa');
    });
}

function cliqueNoCaderno(event) {
    const wrapper = document.getElementById('manual-wrapper');
    const telaBackdrop = document.getElementById('tela-backdrop');

    if (telaBackdrop && telaBackdrop.style.display === 'flex' && wrapper.style.zIndex !== '490') {
        focarManual();
        return;
    }

    const caderno = document.getElementById('caderno');
    const rect = caderno.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x > rect.width / 2) {
        mudarPaginaCaderno(1);
    } else {
        mudarPaginaCaderno(-1);
    }
}

async function mudarPaginaCaderno(direcao) {
    if (cadernoTravado) return;

    const paginas = document.querySelectorAll('#caderno .pagina');
    const total = paginas.length;
    const novoIdx = paginaAtual + direcao;

    if (novoIdx < 0 || novoIdx >= Math.min(paginasLiberadas, total)) return;

    cadernoTravado = true;
    const saindo = paginas[paginaAtual];
    const entrando = paginas[novoIdx];

    if (direcao === 1) {
        entrando.classList.add('atras');
        saindo.classList.add('dobrando');
        await sleep(250);
        saindo.classList.remove('ativa', 'dobrando');
        saindo.classList.add('saindo');
        await sleep(600);
        saindo.classList.remove('saindo');
        entrando.classList.remove('atras');
        entrando.classList.add('ativa');
    } else {
        entrando.classList.add('voltando');
        entrando.offsetHeight;
        entrando.classList.remove('voltando');
        entrando.classList.add('ativa');
        await sleep(600);
        saindo.classList.remove('ativa');
    }

    paginaAtual = novoIdx;
    cadernoTravado = false;
}


// 6. MOTOR DO TERMINAL, REVER, REFAZER E COMANDO ACL_ON
function normalizarTexto(txt) {
    if (!txt) return "";
    return txt.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[?!.,;]/g, "")
              .replace(/\s+/g, " ")
              .trim();
}

function normalizarCodigo(txt) {
    if (!txt) return "";
    return normalizarTexto(txt)
              .replace(/['"]/g, "")
              .replace(/\s+/g, "");
}

function rolarTerminalAbaixo() {
    const c = document.getElementById('historico-linhas');
    if (c) c.scrollTop = c.scrollHeight;
}

async function escreverNoTerminal(texto) {
    if (!texto) return;
    const historico = document.getElementById('historico-linhas');
    const linhas = texto.split('\n');
    for (let i = 0; i < linhas.length; i++) {
        const div = document.createElement('div');
        div.innerHTML = linhas[i].trim() === "" ? "<br>" : linhas[i];
        historico.appendChild(div);
        rolarTerminalAbaixo();
        await sleep(150);
    }
}

// MENU INTERATIVO DE ACESSIBILIDADE VIA TERMINAL (ACL_ON)
function exibirMenuAcl() {
    modoMenuAcl = true;
    const historico = document.getElementById('historico-linhas');

    const vozAtiva = localStorage.getItem('a11y_voz') === 'true';
    const tecladoAtivo = localStorage.getItem('a11y_teclado') === 'true';
    const iconesAtivos = localStorage.getItem('a11y_icones') === 'true';

    const divMenu = document.createElement('div');
    divMenu.style.margin = "15px 0";
    divMenu.style.lineHeight = "1.6";
    divMenu.innerHTML = `
=======================================================
              PAINEL DE ACESSIBILIDADE (ACL)
=======================================================
[1] Leitura por Voz          : [ ${vozAtiva ? '<span class="transicao-verde">LIGADO [✓]</span>' : '<span style="color:#8da1ad">DESLIGADO</span>'} ]
[2] Navegação por Teclado    : [ ${tecladoAtivo ? '<span class="transicao-verde">LIGADO [✓]</span>' : '<span style="color:#8da1ad">DESLIGADO</span>'} ]
[3] Destaques Visuais/Ícones : [ ${iconesAtivos ? '<span class="transicao-verde">LIGADO [✓]</span>' : '<span style="color:#8da1ad">DESLIGADO</span>'} ]
[4] Alternar Todos os Recursos
[5] Sair do Menu

<span class="interacao-amarela">Digite a opção (1 a 5) e pressione Enter:</span>`;
    historico.appendChild(divMenu);
    rolarTerminalAbaixo();
}

function processarOpcaoAcl(opcao) {
    const historico = document.getElementById('historico-linhas');
    let vozAtiva = localStorage.getItem('a11y_voz') === 'true';
    let tecladoAtivo = localStorage.getItem('a11y_teclado') === 'true';
    let iconesAtivos = localStorage.getItem('a11y_icones') === 'true';

    const divResp = document.createElement('div');
    divResp.style.margin = "10px 0";

    if (opcao === '1') {
        vozAtiva = !vozAtiva;
        localStorage.setItem('a11y_voz', vozAtiva);
        divResp.innerHTML = `<span class="transicao-verde">[✓] Leitura por Voz ${vozAtiva ? 'HABILITADA' : 'DESABILITADA'}.</span>`;
    } else if (opcao === '2') {
        tecladoAtivo = !tecladoAtivo;
        localStorage.setItem('a11y_teclado', tecladoAtivo);
        document.body.classList.toggle('teclado-ativo', tecladoAtivo);
        divResp.innerHTML = `<span class="transicao-verde">[✓] Navegação por Teclado ${tecladoAtivo ? 'HABILITADA' : 'DESABILITADA'}.</span>`;
    } else if (opcao === '3') {
        iconesAtivos = !iconesAtivos;
        localStorage.setItem('a11y_icones', iconesAtivos);
        document.body.classList.toggle('icones-ativos', iconesAtivos);
        divResp.innerHTML = `<span class="transicao-verde">[✓] Destaques Visuais e Ícones ${iconesAtivos ? 'HABILITADOS' : 'DESABILITADOS'}.</span>`;
    } else if (opcao === '4') {
        const ligarTudo = (!vozAtiva || !tecladoAtivo || !iconesAtivos);
        localStorage.setItem('a11y_voz', ligarTudo);
        localStorage.setItem('a11y_teclado', ligarTudo);
        localStorage.setItem('a11y_icones', ligarTudo);
        document.body.classList.toggle('teclado-ativo', ligarTudo);
        document.body.classList.toggle('icones-ativos', ligarTudo);
        divResp.innerHTML = `<span class="transicao-verde">[✓] Todos os recursos foram ${ligarTudo ? 'HABILITADOS' : 'DESABILITADOS'}.</span>`;
    } else if (opcao === '5' || opcao === 'sair') {
        modoMenuAcl = false;
        divResp.innerHTML = `<div style="color:#8da1ad;">Menu de acessibilidade encerrado. Retornando ao terminal.</div>`;
        historico.appendChild(divResp);
        rolarTerminalAbaixo();
        if (typeof sincronizarA11yMesa === 'function') sincronizarA11yMesa();
        return;
    } else {
        divResp.innerHTML = `<div class="cor-erro">[ERRO] Opção inválida. Digite 1, 2, 3, 4 ou 5 para sair.</div>`;
        historico.appendChild(divResp);
        rolarTerminalAbaixo();
        return;
    }

    historico.appendChild(divResp);
    rolarTerminalAbaixo();
    if (typeof sincronizarA11yMesa === 'function') sincronizarA11yMesa();
    exibirMenuAcl();
}

function refazerAtendimento() {
    faseAtual = 0;
    errosFase = 0;
    errosTotaisNoDia = 0;
    jogoAtivo = false;
    const areaInput = document.getElementById('area-input');
    if (areaInput) areaInput.style.display = 'flex';
    iniciarTerminalJogo();
}

async function reverAtendimento() {
    garantirRoteiroCarregado();
    fecharChamados();
    clicarTela();

    const historico = document.getElementById('historico-linhas');
    const areaInput = document.getElementById('area-input');

    historico.innerHTML = "";
    if (areaInput) areaInput.style.display = 'none';

    const header = document.createElement('div');
    header.innerHTML = `
<div class="aviso-azul-acl" style="color: #38bdf8; margin-bottom: 12px; font-weight: bold;">Para ativar a acessibilidade utilize o comando ACL_ON no terminal.</div>
Microsoft Windows [versão 10.0.19045]
(c) Microsoft Corporation. Todos os direitos reservados.

=======================================================
         REVISÃO DE ATENDIMENTO — SE-CTI-26-0001
=======================================================`;
    historico.appendChild(header);

    for (let i = 0; i < roteiroAtual.length; i++) {
        const f = roteiroAtual[i];
        if (f.prompt) {
            const pDiv = document.createElement('div');
            pDiv.innerHTML = f.prompt;
            historico.appendChild(pDiv);
        }
        if (f.esperado && f.esperado.length > 0) {
            const cmdDiv = document.createElement('div');
            const comandoCorreto = f.substituirComando ? f.substituirComando : (f.esperado[0] || "");
            cmdDiv.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:var(--cor-sucesso);">${comandoCorreto}</span>`;
            historico.appendChild(cmdDiv);
        }
        if (f.sucesso) {
            const sDiv = document.createElement('div');
            sDiv.innerHTML = f.sucesso;
            historico.appendChild(sDiv);
        }
        const spacer = document.createElement('div');
        spacer.innerHTML = "<br>";
        historico.appendChild(spacer);
    }

    paginasLiberadas = 7;
    rolarTerminalAbaixo();

    if (typeof narrarTerminalA11y === 'function') {
        narrarTerminalA11y("Revisão completa do chamado exibida na tela. Pressione ESC para fechar.");
    }
}

async function iniciarTerminalJogo() {
    // Só bloqueia caso o terminal esteja no meio de uma animação de digitação
    if (digitando) return;

    garantirRoteiroCarregado();

    jogoAtivo = true;
    errosTotaisNoDia = 0;
    fecharChamados();

    // Apaga a luz pulsante do telefone imediatamente
    const luz = document.getElementById('luz-telefone');
    if (luz) luz.classList.remove('ativa');
    chamadoAtivo = false;

    // Abre a tela do terminal
    clicarTela();

    // Sincroniza com o banco que o chamado foi iniciado (Progresso 2)
    if (window.location.protocol !== 'file:' && progressoDoUsuario < 2) {
        fetch('/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progresso: 2, username_jogo: nomeEstagiario })
        }).catch(() => {});
    }

    const historico = document.getElementById('historico-linhas');
    const input = document.getElementById('prompt-input');
    const areaInput = document.getElementById('area-input');

    historico.innerHTML = "";
    paginasLiberadas = Math.max(paginasLiberadas, 2);

    errosFase = 0;
    digitando = true;
    input.disabled = true;
    areaInput.style.opacity = '.3';

    // 1. Régua de 16 '=' no celular e 55 '=' no computador
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
    const divisoriaCmd = isMobile ? "================" : "=======================================================";
    const tituloTerminal = isMobile ? "TERMINAL SEMAE" : "       TERMINAL OPERACIONAL SEMAE";

    // Imprime o cabeçalho oficial do Windows
    const header = document.createElement('div');
    header.innerHTML = `
<div class="aviso-azul-acl" style="color: #38bdf8; margin-bottom: 12px; font-weight: bold;">Para ativar a acessibilidade utilize o comando ACL_ON no terminal.</div>
Microsoft Windows [versão 10.0.19045]
(c) Microsoft Corporation. Todos os direitos reservados.

${divisoriaCmd}
${tituloTerminal}
${divisoriaCmd}`;
    historico.appendChild(header);

    // Garante que o ponteiro da fase esteja dentro dos limites válidos
    faseAtual = Math.min(Math.max(0, faseAtual), roteiroAtual.length - 1);

    // RECONSTRUÇÃO: Se você parou na fase 3 ou superior, imprime o passado em verde
    if (faseAtual > 0 && roteiroAtual.length > 0) {
        for (let i = 0; i < faseAtual; i++) {
            const f = roteiroAtual[i];
            if (!f) continue;
            if (f.prompt) {
                const pDiv = document.createElement('div');
                pDiv.innerHTML = f.prompt;
                historico.appendChild(pDiv);
            }
            const cmdDiv = document.createElement('div');
            const comandoCorreto = f.substituirComando ? f.substituirComando : (f.esperado[0] || "");
            cmdDiv.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:var(--cor-sucesso);">${comandoCorreto}</span>`;
            historico.appendChild(cmdDiv);

            if (f.sucesso) {
                const sDiv = document.createElement('div');
                sDiv.innerHTML = f.sucesso;
                historico.appendChild(sDiv);
            }
            const spacer = document.createElement('div');
            spacer.innerHTML = "<br>";
            historico.appendChild(spacer);
        }

        // Libera as páginas do manual correspondentes ao progresso recuperado
        if (faseAtual >= 1) paginasLiberadas = Math.max(paginasLiberadas, 3);
        if (faseAtual >= 3) paginasLiberadas = Math.max(paginasLiberadas, 4);
        if (faseAtual >= 5) paginasLiberadas = Math.max(paginasLiberadas, 5);
        if (faseAtual >= 6) paginasLiberadas = Math.max(paginasLiberadas, 6);
        if (faseAtual >= 8) paginasLiberadas = Math.max(paginasLiberadas, 7);
    }

    // Imprime a tarefa da fase exata onde o jogador parou
    if (roteiroAtual && faseAtual < roteiroAtual.length) {
        await escreverNoTerminal(roteiroAtual[faseAtual].prompt);
        if (typeof narrarTerminalA11y === 'function') {
            narrarTerminalA11y(roteiroAtual[faseAtual].prompt);
        }
    }

    digitando = false;
    input.disabled = false;
    areaInput.style.opacity = '1';

    // 2. No computador foca na hora; no celular NÃO foca para o teclado virtual não subir na frente
    if (!isMobile) {
        input.focus();
    }
}

async function avancarFaseJogo() {
    faseAtual++;
    errosFase = 0;

    const input = document.getElementById('prompt-input');
    const areaInput = document.getElementById('area-input');

    if (faseAtual < roteiroAtual.length) {
        localStorage.setItem(nomeEstagiario + '_fase_ativa', faseAtual);
    } else {
        localStorage.removeItem(nomeEstagiario + '_fase_ativa');
    }

    if (faseAtual === 1) paginasLiberadas = Math.max(paginasLiberadas, 3);
    if (faseAtual === 3) paginasLiberadas = Math.max(paginasLiberadas, 4);
    if (faseAtual === 5) paginasLiberadas = Math.max(paginasLiberadas, 5);
    if (faseAtual === 6) paginasLiberadas = Math.max(paginasLiberadas, 6);
    if (faseAtual === 8) paginasLiberadas = Math.max(paginasLiberadas, 7);

    if (faseAtual < roteiroAtual.length) {
        const prox = roteiroAtual[faseAtual];
        const anterior = roteiroAtual[faseAtual - 1];
        if (anterior && anterior.proxEspera) await sleep(anterior.proxEspera);
        if (!prox.proxFaseSimulada) {
            await escreverNoTerminal(prox.prompt);
            if (typeof narrarTerminalA11y === 'function') {
                narrarTerminalA11y(prox.prompt);
            }
        }

        digitando = false;
        input.disabled = false;
        areaInput.style.opacity = '1';
        input.focus();
    } else {
        jogoAtivo = false;
        progressoDoUsuario = 3;
        areaInput.style.display = 'none';
        atualizarVisualChamadoConcluido();
    }
}

let encerrandoAtendimento = false;

function encerrarDia() {
    if (encerrandoAtendimento) return;
    encerrandoAtendimento = true;

    progressoDoUsuario = 3;
    chamadoAtivo = false;
    jogoAtivo = false;

    const luz = document.getElementById('luz-telefone');
    if (luz) luz.classList.remove('ativa');

    fecharTela();
    clicarChamados();

    // Libera a trava após 1 segundo caso ele queira rever novamente
    setTimeout(() => { encerrandoAtendimento = false; }, 1000);
}


// 7. OUVINTES DE ENTRADA DO TERMINAL
window.addEventListener('DOMContentLoaded', () => {
    inicializarMesa();

    const input = document.getElementById('prompt-input');
    const ghostText = document.getElementById('ghost-text');
    const historico = document.getElementById('historico-linhas');
    const terminalFocoArea = document.getElementById('terminal-foco');

    if (terminalFocoArea) {
        terminalFocoArea.addEventListener('click', () => {
            if (window.getSelection().toString().length === 0 && input && !input.disabled) {
                input.focus();
            }
        });
    }

    if (input) {
        input.addEventListener('input', function() {
            if (!jogoAtivo || !ghostText) return;
            ghostText.innerHTML = "";

            garantirRoteiroCarregado();
            if (errosFase >= 1 && roteiroAtual && faseAtual < roteiroAtual.length) {
                const f = roteiroAtual[faseAtual];
                if (!f) return;
                const txt = this.value;
                if (f.dica_valor && txt.length > 0) {
                    const p = txt.toLowerCase();
                    let inicio = p.indexOf('("');
                    if (inicio < 0) inicio = p.indexOf("('");
                    if (inicio >= 0) {
                        const dig = txt.substring(inicio + 2);
                        if (f.dica_valor.toLowerCase().startsWith(dig.toLowerCase())) {
                            ghostText.innerHTML = '<span style="visibility:hidden">' + txt.replace(/</g, "&lt;") + '</span>' + f.dica_valor.substring(dig.length);
                        }
                    }
                } else if (f.dica_variavel && txt.length > 0 && f.dica_variavel.toLowerCase().startsWith(txt.toLowerCase())) {
                    ghostText.innerHTML = '<span style="visibility:hidden">' + txt.replace(/</g, "&lt;") + '</span>' + f.dica_variavel.substring(txt.length);
                }
            }
        });

        input.addEventListener('keypress', async function(e) {
            if (e.key !== 'Enter' || input.disabled || digitando) return;

            const bruto = this.value;
            const cmdLimpo = bruto.trim().toLowerCase();
            if (!bruto.trim()) return;

            // 1. PROCESSAMENTO DE OPÇÃO DENTRO DO MENU ACL_ON
            if (modoMenuAcl) {
                const divCmd = document.createElement('div');
                divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:#fff;">${bruto}</span>`;
                historico.appendChild(divCmd);
                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                processarOpcaoAcl(cmdLimpo);
                return;
            }

            // 2. COMANDO PARA ATIVAR O MENU DE ACESSIBILIDADE
            if (cmdLimpo === 'acl_on') {
                const divCmd = document.createElement('div');
                divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:#fff;">${bruto}</span>`;
                historico.appendChild(divCmd);
                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                exibirMenuAcl();
                return;
            }

            // 3. COMANDOS GLOBAIS DO TERMINAL
            if (cmdLimpo === 'ranking') {
                window.location.href = window.location.protocol === 'file:' ? 'ranking.html' : '/pi2/ranking';
                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                return;
            }

            if (cmdLimpo === 'reset' || cmdLimpo === 'reset-conquistas') {
                localStorage.removeItem(nomeEstagiario + '_conquistaAranha');
                location.reload();
                return;
            }

            if (cmdLimpo === 'reset_all' || cmdLimpo === 'reset-all') {
            this.value = "";
            if (ghostText) ghostText.innerHTML = "";

            const divCmd = document.createElement('div');
            divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:#fff;">${bruto}</span>`;
            historico.appendChild(divCmd);

            const divAviso = document.createElement('div');
            divAviso.className = "transicao-verde";
            divAviso.style.margin = "10px 0";
            divAviso.innerText = "[SISTEMA] Resetando todas as configurações locais, conquistas e progresso...";
            historico.appendChild(divAviso);
            rolarTerminalAbaixo();

            // 1. Limpa todas as chaves do navegador
            localStorage.clear();

            // 2. Se estiver online (Flask/Render), zera o progresso do banco
            if (window.location.protocol !== 'file:') {
                try {
                    await fetch('/api/reset-my-progress', { method: 'POST' });
                } catch (e) {}
            }

            // 3. Retorna para a tela 1 (Index)
            setTimeout(() => {
                if (window.location.protocol === 'file:') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = '/pi2';
                }
            }, 1000);
            return;
            }

            // 4. SE O ATENDIMENTO NÃO COMEÇOU, MENSAGEM PADRÃO
            if (!jogoAtivo) {
                const divCmd = document.createElement('div');
                divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:#fff;">${bruto}</span>`;
                historico.appendChild(divCmd);

                const divMsg = document.createElement('div');
                divMsg.className = "interacao-amarela";
                divMsg.style.marginTop = "10px";
                divMsg.style.marginBottom = "10px";
                divMsg.innerText = "Nenhum atendimento iniciado. Verifique seus chamados.";
                historico.appendChild(divMsg);

                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                rolarTerminalAbaixo();
                return;
            }

            // 5. JOGO EM ATENDIMENTO
            garantirRoteiroCarregado();
            const f = (roteiroAtual && roteiroAtual[faseAtual]) ? roteiroAtual[faseAtual] : null;

            if (jogoAtivo && !f) {
                console.error("Fase ativa não localizada no roteiro.");
                return;
            }

            digitando = true;
            input.disabled = true;
            document.getElementById('area-input').style.opacity = '.3';

            const divCmd = document.createElement('div');
            let aceitarComando = false;

            if (cmdLimpo === 'zmtx') {
                const cmdCorreto = f.substituirComando ? f.substituirComando : (f.esperado[0] || "");
                const cor = f.substituirComando ? 'var(--cor-sucesso)' : '#fff';
                divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:${cor};">${cmdCorreto}</span>`;
                historico.appendChild(divCmd);
                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                rolarTerminalAbaixo();
                aceitarComando = true;
            } else {
                divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:#fff;">${bruto}</span>`;
                historico.appendChild(divCmd);
                this.value = "";
                if (ghostText) ghostText.innerHTML = "";
                rolarTerminalAbaixo();

                if (cmdLimpo === 'clear' || cmdLimpo === 'cls') {
                    historico.innerHTML = "";
                    await escreverNoTerminal(f.prompt);
                    digitando = false;
                    input.disabled = false;
                    document.getElementById('area-input').style.opacity = '1';
                    input.focus();
                    return;
                }

                for (let esperado of f.esperado) {
                    if (esperado.includes('(') || esperado.includes('=')) {
                        if (normalizarCodigo(bruto) === normalizarCodigo(esperado)) { aceitarComando = true; break; }
                    } else {
                        if (normalizarTexto(bruto) === normalizarTexto(esperado)) { aceitarComando = true; break; }
                    }
                }
            }

            if (aceitarComando) {
                let textoSucesso = f.sucesso;

                if (faseAtual === 11) {
                    const conquistaAranha = (errosTotaisNoDia === 0);

                    if (window.location.protocol !== 'file:') {
                        fetch('/api/save-score', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                progresso: 3,
                                estrelas: 3,
                                conquista_aranha: conquistaAranha,
                                username_jogo: localStorage.getItem('nomeEstagiario')
                            })
                        }).catch(() => {});
                    }

                    if (conquistaAranha) {
                        localStorage.setItem(nomeEstagiario + '_conquistaAranha', 'true');
                        const imgMesa = document.getElementById('imagem-mesa');
                        const baseImg = window.location.protocol === 'file:' ? '../static/img/' : '/static/img/';
                        if (imgMesa) imgMesa.src = baseImg + 'mesa2.png';

                        const parteAranha = `\n<span class='transicao-verde'>[✓] CONQUISTA DESBLOQUEADA: ARANHAVERSO</span>\n\n<span style='color: var(--cor-texto)'>Você concluiu o dia com zero erros no terminal! Uma surpresa apareceu na sua mesa.</span>\n\n=======================================`;
                        textoSucesso = textoSucesso.replace("=======================================\n\n<span class='interacao-amarela'", parteAranha + "\n\n<span class='interacao-amarela'");
                    }
                }

                if (cmdLimpo !== 'zmtx' && f.substituirComando) {
                    divCmd.innerHTML = `C:\\SEMAE\\ATD-07&gt; <span style="color:var(--cor-sucesso);">${f.substituirComando}</span>`;
                }

                await escreverNoTerminal(textoSucesso);
                if (typeof narrarTerminalA11y === 'function') {
                    narrarTerminalA11y(textoSucesso);
                }

                avancarFaseJogo();
            } else {
                errosFase++;
                errosTotaisNoDia++;

                const divErro = document.createElement('div');
                divErro.style.marginTop = "15px";
                divErro.style.marginBottom = "15px";
                divErro.style.lineHeight = "1.6";

                const mensagemDica = f.erroMsg || "Verifique a sintaxe e tente novamente.";

                if (f.proxFaseSimulada) {
                    divErro.innerHTML = `
                        <div style="color:#8da1ad; font-size: 0.95rem; font-style: italic;">&gt; Entrada lida: ${bruto}</div>
                        <div style="color:#ff5f56; font-weight: bold; margin-top: 5px;">[ERRO] Informação inválida.</div>
                        <div style="color:#cccccc; margin-top: 5px;"><span style="color:var(--cor-destaque); font-weight: bold;">DICA:</span> ${mensagemDica}</div>
                    `;
                } else {
                    divErro.innerHTML = `
                        <div style="color:#8da1ad; font-size: 0.95rem; font-style: italic;">&gt; Comando lido: ${bruto}</div>
                        <div style="color:#ff5f56; font-weight: bold; margin-top: 5px;">[ERRO] Comando inválido.</div>
                        <div style="color:#cccccc; margin-top: 5px;"><span style="color:var(--cor-destaque); font-weight: bold;">DICA:</span> ${mensagemDica}</div>
                    `;
                }
                historico.appendChild(divErro);

                if (typeof narrarTerminalA11y === 'function') {
                    narrarTerminalA11y(`Comando inválido. Dica: ${mensagemDica}`);
                }

                if (errosFase === 3) {
                    const divFantasma = document.createElement('div');
                    divFantasma.style.color = "#5FDCF2";
                    divFantasma.style.marginTop = "15px";
                    divFantasma.style.fontWeight = "bold";
                    divFantasma.style.lineHeight = "1.5";
                    divFantasma.innerHTML = `★ UMA PRESENÇA ESTRANHA SURGE NO TERMINAL ★<br><br>` +
                        `“Bhuuuu... calma, estagiário!”<br><br>` +
                        `Se estiver com dificuldades, consulte o manual.<br><br>` +
                        `<span style="color: #FF9F1C; cursor: pointer; text-decoration: underline;" onclick="abrirManualNaUltimaPagina(); event.stopPropagation();">[Clique aqui]</span> para abrir o Manual dos Estagiários.<br><br>`;
                    historico.appendChild(divFantasma);

                    if (typeof narrarTerminalA11y === 'function') {
                        narrarTerminalA11y("Uma presença estranha surge no terminal: se estiver com dificuldades, consulte o manual dos estagiários.");
                    }
                }

                rolarTerminalAbaixo();
                digitando = false;
                input.disabled = false;
                document.getElementById('area-input').style.opacity = '1';
                input.focus();
                input.dispatchEvent(new Event('input'));
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharTudo();
    });
});
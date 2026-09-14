// =========================================================
// static/js/ace_mesa.js
// =========================================================

// 1. CONFIGURAÇÕES E ESTADOS GLOBAIS
const configA11yMesa = {
    voz: localStorage.getItem('a11y_voz') === 'true',
    teclado: localStorage.getItem('a11y_teclado') === 'true',
    icones: localStorage.getItem('a11y_icones') === 'true'
};

let itensMesa = [];
let indiceItemMesa = 0;

let itensChamados = [];
let indiceItemChamados = 0;

let itensCmd = [];
let indiceItemCmd = 0;

let itensManual = [];
let indiceItemManual = 0;

let itensArquivos = [];
let indiceItemArquivos = 0;

let vozMariaMesa = null;

// Sincronização em tempo real acionada pelo menu ACL_ON do terminal
function sincronizarA11yMesa() {
    configA11yMesa.voz = localStorage.getItem('a11y_voz') === 'true';
    configA11yMesa.teclado = localStorage.getItem('a11y_teclado') === 'true';
    configA11yMesa.icones = localStorage.getItem('a11y_icones') === 'true';

    document.body.classList.toggle('teclado-ativo', configA11yMesa.teclado);
    document.body.classList.toggle('icones-ativos', configA11yMesa.icones);

    // Se desativou o teclado, remove os focos visuais ativos na tela
    if (!configA11yMesa.teclado) {
        document.querySelectorAll('.foco-pagina, .foco-interno').forEach(el => {
            el.classList.remove('foco-pagina', 'foco-interno');
        });
    }
}
window.sincronizarA11yMesa = sincronizarA11yMesa;


// 2. MOTOR DE VOZ NATIVA (MARIA PT-BR)
function carregarVozMariaMesa() {
    if (!('speechSynthesis' in window)) return;
    const todas = window.speechSynthesis.getVoices();
    vozMariaMesa = todas.find(v => v.name.toLowerCase().includes('maria'))
                || todas.find(v => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt'));
}

carregarVozMariaMesa();
if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = carregarVozMariaMesa;
}

function falarTextoMesa(texto) {
    if (!configA11yMesa.voz || !texto || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const textoLimpo = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!textoLimpo) return;

    const som = new SpeechSynthesisUtterance(textoLimpo);
    som.lang = 'pt-BR';
    if (!vozMariaMesa) carregarVozMariaMesa();
    if (vozMariaMesa) som.voice = vozMariaMesa;
    som.pitch = 1.0;
    som.rate = 1.05;

    window.speechSynthesis.speak(som);
}


// 3. MAPAS DE FOCO E CONTROLE DE JANELAS
function mapearItensMesa() {
    itensMesa = [
        document.getElementById('hitbox-tela'),
        document.getElementById('hitbox-manual'),
        document.getElementById('hitbox-chamados'),
        document.getElementById('hitbox-arquivos'),
        document.getElementById('instrucao-texto')
    ].filter(el => el !== null);
}

function focarItemMesa(indice) {
    if (!configA11yMesa.teclado && !configA11yMesa.icones) return;
    if (itensMesa.length === 0) mapearItensMesa();
    if (itensMesa.length === 0) return;

    itensMesa.forEach(el => el.classList.remove('foco-pagina'));
    indiceItemMesa = (indice + itensMesa.length) % itensMesa.length;

    const el = itensMesa[indiceItemMesa];
    el.focus();
    el.classList.add('foco-pagina');

    const fala = el.getAttribute('data-fala');
    if (fala) falarTextoMesa(fala);
}

function verificarJanelaAberta() {
    const manual = document.getElementById('manual-wrapper');
    if (manual && manual.style.display === 'block') return 'manual';

    const cmd = document.getElementById('tela-backdrop');
    if (cmd && cmd.style.display === 'flex' && cmd.style.pointerEvents !== 'none') return 'cmd';

    const chamados = document.getElementById('chamados-backdrop');
    if (chamados && chamados.style.display === 'flex') return 'chamados';

    const arquivos = document.getElementById('arquivos-backdrop');
    if (arquivos && arquivos.style.display === 'flex') return 'arquivos';

    return null;
}


// 4. ACESSIBILIDADE INTERNA DO TELEFONE / CHAMADOS (DIA 0 E DIA 1)
function mapearItensChamadosA11y() {
    const backdrop = document.getElementById('chamados-backdrop');
    if (!backdrop || backdrop.style.display !== 'flex') return;

    const btnFechar = backdrop.querySelector('.botao-fechar-x');

    const cabecalho = document.getElementById('secao-cabecalho-chamado');
    const metadados = document.getElementById('secao-metadados-chamado');
    const encaminhamento = document.getElementById('secao-encaminhamento-chamado');
    const btnIniciar = document.getElementById('btn-iniciar-jogo');
    const btnRefazer = document.getElementById('btn-refazer-atd');
    const btnRever = document.getElementById('btn-rever-atd');

    const tituloSistema = backdrop.querySelector('.caixa-titulo-sistema');
    const descSistema = backdrop.querySelector('.descricao-sistema');
    const camposInfo = Array.from(backdrop.querySelectorAll('.campo-info'));
    const alertaVazio = backdrop.querySelector('.alerta-vazio');

    if (cabecalho) {
        itensChamados = [
            btnFechar,
            cabecalho,
            metadados,
            encaminhamento,
            btnIniciar,
            btnRefazer,
            btnRever
        ].filter(el => el !== null);
    } else {
        itensChamados = [
            btnFechar,
            tituloSistema,
            descSistema,
            ...camposInfo,
            alertaVazio
        ].filter(el => el !== null);
    }

    if (configA11yMesa.teclado && itensChamados.length > 0) {
        indiceItemChamados = 1;
        setTimeout(() => focarItemChamados(indiceItemChamados), 150);
    }
}
window.mapearItensChamadosA11y = mapearItensChamadosA11y;

function focarItemChamados(indice) {
    if (itensChamados.length === 0) mapearItensChamadosA11y();
    if (itensChamados.length === 0) return;

    itensChamados.forEach(el => el.classList.remove('foco-interno'));
    indiceItemChamados = (indice + itensChamados.length) % itensChamados.length;

    const el = itensChamados[indiceItemChamados];
    el.focus();
    el.classList.add('foco-interno');

    let textoNarrar = "";
    if (el.classList.contains('botao-fechar-x')) {
        textoNarrar = "Botão fechar chamados. Ou pressione a tecla ESC.";
    } else if (el.classList.contains('caixa-titulo-sistema')) {
        textoNarrar = "Título: Sistema de Chamados do TI.";
    } else if (el.classList.contains('campo-info')) {
        const rotulo = el.querySelector('strong')?.innerText || '';
        const explicacao = el.innerText.replace(rotulo, '').trim();
        textoNarrar = `Campo ${rotulo}: ${explicacao}`;
    } else if (el.classList.contains('alerta-vazio')) {
        textoNarrar = el.innerText.replace(/\n/g, '. ');
    } else if (el.id === 'secao-cabecalho-chamado') {
        const cod = el.querySelector('.codigo-chamado')?.innerText || '';
        const ass = el.querySelector('.assunto-chamado')?.innerText || '';
        textoNarrar = `Atendimento ${cod}. Assunto: ${ass}.`;
    } else if (el.id === 'secao-metadados-chamado') {
        textoNarrar = el.innerText.replace(/\n/g, '. ');
    } else if (el.id === 'secao-encaminhamento-chamado') {
        textoNarrar = `Encaminhamento da supervisão: ${el.innerText}`;
    } else if (el.id === 'btn-iniciar-jogo') {
        textoNarrar = "Botão: Iniciar atendimento. Pressione Enter para abrir o terminal.";
    } else if (el.id === 'btn-refazer-atd') {
        textoNarrar = "Botão: Refazer atendimento. Pressione Enter para reiniciar os desafios do dia.";
    } else if (el.id === 'btn-rever-atd') {
        textoNarrar = "Botão: Rever atendimento. Pressione Enter para visualizar todo o código final.";
    } else {
        textoNarrar = el.innerText;
    }

    falarTextoMesa(textoNarrar);
}


// 5. ACESSIBILIDADE INTERNA DO MONITOR / CMD (BLOCO A BLOCO)
function mapearItensCmdA11y() {
    const backdrop = document.getElementById('tela-backdrop');
    if (!backdrop || backdrop.style.display !== 'flex') return;

    const btnFechar = backdrop.querySelector('.botao-fechar-cmd');
    const historico = document.getElementById('historico-linhas');
    const areaInput = document.getElementById('area-input');

    const blocosHistorico = historico ? Array.from(historico.children).filter(el => {
        return el.innerText && el.innerText.trim().length > 0 && el.tagName !== 'BR';
    }) : [];

    itensCmd = [
        btnFechar,
        ...blocosHistorico,
        areaInput
    ].filter(el => el !== null);
}

function focarItemCmd(indice) {
    mapearItensCmdA11y();
    if (itensCmd.length === 0) return;

    document.querySelectorAll('#tela-backdrop .foco-interno').forEach(el => el.classList.remove('foco-interno'));
    indiceItemCmd = (indice + itensCmd.length) % itensCmd.length;

    const el = itensCmd[indiceItemCmd];
    el.classList.add('foco-interno');

    const input = document.getElementById('prompt-input');

    if (el.classList.contains('botao-fechar-cmd')) {
        el.focus();
        falarTextoMesa("Botão fechar monitor. Ou pressione ESC.");
    } else if (el.id === 'area-input') {
        if (input && !input.disabled) {
            input.focus();
            falarTextoMesa("Linha de digitação. Digite seu comando.");
        }
    } else {
        el.setAttribute('tabindex', '0');
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const texto = el.innerText.trim();
        if (texto.startsWith("Microsoft Windows") || texto.includes("TERMINAL OPERACIONAL")) {
            falarTextoMesa("Terminal Operacional SEMAE.");
        } else {
            falarTextoMesa(texto);
        }
    }
}

function narrarTerminalA11y(texto) {
    if (!configA11yMesa.voz || !texto) return;

    let limpo = texto.replace(/<[^>]*>/g, ' ')
                     .replace(/\[✓\]/g, 'Sucesso:')
                     .replace(/\[OK\]/g, 'Confirmado:')
                     .replace(/\[ERRO\]/g, 'Erro:')
                     .replace(/==+/g, '')
                     .replace(/\s+/g, ' ')
                     .trim();

    falarTextoMesa(limpo);
}
window.narrarTerminalA11y = narrarTerminalA11y;


// 6. ACESSIBILIDADE INTERNA DO MANUAL (ESTRUTURAÇÃO DINÂMICA)
function estruturarTextosManualA11y() {
    const paginas = document.querySelectorAll('#caderno .pagina');
    paginas.forEach(pag => {
        if (pag.dataset.a11yPreparada) return;
        pag.dataset.a11yPreparada = "true";

        const childNodes = Array.from(pag.childNodes);
        let bufferNodes = [];

        const empacotarBuffer = () => {
            if (bufferNodes.length === 0) return;
            const texto = bufferNodes.map(n => n.textContent || '').join('').trim();
            if (texto.length > 0) {
                const wrapper = document.createElement('div');
                wrapper.className = 'bloco-didatico-manual';
                pag.insertBefore(wrapper, bufferNodes[0]);
                bufferNodes.forEach(n => wrapper.appendChild(n));
            }
            bufferNodes = [];
        };

        childNodes.forEach(node => {
            const isKnownBlock = node.nodeType === 1 && (
                node.classList.contains('carimbo-python') ||
                node.classList.contains('titulo-pagina') ||
                node.classList.contains('subtitulo-pagina') ||
                node.classList.contains('nota-manuscrita') ||
                node.classList.contains('quadro-azul')
            );

            if (isKnownBlock) {
                empacotarBuffer();
            } else {
                bufferNodes.push(node);
            }
        });
        empacotarBuffer();
    });
}

function mapearItensManualA11y() {
    estruturarTextosManualA11y();

    const paginas = document.querySelectorAll('#caderno .pagina');
    if (!paginas || !paginas[paginaAtual]) return;

    const pag = paginas[paginaAtual];

    itensManual = Array.from(pag.querySelectorAll(
        '.carimbo-python, .titulo-pagina, .subtitulo-pagina, .bloco-didatico-manual, .nota-manuscrita, .quadro-azul'
    )).filter(el => el.offsetParent !== null && el.innerText.trim().length > 0);

    if (itensManual.length === 0) {
        itensManual = [pag];
    }
}

function focarItemManual(indice) {
    mapearItensManualA11y();
    if (itensManual.length === 0) return;

    document.querySelectorAll('#caderno .foco-interno').forEach(el => el.classList.remove('foco-interno'));

    indiceItemManual = (indice + itensManual.length) % itensManual.length;
    const el = itensManual[indiceItemManual];

    el.classList.add('foco-interno');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let texto = el.innerText;
    if (el.classList.contains('carimbo-python')) texto = `Etiqueta técnica: ${texto}`;
    else if (el.classList.contains('titulo-pagina')) texto = `Título: ${texto}`;
    else if (el.classList.contains('subtitulo-pagina')) texto = `Tópico: ${texto}`;
    else if (el.classList.contains('nota-manuscrita')) texto = `Anotação manuscrita: ${texto}`;
    else if (el.classList.contains('quadro-azul')) texto = `Quadro de orientação: ${texto}`;
    else texto = `Instrução: ${texto}`;

    falarTextoMesa(texto);
}

function narrarTituloCaderno() {
    setTimeout(() => {
        const paginas = document.querySelectorAll('#caderno .pagina');
        if (paginas && paginas[paginaAtual]) {
            const titulo = paginas[paginaAtual].querySelector('.titulo-pagina');
            const texto = titulo ? titulo.innerText : `Página ${paginaAtual}`;
            falarTextoMesa(`Manual: ${texto}. Use as setas para baixo e cima para selecionar e ouvir cada tópico.`);
            focarItemManual(0);
        }
    }, 250);
}


// 7. ACESSIBILIDADE INTERNA DA GAVETA DE ARQUIVOS
function focarArquivosA11y() {
    const backdrop = document.getElementById('arquivos-backdrop');
    if (!backdrop || backdrop.style.display !== 'flex') return;

    const titulo = backdrop.querySelector('.titulo-alerta');
    const msg = backdrop.querySelector('.mensagem-alerta');

    itensArquivos = [titulo, msg].filter(el => el !== null);
    indiceItemArquivos = 0;

    if (titulo) {
        titulo.classList.add('foco-interno');
        falarTextoMesa("Alerta: Acesso Restrito. Você ainda não pode mexer nos arquivos. Pressione ESC para fechar.");
    }
}


// 8. OUVINTES DE TECLADO E NAVEGAÇÃO ESPACIAL
window.addEventListener('keydown', (e) => {
    const janelaAtiva = verificarJanelaAberta();

    // A tecla ESC fecha qualquer janela aberta normalmente (usabilidade padrão)
    if (e.key === 'Escape') {
        if (janelaAtiva === 'manual') {
            e.preventDefault();
            if (typeof fecharManual === 'function') fecharManual();
            const el = document.getElementById('hitbox-manual');
            if (configA11yMesa.teclado && el) el.focus();
            return;
        }
        if (janelaAtiva === 'chamados') {
            e.preventDefault();
            if (typeof fecharChamados === 'function') fecharChamados();
            const el = document.getElementById('hitbox-chamados');
            if (configA11yMesa.teclado && el) el.focus();
            return;
        }
        if (janelaAtiva === 'cmd') {
            e.preventDefault();
            if (typeof fecharTela === 'function') fecharTela();
            const el = document.getElementById('hitbox-tela');
            if (configA11yMesa.teclado && el) el.focus();
            return;
        }
        if (janelaAtiva === 'arquivos') {
            e.preventDefault();
            if (typeof fecharArquivos === 'function') fecharArquivos();
            const el = document.getElementById('hitbox-arquivos');
            if (configA11yMesa.teclado && el) el.focus();
            return;
        }
    }

    // REGRA DE OURO: Se a navegação por teclado NÃO estiver ativa, 
    // bloqueia totalmente a captura de setas, tabs e molduras laranjas!
    if (!configA11yMesa.teclado) return;

    // --- DAQUI EM DIANTE SÓ EXECUTA SE A ACESSIBILIDADE ESTIVER LIGADA ---

    // A. Manual dos Estagiários (Setas viram e navegam)
    if (janelaAtiva === 'manual') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            if (typeof mudarPaginaCaderno === 'function') {
                mudarPaginaCaderno(1);
                narrarTituloCaderno();
            }
            return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            if (typeof mudarPaginaCaderno === 'function') {
                mudarPaginaCaderno(-1);
                narrarTituloCaderno();
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focarItemManual(indiceItemManual + 1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            focarItemManual(indiceItemManual - 1);
            return;
        }
        return;
    }

    // B. Sistema de Chamados (Setas navegam)
    if (janelaAtiva === 'chamados') {
        if (e.key === 'ArrowDown' || e.key === 'Tab') {
            e.preventDefault();
            focarItemChamados(indiceItemChamados + 1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            focarItemChamados(indiceItemChamados - 1);
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const ativo = document.activeElement;
            if (ativo && (ativo.tagName === 'BUTTON' || ativo.classList.contains('botao-fechar-x'))) {
                e.preventDefault();
                ativo.click();
            }
            return;
        }
        return;
    }

    // C. Monitor CMD (Navegação bloco a bloco)
    if (janelaAtiva === 'cmd') {
        const input = document.getElementById('prompt-input');
        if (e.key === 'Tab' || (e.key === 'ArrowUp' && input && input.value.length === 0 && document.activeElement === input)) {
            e.preventDefault();
            mapearItensCmdA11y();
            const idxInicial = itensCmd.length >= 2 ? itensCmd.length - 2 : 0;
            focarItemCmd(e.key === 'Tab' ? (indiceItemCmd + (e.shiftKey ? -1 : 1)) : idxInicial);
            return;
        }
        if (document.activeElement !== input) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                focarItemCmd(indiceItemCmd + 1);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                focarItemCmd(indiceItemCmd - 1);
                return;
            }
        }
        if (e.key === 'F1') {
            e.preventDefault();
            if (typeof roteiroAtual !== 'undefined' && roteiroAtual[faseAtual]) {
                narrarTerminalA11y(roteiroAtual[faseAtual].prompt);
            }
            return;
        }
        return;
    }

    // D. Arquivos
    if (janelaAtiva === 'arquivos') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (itensArquivos.length > 0) {
                itensArquivos.forEach(el => el.classList.remove('foco-interno'));
                indiceItemArquivos = (indiceItemArquivos + 1) % itensArquivos.length;
                const el = itensArquivos[indiceItemArquivos];
                el.classList.add('foco-interno');
                falarTextoMesa(el.innerText);
            }
            return;
        }
        return;
    }

    // E. Cenário Livre da Mesa (Setas navegam)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        focarItemMesa(indiceItemMesa + 1);
        return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        focarItemMesa(indiceItemMesa - 1);
        return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
        const ativo = document.activeElement;
        if (ativo && (ativo.classList.contains('hitbox') || ativo.id === 'instrucao-texto')) {
            e.preventDefault();
            ativo.click();
            if (ativo.id === 'hitbox-arquivos') {
                setTimeout(focarArquivosA11y, 100);
            }
        }
    }
});


// 9. INICIALIZAÇÃO DE ACESSIBILIDADE
window.addEventListener('DOMContentLoaded', () => {
    estruturarTextosManualA11y();
    mapearItensMesa();
    sincronizarA11yMesa();

    const rotulos = {
        'hitbox-tela': 'Monitor: Prompt de comando.',
        'hitbox-manual': 'Manual dos estagiários.',
        'hitbox-chamados': 'Telefone: Sistema de chamados.',
        'hitbox-arquivos': 'Gaveta de arquivos.',
        'instrucao-texto': 'Instrução: Explore um pouco e veja o que encontra.'
    };

    Object.keys(rotulos).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('data-fala', rotulos[id]);
            el.addEventListener('mouseenter', () => falarTextoMesa(rotulos[id]));
            el.addEventListener('focus', () => {
                const idx = itensMesa.indexOf(el);
                if (idx !== -1) indiceItemMesa = idx;
            });
        }
    });

    if (configA11yMesa.teclado) {
        setTimeout(() => focarItemMesa(0), 300);
    }

    if (configA11yMesa.voz) {
        setTimeout(() => {
            falarTextoMesa("Sua mesa de trabalho. Use as setas para explorar o monitor, manual, telefone e arquivos.");
        }, 500);
    }
});
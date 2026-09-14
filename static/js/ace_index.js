// =========================================================
// static/js/ace_index.js
// =========================================================

// 1. CONFIGURAÇÕES E ESTADOS GLOBAIS
const configA11y = {
    voz: localStorage.getItem('a11y_voz') === 'true',
    teclado: localStorage.getItem('a11y_teclado') === 'true',
    icones: localStorage.getItem('a11y_icones') === 'true'
};

let painelAberto = false;
let modoDeEntrada = 'teclado';
let vozMaria = null;

let indiceOpcaoPainel = 0;
const idsOpcoesPainel = ['item-voz', 'item-teclado', 'item-icones'];
const tiposOpcoesPainel = ['voz', 'teclado', 'icones'];

let itensPagina = [];
let indicePagina = 0;


// 2. CONFIGURAÇÃO DA VOZ (SÍNTESE NATIVA PT-BR)
function carregarVozMaria() {
    if (!('speechSynthesis' in window)) return;
    const todasVozes = window.speechSynthesis.getVoices();
    vozMaria = todasVozes.find(v => v.name.toLowerCase().includes('maria'))
            || todasVozes.find(v => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt'));
}

carregarVozMaria();
if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = carregarVozMaria;
}


// 3. DETECÇÃO DE ENTRADA (TECLADO vs MOUSE)
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '].includes(e.key)) {
        modoDeEntrada = 'teclado';
    }
});

window.addEventListener('mousemove', (e) => {
    if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
        modoDeEntrada = 'mouse';
    }
});


// 4. MOTOR DE NARRATIVA POR VOZ
function falarTexto(texto, origem = 'teclado') {
    if (!configA11y.voz || !texto || !('speechSynthesis' in window)) return;
    if (origem === 'mouse' && modoDeEntrada === 'teclado') return;
    executarFala(texto);
}

function falarForcada(texto) {
    if (!('speechSynthesis' in window)) return;
    executarFala(texto);
}

function executarFala(texto) {
    window.speechSynthesis.cancel();
    const som = new SpeechSynthesisUtterance(texto);
    som.lang = 'pt-BR';
    if (!vozMaria) carregarVozMaria();
    if (vozMaria) som.voice = vozMaria;
    som.pitch = 1.0;
    som.rate = 1.05;
    window.speechSynthesis.speak(som);
}


// 5. CONTROLE DO PAINEL DE ACESSIBILIDADE
function focarOpcaoPainel(novoIndice) {
    indiceOpcaoPainel = (novoIndice + idsOpcoesPainel.length) % idsOpcoesPainel.length;
    idsOpcoesPainel.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el && idx === indiceOpcaoPainel) {
            el.focus();
            const nome = el.querySelector('.item-info') ? el.querySelector('.item-info').innerText : '';
            const status = el.querySelector('.badge-status') ? el.querySelector('.badge-status').innerText : '';
            falarTexto(`${nome}, status: ${status}`, 'teclado');
        }
    });
}

function alternarPainelA11y(forcar = null) {
    const gatilho = document.getElementById('gatilho-acessibilidade');
    const painel = document.getElementById('painel-opcoes');
    if (!painel || !gatilho) return;

    painelAberto = forcar !== null ? forcar : !painelAberto;
    painel.classList.toggle('aberto', painelAberto);
    painel.style.display = painelAberto ? 'flex' : 'none';

    atualizarCorGatilho();

    if (painelAberto) {
        falarForcada("Painel de acessibilidade aberto. Use as setas para navegar e Enter para alternar.");
        indiceOpcaoPainel = 0;
        setTimeout(() => focarOpcaoPainel(0), 50);
    } else {
        gatilho.focus();
    }
}

function alternarOpcaoA11y(tipo) {
    configA11y[tipo] = !configA11y[tipo];
    const ativo = configA11y[tipo];
    localStorage.setItem(`a11y_${tipo}`, ativo);
    aplicarEfeitosVisuais();

    if (tipo === 'teclado') falarForcada(ativo ? "Navegação por teclado ligada." : "Navegação por teclado desligada.");
    if (tipo === 'icones') falarForcada(ativo ? "Destaques visuais ligados." : "Destaques visuais desligados.");
    if (tipo === 'voz') {
        if (ativo) falarForcada("Leitura por voz ativada.");
        else window.speechSynthesis.cancel();
    }
}

function aplicarEfeitosVisuais() {
    ['voz', 'teclado', 'icones'].forEach(tipo => {
        const badge = document.getElementById(`badge-${tipo}`);
        if (badge) {
            badge.textContent = configA11y[tipo] ? "LIGADO [✓]" : "DESLIGADO";
            badge.classList.toggle('ativo', configA11y[tipo]);
        }
    });
    document.body.classList.toggle('teclado-ativo', configA11y.teclado);
    document.body.classList.toggle('icones-ativos', configA11y.icones);
    atualizarCorGatilho();
}

function atualizarCorGatilho() {
    const gatilho = document.getElementById('gatilho-acessibilidade');
    if (!gatilho) return;
    const algumAtivo = configA11y.voz || configA11y.teclado || configA11y.icones || painelAberto;
    gatilho.classList.toggle('ativa', algumAtivo);
}


// 6. NAVEGAÇÃO POR SETAS E MAPA INTELIGENTE (INDEX vs SALA)
function atualizarItensPagina() {
    const ehTelaSala = document.getElementById('hitbox-mesa') !== null;
    if (ehTelaSala) {
        itensPagina = [
            document.getElementById('nav-titulo-sala'),
            document.getElementById('hitbox-mesa'),
            document.getElementById('instrucao-texto')
        ].filter(el => el !== null);
    } else {
        itensPagina = [
            document.getElementById('titulo-texto'),
            document.getElementById('gatilho-acessibilidade'),
            document.getElementById('subtitulo-texto'),
            document.getElementById('username'),
            document.getElementById('btn-entrar')
        ].filter(el => el !== null);
    }
}

function focarItem(indice) {
    if (itensPagina.length === 0) atualizarItensPagina();
    if (itensPagina.length === 0) return;

    itensPagina.forEach(el => el.classList.remove('foco-pagina'));
    indicePagina = (indice + itensPagina.length) % itensPagina.length;

    const el = itensPagina[indicePagina];
    el.focus();
    el.classList.add('foco-pagina');

    const fala = el.getAttribute('data-fala');
    if (fala) falarTexto(fala, 'teclado');
}

window.addEventListener('keydown', (e) => {
    // Atalho universal Alt + A
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        alternarPainelA11y();
        return;
    }

    // Navegação interna do painel aberto
    if (painelAberto) {
        if (e.key === 'Escape') {
            e.preventDefault();
            alternarPainelA11y(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focarOpcaoPainel(indiceOpcaoPainel + 1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            focarOpcaoPainel(indiceOpcaoPainel - 1);
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const tipo = tiposOpcoesPainel[indiceOpcaoPainel];
            if (tipo) alternarOpcaoA11y(tipo);
            return;
        }
        return;
    }

    // Navegação na tela principal (Index ou Sala)
    if (!configA11y.teclado) return;

    const focoAtual = document.activeElement;
    const digitandoNome = focoAtual && focoAtual.id === 'username';
    const noGatilhoA11y = focoAtual && focoAtual.id === 'gatilho-acessibilidade';

    if (e.key === 'ArrowLeft') {
        if (digitandoNome && focoAtual.selectionStart !== 0) return;
        e.preventDefault();
        const idxGatilho = itensPagina.findIndex(el => el.id === 'gatilho-acessibilidade');
        if (idxGatilho !== -1) {
            focarItem(idxGatilho);
        } else {
            focarItem(indicePagina - 1);
        }
        return;
    }

    if (e.key === 'ArrowRight') {
        if (noGatilhoA11y) {
            e.preventDefault();
            const idxSubtitulo = itensPagina.findIndex(el => el.id === 'subtitulo-texto');
            focarItem(idxSubtitulo !== -1 ? idxSubtitulo : 1);
            return;
        }
        if (digitandoNome) return;
        e.preventDefault();
        focarItem(indicePagina + 1);
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        focarItem(indicePagina + 1);
        return;
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        focarItem(indicePagina - 1);
        return;
    }

    if (e.key === 'Enter' && noGatilhoA11y) {
        e.preventDefault();
        alternarPainelA11y();
    }
});


// 7. INICIALIZAÇÃO E OUVINTES
window.addEventListener('DOMContentLoaded', () => {
    atualizarItensPagina();
    aplicarEfeitosVisuais();

    const gatilho = document.getElementById('gatilho-acessibilidade');
    if (gatilho) {
        gatilho.addEventListener('click', () => alternarPainelA11y());
    }

    // Sincroniza o foco do painel caso o usuário use TAB ou clique
    idsOpcoesPainel.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('focus', () => { indiceOpcaoPainel = idx; });
        }
    });

    document.querySelectorAll('[data-fala]').forEach(el => {
        el.addEventListener('mouseenter', () => falarTexto(el.getAttribute('data-fala'), 'mouse'));
    });
});
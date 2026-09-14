// =========================================================
// static/js/roteiros/dia1.js
// =========================================================

// 1. METADADOS DO CHAMADO 1
const chamadoDia1 = {
    codigo: "SE-CTI-26-0001",
    assunto: "Diagnóstico básico da estação de trabalho",
    solicitante: "Rafael Mendes",
    setor: "Atendimento ao Usuário",
    equipamento: "ATD-07",
    prioridade: "Normal",
    statusInicial: "Pendente",
    historico: "O usuário Rafael Mendes informou ao TI que a estação de trabalho ATD-07 apresentou um comportamento inesperado durante o expediente.<br><br>Segundo o usuário, o computador está ligado e conectado à rede, porém algumas informações não estão sendo apresentadas corretamente.",
    supervisor: "Marcos Almeida"
};

// 2. FASES DO TERMINAL (ROTEIRO COMPLETO DAS 12 ETAPAS)
function obterRoteiroDia1(nomeEstagiario) {
    const nomeUpper = (nomeEstagiario || 'ESTAGIÁRIO').toUpperCase();

    return [
        // Fase 0
        {
            prompt: "ATENDIMENTO SE-CTI-26-0001\n\nO primeiro passo é verificar se o terminal\nestá funcionando corretamente.\n\nFaça o computador apresentar:\nTESTE DE TERMINAL INICIADO",
            esperado: ['print("teste de terminal iniciado")', "print('teste de terminal iniciado')"],
            dica_valor: "teste de terminal iniciado",
            erroMsg: "Use o comando print com parênteses e aspas para exibir a mensagem.",
            sucesso: "TESTE DE TERMINAL INICIADO\n\n<span class='transicao-verde'>[✓] TERMINAL OPERACIONAL</span>",
            proxEspera: 1000
        },

        // Fase 1
        {
            prompt: "O terminal está funcionando.\n\nO usuário deste chamado é:\n\nRafael Mendes\n\nFaça o computador perguntar o nome do usuário e aguardar a resposta.\nA pergunta deverá ser:\n<span class='interacao-amarela'>Qual é o nome do usuário?</span>",
            esperado: ['input("qual é o nome do usuário?")', "input('qual é o nome do usuário?')"],
            dica_valor: "Qual é o nome do usuário?",
            erroMsg: "O programa precisa fazer a pergunta usando a função input().",
            sucesso: "<span class='transicao-verde'>Qual é o nome do usuário?</span>"
        },

        // Fase 2
        {
            prompt: "",
            esperado: ['rafael mendes'],
            dica_valor: "Rafael Mendes",
            erroMsg: "Digite exatamente o nome do solicitante (Rafael Mendes).",
            sucesso: "<span class='transicao-verde'>[✓] INFORMAÇÃO CAPTURADA</span>\n\nUsuário informado:\nRafael Mendes",
            proxFaseSimulada: true,
            proxEspera: 1000
        },

        // Fase 3
        {
            prompt: "A informação foi recebida, mas precisamos guardá-la\npara não perguntar novamente.\n\nComplete o comando:\n\nusuario = ________(\"Qual é o nome do usuário?\")",
            esperado: ['input', 'input()', 'usuario=input("qual é o nome do usuário?")', "usuario=input('qual é o nome do usuário?')"],
            dica_valor: "input",
            erroMsg: "Preencha a lacuna com a função usada para receber dados do usuário.",
            sucesso: "<span class='transicao-verde'>[✓] INFORMAÇÃO ARMAZENADA</span>",
            proxEspera: 1000,
            substituirComando: 'usuario = input("Qual é o nome do usuário?")'
        },

        // Fase 4
        {
            prompt: "Agora mostre o nome do usuário utilizando a variável <span class='interacao-amarela'>usuario</span>.",
            esperado: ['print(usuario)'],
            dica_variavel: "usuario",
            erroMsg: "Use print() referenciando a variável 'usuario' (sem usar aspas).",
            sucesso: "Rafael Mendes\n\n<span class='transicao-verde'>[✓] VARIÁVEL UTILIZADA</span>",
            proxEspera: 1000
        },

        // Fase 5
        {
            prompt: "========================================\n             ESTAÇÃO ATD-07\n========================================\n\nO usuário informou que a estação está ligada.\n\nRegistre essa informação usando a variável:\n<span class='interacao-amarela'>computador_ligado</span>\n\nO valor deve representar VERDADEIRO.",
            esperado: ['computador_ligado = True', 'computador_ligado = true', 'computador_ligado=True', 'computador_ligado=true'],
            dica_variavel: "computador_ligado",
            dica_valor: "True",
            erroMsg: "Crie a variável 'computador_ligado' e atribua a ela o valor booleano True.",
            sucesso: "<span class='transicao-verde'>[✓] ESTADO REGISTRADO</span>\n\nATD-07\nCOMPUTADOR: LIGADO",
            proxEspera: 1000
        },

        // Fase 6
        {
            prompt: "A informação sobre o estado da estação foi registrada.\n\nAgora a estação também precisa saber o que fazer\nquando o computador NÃO estiver ligado.\n\nOrganize as instruções abaixo para formar o código correto:\n\n[ print(\"VERIFICAR ESTAÇÃO\") ]\n[ else: ]\n[ if computador_ligado: ]\n[ print(\"ESTAÇÃO OPERACIONAL\") ]\n\nDigite as linhas na ordem correta, uma por vez, e pressione Enter.",
            esperado: ['if computador_ligado:', 'if computador_ligado == True:', 'if computador_ligado == true:'],
            dica_variavel: "if computador_ligado:",
            erroMsg: "A estrutura de decisão deve começar avaliando a condição com 'if'.",
            sucesso: "",
            proxEspera: 0
        },

        // Fase 7
        {
            prompt: "",
            esperado: ['    print("estação operacional")', '    print(\'estação operacional\')', 'print("estação operacional")', 'print(\'estação operacional\')'],
            dica_valor: '    print("ESTAÇÃO OPERACIONAL")',
            erroMsg: "O que acontece se a condição for verdadeira? Digite o comando esperado.",
            sucesso: "",
            proxEspera: 0
        },

        // Fase 8
        {
            prompt: "",
            esperado: ['else:'],
            dica_valor: "else:",
            erroMsg: "Use 'else:' para definir o caminho alternativo.",
            sucesso: "",
            proxEspera: 0
        },

        // Fase 9
        {
            prompt: "",
            esperado: ['    print("verificar estação")', '    print(\'verificar estação\')', 'print("verificar estação")', 'print(\'verificar estação\')'],
            dica_valor: '    print("VERIFICAR ESTAÇÃO")',
            erroMsg: "O que acontece se a condição for falsa? Digite o comando esperado.",
            sucesso: "<span class='transicao-verde'>[✓] IF / ELSE CONCLUÍDO</span>",
            proxEspera: 1200
        },

        // Fase 10
        {
            prompt: "O supervisor precisa do resultado final.\n\nA estação está ligada.\n\nO diagnóstico deve apresentar:\n[OK] DIAGNÓSTICO CONCLUÍDO\n\nMonte a instrução necessária para que o terminal\nconfirme o diagnóstico.\n\n(Comece verificando a condição na 1ª linha)",
            esperado: ['if computador_ligado:', 'if computador_ligado == True:'],
            dica_variavel: "if computador_ligado:",
            erroMsg: "Você precisa verificar a condição novamente usando 'if'.",
            sucesso: "",
            proxEspera: 0
        },

        // Fase 11
        {
            prompt: "",
            esperado: ['    print("[ok] diagnóstico concluído")', '    print(\'[ok] diagnóstico concluído\')', 'print("[ok] diagnóstico concluído")', 'print(\'[ok] diagnóstico concluído\')'],
            dica_valor: '    print("[OK] DIAGNÓSTICO CONCLUÍDO")',
            erroMsg: "Execute a ação esperada dentro do if usando o print().",
            sucesso: `[OK] DIAGNÓSTICO CONCLUÍDO\n\n<span class='transicao-verde'>[✓] DIAGNÓSTICO CONCLUÍDO</span>\n\n=======================================\n             DIAGNÓSTICO REGISTRADO\n=======================================\n\nRESPOSTA DO MARCOS:\n\n${nomeUpper},\n\nPrimeiro atendimento concluído.\n\nVocê começou verificando se o terminal funcionava. Depois aprendeu a receber informações, guardá-las e tomar decisões usando if e else.\n\nEsse é o princípio.\n\n— Marcos Almeida\nSupervisor de TI\n\n=======================================\n\n<span class='interacao-amarela' style='cursor:pointer' onclick='encerrarDia()'>[ ENCERRAR DIA ]</span>`
        }
    ];
}

window.chamadoDia1 = chamadoDia1;
window.obterRoteiroDia1 = obterRoteiroDia1;
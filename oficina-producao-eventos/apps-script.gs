/**
 * Recebe as inscrições da Oficina de Produção de Eventos
 * e grava na planilha onde este script está instalado.
 *
 * Abas criadas automaticamente:
 *   Inscrições – uma linha por participante, na ordem de chegada (no máximo 20)
 *   Lista de espera – inscrições que chegam depois das 20 vagas preenchidas
 *   Testes     – envios feitos pela página aberta com ?teste (não ocupam vaga)
 *
 * As três últimas colunas da aba Inscrições ficam em branco para a organização
 * preencher: presença em cada dia e quem foi escolhido para a equipe de produção.
 *
 * Desistência: apague a linha da pessoa em Inscrições, copie a primeira pessoa da
 * Lista de espera para Inscrições e apague a linha dela na Lista de espera.
 * Enquanto houver alguém na Lista de espera, as inscrições novas vão para o fim da fila.
 */

const VAGAS = 20;
// Horário de São Luís (UTC−3). Precisam bater com o index.html.
const ABERTURA = new Date("2026-11-16T00:00:00-03:00");
const ENCERRAMENTO = new Date("2026-12-04T23:59:59-03:00");
const TOTAL_ACEITES = 4;

const COLUNAS = [
  "Ordem", "Protocolo", "Enviado em", "Nome completo", "E-mail", "WhatsApp",
  "Faz curso superior", "Curso", "Período", "Na Uniasselvi", "Instituição", "Matrícula", "Experiência com eventos", "Experiência (detalhes)",
  "Disponível p/ equipe de produção", "Termo aceito",
  "Presente 09/12", "Presente 10/12", "Escolhido(a) p/ equipe"
];
const ABAS = {
  inscricoes: { nome: "Inscrições", colunas: COLUNAS },
  espera: { nome: "Lista de espera", colunas: COLUNAS },
  testes: { nome: "Testes", colunas: COLUNAS }
};
// Posição (base 0) das colunas usadas para achar inscrição repetida
const COL_PROTOCOLO = 1, COL_EMAIL = 4, COL_MATRICULA = 11;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const agora = new Date();
    const teste = d.teste === true || d.teste === "espera";

    if (!teste && (agora < ABERTURA || agora > ENCERRAMENTO)) {
      return json({ ok: false, motivo: "fora_do_prazo" });
    }

    const lerLinhas = sh => sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, COLUNAS.length).getValues().filter(l => l[COL_PROTOCOLO] !== "") : [];
    const shInscricoes = aba(teste ? ABAS.testes : ABAS.inscricoes);
    const shEspera = teste ? shInscricoes : aba(ABAS.espera);
    const inscritos = lerLinhas(shInscricoes);
    const espera = teste ? [] : lerLinhas(shEspera);

    // Mesmo e-mail ou matrícula: não ocupa outra vaga, devolve o protocolo que já existe
    const email = normal(d.email), matricula = normal(d.matricula);
    const igual = l => (email && normal(l[COL_EMAIL]) === email) || (matricula && normal(l[COL_MATRICULA]) === matricula);
    const repetida = inscritos.find(igual);
    if (repetida) return json({ ok: true, protocolo: repetida[COL_PROTOCOLO], jaInscrito: true });
    const repetidaEspera = espera.find(igual);
    if (repetidaEspera) return json({ ok: true, protocolo: repetidaEspera[COL_PROTOCOLO], jaInscrito: true, espera: true });

    // Vagas esgotadas (ou já existe fila): vai para a lista de espera.
    // Se alguém desistir, a organização apaga a linha em Inscrições e chama a próxima pessoa da Lista de espera.
    const vaiParaEspera = teste ? d.teste === "espera" || false : (inscritos.length >= VAGAS || espera.length > 0);
    const sh = vaiParaEspera && !teste ? shEspera : shInscricoes;
    const linhas = vaiParaEspera && !teste ? espera : inscritos;

    const protocolo = (teste ? "TESTE-" : vaiParaEspera ? "ESP-" : "OP-") + Utilities.formatDate(agora, "America/Fortaleza", "yyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100);
    const enviadoEm = Utilities.formatDate(agora, "America/Fortaleza", "dd/MM/yyyy HH:mm:ss");

    sh.appendRow([
      linhas.length + 1, protocolo, enviadoEm, d.nome, d.email, d.telefone,
      d.superior, d.curso, d.periodo, d.uniasselvi, d.instituicao, d.matricula, d.experiencia, d.experienciaDetalhe,
      d.disponivelEquipe,
      (d.aceites || []).length >= TOTAL_ACEITES ? "Sim" : "Incompleto",
      "", "", ""
    ].map(seguro));

    return json({ ok: true, protocolo, espera: vaiParaEspera });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// A página consulta aqui quantas vagas já foram preenchidas.
// Abrir a URL no navegador também serve para conferir se está no ar.
function doGet() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABAS.inscricoes.nome);
  const inscritos = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  return json({ ok: true, status: "Formulário Oficina de Produção no ar", inscritos });
}

function aba(def) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.nome);
  if (!sh) {
    sh = ss.insertSheet(def.nome);
    sh.appendRow(def.colunas);
    sh.getRange(1, 1, 1, def.colunas.length).setFontWeight("bold").setBackground("#e9eff8");
    sh.setFrozenRows(1);
    // Matrícula como texto, para não perder zeros à esquerda
    sh.getRange(1, COL_MATRICULA + 1, sh.getMaxRows(), 1).setNumberFormat("@");
  }
  return sh;
}

function normal(v) {
  return String(v || "").trim().toLowerCase().replace(/\s+/g, "");
}

// Impede que textos começando com = + - @ virem fórmulas na planilha.
function seguro(v) {
  if (typeof v !== "string") return v === undefined || v === null ? "" : v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Recebe as inscrições do formulário de food trucks do Festival de Natal Equatorial
 * e grava na planilha onde este script está instalado.
 *
 * Abas criadas automaticamente:
 *   Inscrições   – uma linha por food truck
 *   Cardápio     – uma linha por item do cardápio
 *   Equipamentos – uma linha por equipamento
 */

const ABAS = {
  inscricoes: {
    nome: "Inscrições",
    colunas: [
      "Protocolo", "Enviado em", "Nome fantasia", "Razão social", "CNPJ", "Responsável legal",
      "WhatsApp", "E-mail", "Instagram", "Carro-chefe", "Cardápio (resumo)",
      "Largura (m)", "Comprimento (m)", "Possui cabo PP 10 mm", "Autossuficiente em água",
      "Equipamentos (resumo)", "Carga total (kVA)", "Funcionários por dia",
      "Servir aos artistas", "Observações", "Termo aceito"
    ]
  },
  cardapio: { nome: "Cardápio", colunas: ["Protocolo", "Nome fantasia", "Item", "Tipo", "Valor (R$)"] },
  equipamentos: { nome: "Equipamentos", colunas: ["Protocolo", "Nome fantasia", "Equipamento", "Qtd.", "Carga (kVA)", "Voltagem", "Amperagem"] }
};

const TOTAL_ACEITES = 8;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const protocolo = "NE-" + Utilities.formatDate(new Date(), "America/Fortaleza", "yyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100);
    const enviadoEm = Utilities.formatDate(new Date(), "America/Fortaleza", "dd/MM/yyyy HH:mm");
    const cardapio = Array.isArray(d.cardapio) ? d.cardapio : [];
    const equipamentos = Array.isArray(d.equipamentos) ? d.equipamentos : [];

    aba(ABAS.inscricoes).appendRow([
      protocolo, enviadoEm, d.nomeFantasia, d.razaoSocial, d.cnpj, d.responsavel,
      d.telefone, d.email, d.instagram, d.carroChefe,
      cardapio.map(i => `${i.item} (${i.tipo}) – R$ ${i.valor}`).join("\n"),
      numero(d.largura), numero(d.comprimento), d.caboPP, d.agua,
      equipamentos.map(q => `${q.qtd}x ${q.nome} – ${q.kva} kVA, ${q.voltagem}, ${q.amperagem}`).join("\n"),
      Number(d.cargaTotalKVA) || 0, Number(d.funcionarios) || 0,
      d.artistas, d.obs,
      (d.aceites || []).length >= TOTAL_ACEITES ? "Sim" : "Incompleto"
    ].map(seguro));

    const abaCardapio = aba(ABAS.cardapio);
    cardapio.forEach(i => abaCardapio.appendRow([protocolo, d.nomeFantasia, i.item, i.tipo, numero(i.valor)].map(seguro)));

    const abaEq = aba(ABAS.equipamentos);
    equipamentos.forEach(q => abaEq.appendRow([protocolo, d.nomeFantasia, q.nome, Number(q.qtd) || 1, numero(q.kva), q.voltagem, q.amperagem].map(seguro)));

    return json({ ok: true, protocolo });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Permite abrir a URL no navegador para conferir se está no ar.
function doGet() {
  return json({ ok: true, status: "Formulário Festival de Natal Equatorial no ar" });
}

function aba(def) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.nome);
  if (!sh) {
    sh = ss.insertSheet(def.nome);
    sh.appendRow(def.colunas);
    sh.getRange(1, 1, 1, def.colunas.length).setFontWeight("bold").setBackground("#e8f2ed");
    sh.setFrozenRows(1);
  }
  return sh;
}

// "15,50" ou "15.50" → 15.5
function numero(v) {
  if (v === undefined || v === null || v === "") return "";
  let s = String(v).replace(/[^\d,.-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? String(v) : n;
}

// Impede que textos começando com = + - @ virem fórmulas na planilha.
function seguro(v) {
  if (typeof v !== "string") return v === undefined || v === null ? "" : v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev';

// Elementos DOM
const elements = {
  esporteSelect: document.getElementById('esporte'),
  competicaoSelect: document.getElementById('competicao'),
  empateInputs: document.querySelectorAll('.empate-input'),
  form: document.getElementById('add-game-form')
};

// Obter dados iniciais
let esportesData = [];
let competicoesData = [];

// Buscar esportes
async function fetchEsportes() {
  const res = await fetch(`${API_URL}/esportes`);
  return res.json();
}

// Buscar competições
async function fetchCompeticoes() {
  const res = await fetch(`${API_URL}/competicoes`);
  return res.json();
}

// Buscar jogos
async function fetchJogos() {
  const res = await fetch(`${API_URL}/jogos`);
  return res.json();
}

// Popular select de esportes
async function populateEsportes() {
  esportesData = await fetchEsportes();
  elements.esporteSelect.innerHTML = '<option value="">Selecione Esporte</option>';
  
  esportesData.forEach(esporte => {
    const option = document.createElement('option');
    option.value = esporte.id;
    option.textContent = esporte.nome;
    elements.esporteSelect.appendChild(option);
  });
}

// Popular select de competições baseado no esporte
function populateCompeticoes(esporteId) {
  elements.competicaoSelect.innerHTML = '<option value="">Selecione Competição</option>';
  elements.competicaoSelect.disabled = !esporteId;
  
  if (!esporteId) return;
  
  const competicoes = competicoesData.filter(c => c.esporte === esporteId);
  competicoes.forEach(competicao => {
    const option = document.createElement('option');
    option.value = competicao.id;
    option.textContent = competicao.nome;
    elements.competicaoSelect.appendChild(option);
  });
}

// Mostrar/ocultar campos de empate conforme esporte
function toggleEmpateFields(esporteId) {
  const esporte = esportesData.find(e => e.id === esporteId);
  const showEmpate = esporte?.colunas?.includes('empate');
  
  elements.empateInputs.forEach(input => {
    input.style.display = showEmpate ? 'block' : 'none';
    input.required = showEmpate;
    if (!showEmpate) input.value = '';
  });
  
  // Ajustar colunas de empate na tabela
  document.querySelectorAll('th:nth-child(5), th:nth-child(8), th:nth-child(11)')
    .forEach(th => th.style.display = showEmpate ? 'table-cell' : 'none');
  document.querySelectorAll('td:nth-child(5), td:nth-child(8), td:nth-child(11)')
    .forEach(td => td.style.display = showEmpate ? 'table-cell' : 'none');
}

// Renderizar tabela de jogos
function renderTable(jogos) {
  const tbody = document.getElementById('jogos-table');
  tbody.innerHTML = '';

  jogos.forEach(jogo => {
    const esporte = esportesData.find(e => e.id === jogo.esporte);
    const competicao = competicoesData.find(c => c.id === jogo.competicao);
    const showEmpate = esporte?.colunas?.includes('empate');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${jogo.time_casa} x ${jogo.time_fora}</td>
      <td>${competicao?.nome || '-'}</td>
      <td>${esporte?.nome || '-'}</td>
      <td><input data-id="${jogo.id}" data-book="bet365" data-type="casa" value="${jogo.odds.bet365.casa}"></td>
      <td style="display: ${showEmpate ? 'table-cell' : 'none'}"><input data-id="${jogo.id}" data-book="bet365" data-type="empate" value="${jogo.odds.bet365.empate || ''}"></td>
      <td><input data-id="${jogo.id}" data-book="bet365" data-type="fora" value="${jogo.odds.bet365.fora}"></td>
      <td><input data-id="${jogo.id}" data-book="betano" data-type="casa" value="${jogo.odds.betano.casa}"></td>
      <td style="display: ${showEmpate ? 'table-cell' : 'none'}"><input data-id="${jogo.id}" data-book="betano" data-type="empate" value="${jogo.odds.betano.empate || ''}"></td>
      <td><input data-id="${jogo.id}" data-book="betano" data-type="fora" value="${jogo.odds.betano.fora}"></td>
      <td><input data-id="${jogo.id}" data-book="betfair" data-type="casa" value="${jogo.odds.betfair?.casa || ''}"></td>
      <td style="display: ${showEmpate ? 'table-cell' : 'none'}"><input data-id="${jogo.id}" data-book="betfair" data-type="empate" value="${jogo.odds.betfair?.empate || ''}"></td>
      <td><input data-id="${jogo.id}" data-book="betfair" data-type="fora" value="${jogo.odds.betfair?.fora || ''}"></td>
      <td>
        <button class="save-btn" data-id="${jogo.id}">Salvar</button>
        <button class="delete-btn" data-id="${jogo.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Event listeners
  tbody.querySelectorAll('.save-btn').forEach(btn => {
    btn.onclick = () => updateOdds(btn.dataset.id);
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deleteGame(btn.dataset.id);
  });
}

// Atualizar odds
async function updateOdds(id) {
  const inputs = document.querySelectorAll(`input[data-id="${id}"]`);
  const odds = { bet365: {}, betano: {}, betfair: {} };
  const jogo = (await fetchJogos()).find(j => j.id === id);
  const esporte = esportesData.find(e => e.id === jogo.esporte);
  const showEmpate = esporte?.colunas?.includes('empate');

  inputs.forEach(input => {
    const { book, type } = input.dataset;
    if (type === 'empate' && !showEmpate) return;
    odds[book][type] = parseFloat(input.value) || 0;
  });

  // Atualiza odds do jogo
  await fetch(`${API_URL}/jogos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ odds })
  });

  // Registra no histórico
  await registrarHistorico(id, odds);

  alert('Odds atualizadas!');
  loadData();
}

async function registrarHistorico(jogoId, odds) {
  const timestamp = new Date().toISOString();

  for (const casa in odds) {
    await fetch(`${API_URL}/historico_odds`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jogoId: jogoId,
        casa: casa,
        casa_valor: odds[casa].casa,
        empate_valor: odds[casa].empate,
        fora_valor: odds[casa].fora,
        data: timestamp
      })
    });
  }
}

// Excluir jogo
async function deleteGame(id) {
  if (!confirm('Confirmar exclusão do jogo?')) return;
  await fetch(`${API_URL}/jogos/${id}`, { method: 'DELETE' });
  alert('Jogo excluído!');
  loadData();
}

// Adicionar novo jogo
elements.form.addEventListener('submit', async e => {
  e.preventDefault();
  
  const esporteId = elements.esporteSelect.value;
  const esporte = esportesData.find(e => e.id === esporteId);
  const showEmpate = esporte?.colunas?.includes('empate');

  const novoJogo = {
    time_casa: elements.form.time_casa.value,
    time_fora: elements.form.time_fora.value,
    horario: elements.form.horario.value,
    competicao: elements.form.competicao.value,
    esporte: esporteId,
    odds: {
      bet365: {
        casa: parseFloat(elements.form.bet365_casa.value),
        fora: parseFloat(elements.form.bet365_fora.value),
        empate: showEmpate ? parseFloat(elements.form.bet365_empate.value) : undefined,
        atualizado: new Date().toISOString()
      },
      betano: {
        casa: parseFloat(elements.form.betano_casa.value),
        fora: parseFloat(elements.form.betano_fora.value),
        empate: showEmpate ? parseFloat(elements.form.betano_empate.value) : undefined,
        atualizado: new Date().toISOString()
      },
      betfair: {
        casa: parseFloat(elements.form.betfair_casa.value),
        fora: parseFloat(elements.form.betfair_fora.value),
        empate: showEmpate ? parseFloat(elements.form.betfair_empate.value) : undefined,
        atualizado: new Date().toISOString()
      }
    }
  };

  await fetch(`${API_URL}/jogos`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(novoJogo)
  });
  
  alert('Jogo adicionado!');
  elements.form.reset();
  loadData();
});

// Event listeners
elements.esporteSelect.addEventListener('change', () => {
  const esporteId = elements.esporteSelect.value;
  populateCompeticoes(esporteId);
  toggleEmpateFields(esporteId);
});

// Carregar todos os dados
async function loadData() {
  try {
    [esportesData, competicoesData] = await Promise.all([
      fetchEsportes(),
      fetchCompeticoes()
    ]);
    
    await populateEsportes();
    const jogos = await fetchJogos();
    renderTable(jogos);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Erro ao carregar dados do servidor');
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', loadData);
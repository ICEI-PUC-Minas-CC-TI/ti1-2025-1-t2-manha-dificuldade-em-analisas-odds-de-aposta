// detalhes.js - renderização completa com cards de histórico
const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev';

// Pega o ID do jogo pela URL
const urlParams = new URLSearchParams(window.location.search);
let jogoId = urlParams.get('id');

async function initDetalhes() {
  if (!jogoId) {
    // Busca primeiro jogo se não tiver id
    try {
      const jogosRes = await fetch(`${API_URL}/jogos`);
      const jogos = await jogosRes.json();
      if (!jogos.length) {
        document.getElementById('jogo').innerHTML = "<p style='color:white;text-align:center;margin-top:20px;'>Nenhum jogo disponível.</p>";
        return;
      }
      jogoId = jogos[0].id;
      history.replaceState(null, '', `?id=${jogoId}`);
    } catch (err) {
      console.error('Erro ao buscar jogos:', err);
      document.getElementById('jogo').innerHTML = "<p style='color:white;text-align:center;margin-top:20px;'>Erro ao carregar jogos.</p>";
      return;
    }
  }
  await carregarJogo();
}

async function carregarJogo() {
  try {
    // Busca dados do jogo
    const jogoRes = await fetch(`${API_URL}/jogos/${jogoId}`);
    if (!jogoRes.ok) throw new Error('Jogo não encontrado');
    const jogo = await jogoRes.json();

    // Busca competições
    const compRes = await fetch(`${API_URL}/competicoes`);
    const competicoes = await compRes.json();
    const nomeCompeticao = competicoes.find(c => c.id === jogo.competicao)?.nome;

    // Formata data e hora
    const dataHora = new Date(jogo.horario);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Renderiza detalhes
    document.getElementById('jogo').innerHTML = `
      <div class="estadio">Estádio: ${jogo.local || '-'}</div>
      <div class="partida">${jogo.time_casa} <br> X <br> ${jogo.time_fora}</div>
      <div class="data">${dataFormatada} - ${horaFormatada}</div>
      <div class="campeonato">${nomeCompeticao}</div>
      <div class="odds">
        ${Object.entries(jogo.odds).map(([book, vals]) => `
          <div>
            <strong>${book}</strong><br>
            <p>Casa: ${vals.casa}</p>
            ${'empate' in vals ? `<p>Empate: ${vals.empate}</p>` : ''}
            <p>Fora: ${vals.fora}</p>
          </div>
        `).join('')}
      </div>
      <div id="historico-odds" class="historico-odds">
        <h2>Histórico de Odds</h2>
      </div>
    `;

    // TODO: inserir código de votação e comentários do parceiro aqui

    // Carrega histórico
    await carregarHistoricoOdds(jogoId);
  } catch (error) {
    console.error('Erro ao carregar dados do jogo:', error);
    document.getElementById('jogo').innerHTML = '<p style="color:white;text-align:center;">Erro ao carregar dados do jogo.<\/p>';
  }
}

async function carregarHistoricoOdds(jogoId) {
  try {
    const res = await fetch(`${API_URL}/historico_odds?jogoId=${jogoId}`);
    const historico = await res.json();
    const container = document.getElementById('historico-odds');

    container.innerHTML = `<h2>Histórico de Odds (últimas 24h)</h2>`;

    if (!historico.length) {
      container.innerHTML += `<p style="color:white;">Nenhuma alteração registrada.</p>`;
      return;
    }

    // Filtrar últimos 24h
    const agora = new Date();
    const ultimas24h = historico.filter(item => {
      const dataItem = new Date(item.data);
      const diffHoras = (agora - dataItem) / (1000 * 60 * 60);
      return diffHoras <= 24;
    });

    if (!ultimas24h.length) {
      container.innerHTML += `<p style="color:white;">Nenhuma alteração registrada nas últimas 24 horas.</p>`;
      return;
    }

    // Arrays separados para casa, empate e fora
    const casas = ultimas24h.map(i => i.casa_valor);
    const empates = ultimas24h.filter(i => i.empate_valor !== undefined).map(i => i.empate_valor);
    const foras = ultimas24h.map(i => i.fora_valor);

    // Calcula maiores e menores de cada tipo
    const maiorCasa = Math.max(...casas);
    const menorCasa = Math.min(...casas);

    const maiorEmpate = empates.length ? Math.max(...empates) : '-';
    const menorEmpate = empates.length ? Math.min(...empates) : '-';

    const maiorFora = Math.max(...foras);
    const menorFora = Math.min(...foras);

    // Exibe resumo
   // Exibe resumo bonitão
container.innerHTML += `
  <div class="resumo-odds">
    <div class="resumo-card">
      <h3>Casa</h3>
      <p>Maior: ${maiorCasa}</p>
      <p>Menor: ${menorCasa}</p>
    </div>
    <div class="resumo-card">
      <h3>Empate</h3>
      <p>Maior: ${maiorEmpate}</p>
      <p>Menor: ${menorEmpate}</p>
    </div>
    <div class="resumo-card">
      <h3>Fora</h3>
      <p>Maior: ${maiorFora}</p>
      <p>Menor: ${menorFora}</p>
    </div>
  </div>
`;


    // Monta tabela
    let tabela = `
      <table class="historico-tabela">
        <thead>
          <tr>
            <th>Casa de Aposta</th>
            <th>Casa</th>
            <th>Empate</th>
            <th>Fora</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
    `;

    ultimas24h.forEach(item => {
      tabela += `
        <tr>
          <td>${item.casa}</td>
          <td>${item.casa_valor}</td>
          <td>${item.empate_valor !== undefined ? item.empate_valor : '-'}</td>
          <td>${item.fora_valor}</td>
          <td>${new Date(item.data).toLocaleString()}</td>
        </tr>
      `;
    });

    tabela += `</tbody></table>`;
    container.innerHTML += tabela;

  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    document.getElementById('historico-odds').innerHTML += `<p style="color:white;">Erro ao carregar histórico.</p>`;
  }
}



// Inicializa
initDetalhes();

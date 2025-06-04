const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev';

// Pega o ID do jogo pela URL
const urlParams = new URLSearchParams(window.location.search);
const jogoId = urlParams.get('id');

if (!jogoId) {
  document.body.innerHTML = "<p style='color:white;text-align:center;margin-top:20px;'>Nenhum jogo selecionado. Volte e escolha um jogo.</p>";
  throw new Error("ID do jogo não informado na URL");
}


async function carregarJogo() {
  try {
    const jogoRes = await fetch(`${API_URL}/jogos/${jogoId}`);
    const jogo = await jogoRes.json();

    const compRes = await fetch(`${API_URL}/competicoes`);
    const competicoes = await compRes.json();
    const nomeCompeticao = competicoes.find(c => c.id === jogo.competicao)?.nome;

    const dataHora = new Date(jogo.horario);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const odds = jogo.odds;

    document.getElementById('jogo').innerHTML = `
      <div class="partida">${jogo.time_casa} X ${jogo.time_fora}</div>
      <div class="data">${dataFormatada} - ${horaFormatada}</div>
      <div class="campeonato">${nomeCompeticao}</div>
      <div class="odds">
        ${Object.keys(odds).map(casa => `
          <div>
            <strong>${casa}</strong><br>
            Casa: ${odds[casa].casa}<br>
            ${odds[casa].empate !== undefined ? `Empate: ${odds[casa].empate}<br>` : ''}
            Fora: ${odds[casa].fora}
          </div>
        `).join('')}
      </div>
      <div class="historico" id="historico-odds">
        <h2>Histórico de Odds</h2>
        <p>Carregando histórico...</p>
      </div>
    `;

    carregarHistoricoOdds(jogo.id);
  } catch (error) {
    document.getElementById('jogo').innerHTML = '<p>Erro ao carregar dados do jogo.</p>';
    console.error(error);
  }
}

async function carregarHistoricoOdds(jogoId) {
  const res = await fetch(`${API_URL}/historico_odds?jogoId=${jogoId}`);
  const historico = await res.json();

  const container = document.getElementById('historico-odds');
  if (historico.length === 0) {
    container.innerHTML += `<p>Nenhuma alteração registrada ainda.</p>`;
    return;
  }

  container.innerHTML = `<h2>Histórico de Odds</h2>`;
  historico.forEach(item => {
    container.innerHTML += `
      <p>
        <strong>${item.casa}</strong> — 
        Casa: ${item.casa_valor}, 
        ${item.empate_valor !== undefined ? `Empate: ${item.empate_valor}, ` : ''}
        Fora: ${item.fora_valor}
        <br><small>${new Date(item.data).toLocaleString()}</small>
      </p>
    `;
  });
}

carregarJogo();

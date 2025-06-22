const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev:3000';

async function carregarJogo() {
  try {
    // Pega o ID do jogo pela URL (?id=1), senão usa o jogo 1 por padrão
    const urlParams = new URLSearchParams(window.location.search);
    const jogoId = urlParams.get('id') || 1;

    // READ do jogo
    const jogoRes = await fetch(`${API_URL}/jogos/${jogoId}`);
    if (!jogoRes.ok) throw new Error('Jogo não encontrado.');
    const jogo = await jogoRes.json();

    // READ das competições
    const compRes = await fetch(`${API_URL}/competicoes`);
    if (!compRes.ok) throw new Error('Erro ao carregar competições.');
    const competicoes = await compRes.json();
    const nomeCompeticao = competicoes.find(c => c.id === jogo.competicao)?.nome || 'Competição desconhecida';

    // Formatação de data e hora
    const dataHora = new Date(jogo.horario);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const odds = jogo.odds?.bet365;

    // Montagem da tela
    document.getElementById('jogo').innerHTML = `
      <div class="estadio">Estádio: ${jogo.local}</div>
      <div class="partida">${jogo.time_casa} <br> X <br> ${jogo.time_fora}</div>
      <div class="data">${dataFormatada} - ${horaFormatada}</div>
      <div class="campeonato">${nomeCompeticao}</div>
      <div class="odds">
        <div>${jogo.time_casa}<br>${odds?.casa ?? '-'}</div>
        <div>Empate<br>${odds?.empate ?? '-'}</div>
        <div>${jogo.time_fora}<br>${odds?.fora ?? '-'}</div>
      </div>
      <div class="votacao">
        <h2>Votação</h2>
        <p>Quem vai ganhar?</p>
        <label><input type="radio" name="voto"> ${jogo.time_casa}</label>
        <label><input type="radio" name="voto"> Empate</label>
        <label><input type="radio" name="voto"> ${jogo.time_fora}</label>
        <br>
        <button>Votar</button>
      </div>
    `;

    // Lógica de votação
    const botaoVotar = document.querySelector('.votacao button');
    botaoVotar.addEventListener('click', async () => {
      const opcoes = document.querySelectorAll('input[name="voto"]');
      let selecionado = null;

      opcoes.forEach(opcao => {
        if (opcao.checked) {
          selecionado = opcao.parentElement.innerText.trim();
        }
      });

      // Div de resultado
      let resultadoDiv = document.querySelector('.votacao [resultado-parcial]');
      if (resultadoDiv) resultadoDiv.remove();

      resultadoDiv = document.createElement('div');
      resultadoDiv.style.marginTop = '10px';
      resultadoDiv.style.fontWeight = 'bold';
      resultadoDiv.setAttribute('resultado-parcial', true);

      if (!selecionado) {
        resultadoDiv.innerText = 'Por favor, selecione uma opção antes de votar.';
      } else {
        try {
          // POST do voto
          await fetch(`${API_URL}/votos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jogoId: jogo.id,
              resultado: selecionado
            })
          });

          // READ dos votos
          const resVotos = await fetch(`${API_URL}/votos?jogoId=${jogo.id}`);
          const votos = await resVotos.json();

          // Contagem e porcentagem
          const contagem = {};
          votos.forEach(v => {
            contagem[v.resultado] = (contagem[v.resultado] || 0) + 1;
          });

          const total = votos.length;
          const opcoesExibidas = [jogo.time_casa, 'Empate', jogo.time_fora];
          const linhas = opcoesExibidas.map(opcao => {
            const qtd = contagem[opcao] || 0;
            const perc = ((qtd / total) * 100).toFixed(1);
            return `${opcao}: ${qtd} voto(s) - ${perc}%`;
          }).join('<br>');

          resultadoDiv.innerHTML = `Resultado parcial:<br>${linhas}`;
        } catch (err) {
          console.error(err);
          resultadoDiv.innerText = 'Erro ao registrar ou carregar os votos.';
        }
      }

      document.querySelector('.votacao').appendChild(resultadoDiv);
    });

    // Comentários
    const comentariosContainer = document.createElement('div');
    comentariosContainer.className = 'comentarios';
    comentariosContainer.innerHTML = `
      <h2>Comentários</h2>
      <form id="formComentario">
        <textarea id="comentarioTexto" placeholder="Escreva um comentário" required></textarea>
        <br>
        <button type="submit">Enviar</button>
      </form>
      <div id="listaComentarios"></div>
    `;
    document.getElementById('jogo').appendChild(comentariosContainer);

    async function carregarComentarios() {
      const res = await fetch(`${API_URL}/comentarios?jogoId=${jogo.id}`);
      if (!res.ok) return;

      const comentarios = await res.json();
      const lista = document.getElementById('listaComentarios');
      lista.innerHTML = comentarios.map(c => `<p><strong>Usuário:</strong> ${c.texto}</p>`).join('');
    }

    carregarComentarios();

    document.getElementById('formComentario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = document.getElementById('comentarioTexto').value.trim();
      if (!texto) return;

      await fetch(`${API_URL}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogoId: jogo.id, texto })
      });

      document.getElementById('comentarioTexto').value = '';
      carregarComentarios();
    });

  } catch (error) {
    document.getElementById('jogo').innerHTML = '<p>Erro ao carregar dados do jogo.</p>';
    console.error(error);
  }
}

carregarJogo();

const API_URL = 'http://localhost:3000';
//const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev';
async function carregarJogo() {
  try {
    const jogoRes = await fetch(`${API_URL}/jogos/1`); //READ no jogo com id 1- ver como fazer pra mostrar o jogo que clicar
    const jogo = await jogoRes.json();

    const compRes = await fetch(`${API_URL}/competicoes`);//READ Na competicao
    const competicoes = await compRes.json();

    const nomeCompeticao = competicoes.find(c => c.id === jogo.competicao)?.nome;

    const dataHora = new Date(jogo.horario);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');//formatacao de data
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });//formatacao da hora

    const odds = jogo.odds?.bet365;
    //arruma as divisoes, empate está escrito pra ficar mais facil
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
  } catch (error) {
    document.getElementById('jogo').innerHTML = '<p>Erro ao carregar dados do jogo.</p>';//mostra o erro se nao conseguir carregar
    console.error(error);
  }
    const botaoVotar = document.querySelector('.votacao button');
    botaoVotar.addEventListener('click', () => {//pra fazer o botão de votar funcional
      const opcoes = document.querySelectorAll('input[name="voto"]');
      let selecionado = null;

      opcoes.forEach((opcao) => {//checa qual opcao foi marcada
        if (opcao.checked) {
          selecionado = opcao.parentElement.innerText.trim();
        }
      });

      const resultadoDiv = document.createElement('div');//cria uma div pra exibir o resultado
      resultadoDiv.style.marginTop = '10px';
      resultadoDiv.style.fontWeight = 'bold';

      if (selecionado) {//Display temporário na tela, depois computar os votos e salvar no json
        resultadoDiv.innerText = `Resultado parcial: ${selecionado} - 100% dos votos`;
      } else {
        resultadoDiv.innerText = 'Por favor, selecione uma opção antes de votar.';
      }

      const votacaoDiv = document.querySelector('.votacao');
      const jaExiste = votacaoDiv.querySelector('div[resultado-parcial]');
      if (jaExiste) jaExiste.remove();//if pra não colocar o resultado várias vezes na tela

      resultadoDiv.setAttribute('resultado-parcial', true);
      votacaoDiv.appendChild(resultadoDiv);
    });

}

carregarJogo();

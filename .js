<script>
    const API_URL = 'https://33765672-f51d-46f5-b276-32beaed4448a-00-3qd9ymtpuc1xv.worf.replit.dev';
    let esportes = [], competicoes = [], jogos = [];
    let currentSport = 'futebol', currentComp = null;

    document.addEventListener('DOMContentLoaded', init);
    async function init() {
      try {
        [esportes, competicoes, jogos] = await Promise.all([
          fetchEsportes(), fetchCompeticoes(), fetchJogos()
        ]);
      } catch (e) { console.error(e); return; }
      setupTabs(); renderSidebar(); renderGames();
    }

    function fetchEsportes() {
      return fetch(`${API_URL}/esportes`).then(r=>r.json());
    }
    function fetchCompeticoes() {
      return fetch(`${API_URL}/competicoes`).then(r=>r.json());
    }
    function fetchJogos() {
      return fetch(`${API_URL}/jogos`).then(r=>r.json());
    }

    function setupTabs() {
      document.querySelectorAll('.tab').forEach(tab=>{
        tab.onclick = ()=>{
          document.querySelector('.tab.active').classList.remove('active');
          tab.classList.add('active');
          currentSport = tab.dataset.sport;
          currentComp = null;
          renderSidebar(); renderGames();
        };
      });
    }

    function renderSidebar() {
      const ul = document.getElementById('competition-list'); ul.innerHTML = '';
      const list = [{id:null,nome:'Ligas Populares'}].concat(
        competicoes.filter(c=>c.esporte===currentSport)
      );
      list.forEach(c=>{
        const li = document.createElement('li'); li.textContent = c.nome; li.dataset.id = c.id;
        if((currentComp===null&&c.id===null)||c.id===currentComp) li.classList.add('active');
        li.onclick = ()=>{ document.querySelector('.sidebar li.active').classList.remove('active'); li.classList.add('active'); currentComp=c.id; renderGames(); };
        ul.appendChild(li);
      });
    }

    function renderGames() {
  const title = document.getElementById('content-title');
  title.textContent = currentComp ? competicoes.find(c => c.id === currentComp).nome : 'Ligas Populares';
  const tbody = document.getElementById('games-body');
  tbody.innerHTML = '';

  let list = jogos.filter(j => j.esporte === currentSport);
  if (currentComp) list = list.filter(j => j.competicao === currentComp);

  list.forEach(j => {
    const tr = document.createElement('tr');
    const time = new Date(j.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const getBest = (col) => {
      let melhorCasa = null;
      let maiorOdd = 0;

      for (const casa in j.odds) {
        const odd = j.odds[casa][col];
        if (odd && odd > maiorOdd) {
          maiorOdd = odd;
          melhorCasa = casa;
        }
      }

      return {
        odd: maiorOdd.toFixed(2),
        logo: melhorCasa ? `<img src="logos/${melhorCasa}.png" alt="${melhorCasa}" style="height: 20px; margin-top: 4px;" />` : ''
      };
    };

    const casa = getBest('casa');
    const empate = getBest('empate');
    const fora = getBest('fora');

    tr.innerHTML = `
      <td>${time}</td>
      <td>${j.time_casa} vs ${j.time_fora}</td>
      <td>${casa.odd}<br>${casa.logo}</td>
      <td>${empate.odd}<br>${empate.logo}</td>
      <td>${fora.odd}<br>${fora.logo}</td>
    `;
    tbody.appendChild(tr);
  });
}

  </script>
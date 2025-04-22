/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import axios from 'axios';
import "./App.css";

const getRandomPokemon = async () => {
  const randomId = Math.floor(Math.random() * 898) + 1;
  const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
  const moves = data.moves.map(m => m.move.url).sort(() => 0.5 - Math.random());

  const attackMoves = [];
  for (const url of moves) {
    const { data: moveData } = await axios.get(url);
    if (
      moveData.power &&
      (moveData.damage_class.name === 'physical' || moveData.damage_class.name === 'special')
    ) {
      attackMoves.push({ name: moveData.name, power: moveData.power });
    }
    if (attackMoves.length === 4) break;
  }

  while (attackMoves.length < 4) {
    attackMoves.push({ name: "Struggle", power: 50 });
  }

  return {
    name: data.name,
    hp: data.stats[0].base_stat,
    speed: data.stats[5].base_stat,
    moves: attackMoves,
    sprite: data.sprites.front_default
  };
};

const Battle = () => {
  const [playerTeam, setPlayerTeam] = useState([]);
  const [aiTeam, setAiTeam] = useState([]);
  const [turn, setTurn] = useState('player');
  const [gameState, setGameState] = useState('start');
  const [winner, setWinner] = useState(null);
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const player = await Promise.all(Array.from({ length: 6 }, getRandomPokemon));
      const ai = await Promise.all(Array.from({ length: 6 }, getRandomPokemon));
      setPlayerTeam(player);
      setAiTeam(ai);
    };
    fetchTeams();
  }, []);

  const handleAttack = (moveIdx) => {
    if (playerTeam.length === 0 || aiTeam.length === 0) return;

    const updatedPlayer = [...playerTeam];
    const updatedAi = [...aiTeam];
    const playerPokemon = updatedPlayer[0];
    const aiPokemon = updatedAi[0];

    let attacker, defender, attackerTeam, defenderTeam;
    if (playerPokemon.speed >= aiPokemon.speed) {
      attacker = playerPokemon;
      defender = aiPokemon;
      attackerTeam = updatedPlayer;
      defenderTeam = updatedAi;
    } else {
      attacker = aiPokemon;
      defender = playerPokemon;
      attackerTeam = updatedAi;
      defenderTeam = updatedPlayer;
    }

    const moveUsed = attacker.moves.reduce((max, move) => move.power > max.power ? move : max, attacker.moves[0]);
    defender.hp -= moveUsed.power;
    setChatLog(prev => [...prev, `${attacker.name} used ${moveUsed.name}!`]);

    if (defender.hp <= 0) {
      setChatLog(prev => [...prev, `${defender.name} fainted!`]);
      defenderTeam.shift();
    }

    setPlayerTeam(updatedPlayer);
    setAiTeam(updatedAi);

    if (updatedAi.length === 0) {
      setWinner('player');
      setGameState('result');
    } else if (updatedPlayer.length === 0) {
      setWinner('ai');
      setGameState('result');
    }
  };

  if (gameState === 'start') {
    return (
      <div className="battle-container">
        <h1>Poké Battle</h1>
        <h2>Rules:</h2>
        <ul>
          <li><p>Each player (Player & AI) starts with a team of 6 randomly selected Pokémon.</p></li>
          <li><p>Each Pokemon has HP and Speed, the pokemon which higher speed, its attack will land first.</p></li>
          <li><p>The player chooses a move and ai randomly selects it move.</p></li>
          <li><p>You cannot see other player's pokemon's move.</p></li>
          <li><p>If one's team feints the other team wins.</p></li>
        </ul>
        <button className="start-btn" onClick={() => setGameState('battle')}>Start Game</button>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="battle-container">
        <h1>{winner === 'player' ? 'You Win!' : 'AI Wins!'}</h1>
        <button className="restart-btn" onClick={() => window.location.reload()}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="battle-container">
      <h1>Poké Battle</h1>

      <h2>Player Team</h2>
      {playerTeam.map((p, i) => (
        <div key={i} className="pokemon-card">
          <p>{p.name} (HP: {p.hp}) (Speed: {p.speed})</p>
          <img src={p.sprite} alt={p.name} />
          {i === 0 && turn === 'player' &&
            p.moves.map((m, idx) => (
              <button key={idx} className="attack-btn" onClick={() => handleAttack(idx)}>
                {m.name} ({m.power})
              </button>
            ))}
        </div>
      ))}

      <h2>AI Team</h2>
      {aiTeam.map((p, i) => (
        <div key={i} className="pokemon-card">
          <p>{p.name} (HP: {p.hp}) (Speed: {p.speed})</p>
          <img src={p.sprite} alt={p.name} />
        </div>
      ))}

      <div className="chatbox">
        <h3>Battle Log</h3>
        <div className="chat-log">
          {chatLog.map((entry, index) => (
            <p key={index}>{entry}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Battle;

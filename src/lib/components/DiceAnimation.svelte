<script>
  import { onMount } from 'svelte';

  let { diceType = 'd20', result = 0, playerName = 'Player', onComplete } = $props();

  let show = $state(true);
  let rolling = $state(true);
  let confetti = $state([]);

  // Determine if this is a critical roll
  const maxValue = parseInt(diceType.substring(1));
  const isCriticalHit = result === maxValue && maxValue === 20;
  const isCriticalFail = result === 1 && maxValue === 20;

  // Get dice emoji based on type
  function getDiceEmoji(type) {
    const emojiMap = {
      'd4': '🔺',
      'd6': '🎲',
      'd8': '🔸',
      'd10': '🔟',
      'd12': '⬢',
      'd20': '🎯',
      'd100': '💯'
    };
    return emojiMap[type] || '🎲';
  }

  const diceEmoji = getDiceEmoji(diceType);

  onMount(() => {
    // Stop rolling animation after 2 seconds
    const rollTimer = setTimeout(() => {
      rolling = false;
    }, 2000);

    // Generate confetti for critical hits
    if (isCriticalHit) {
      const particles = [];
      for (let i = 0; i < 30; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 1 + Math.random() * 0.5
        });
      }
      confetti = particles;
    }

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      show = false;
      if (onComplete) onComplete();
    }, 4000);

    return () => {
      clearTimeout(rollTimer);
      clearTimeout(dismissTimer);
    };
  });

  function handleClick() {
    show = false;
    if (onComplete) onComplete();
  }
</script>

{#if show}
  <div
    class="dice-animation-overlay"
    onclick={handleClick}
    class:critical-hit={isCriticalHit}
    class:critical-fail={isCriticalFail}
  >
    <div class="dice-container">
      <!-- Rolling dice animation -->
      {#if rolling}
        <div class="dice rolling">
          <span class="dice-icon">{diceEmoji}</span>
        </div>
        <p class="rolling-text">{playerName} is rolling {diceType}...</p>
      {:else}
        <!-- Result reveal -->
        <div class="dice result-reveal">
          <span class="dice-icon">{diceEmoji}</span>
        </div>
        <div class="result-container">
          <p class="player-name">{playerName}</p>
          <p class="result-value" class:crit={isCriticalHit} class:fail={isCriticalFail}>
            {result}
          </p>
          {#if isCriticalHit}
            <p class="result-label critical">CRITICAL HIT!</p>
          {:else if isCriticalFail}
            <p class="result-label fail">CRITICAL FAIL!</p>
          {:else}
            <p class="result-label">Rolled {diceType}</p>
          {/if}
        </div>
      {/if}

      <!-- Confetti for critical hits -->
      {#if isCriticalHit && !rolling}
        {#each confetti as particle (particle.id)}
          <div
            class="confetti"
            style="left: {particle.x}%; top: {particle.y}%; animation-delay: {particle.delay}s; animation-duration: {particle.duration}s;"
          ></div>
        {/each}
      {/if}
    </div>

    <p class="dismiss-hint">Click anywhere to dismiss</p>
  </div>
{/if}

<style>
  .dice-animation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    cursor: pointer;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dice-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .dice {
    font-size: 8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dice.rolling {
    animation: rollDice 0.5s infinite linear;
  }

  @keyframes rollDice {
    0% {
      transform: rotate(0deg) scale(1);
    }
    25% {
      transform: rotate(90deg) scale(1.2);
    }
    50% {
      transform: rotate(180deg) scale(1);
    }
    75% {
      transform: rotate(270deg) scale(1.2);
    }
    100% {
      transform: rotate(360deg) scale(1);
    }
  }

  .dice.result-reveal {
    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .dice-icon {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
  }

  .rolling-text {
    color: white;
    font-size: 1.5rem;
    text-align: center;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    animation: slideUp 0.4s ease-out 0.2s backwards;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .player-name {
    color: #aaa;
    font-size: 1.2rem;
    margin: 0;
  }

  .result-value {
    color: white;
    font-size: 4rem;
    font-weight: bold;
    margin: 0;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
  }

  .result-value.crit {
    color: #ffd700;
    text-shadow: 0 0 40px #ffd700, 0 0 80px #ff8800;
    animation: glowPulse 1s infinite;
  }

  .result-value.fail {
    color: #ff4444;
    text-shadow: 0 0 40px #ff4444, 0 0 80px #aa0000;
    animation: shakeFail 0.5s;
  }

  @keyframes glowPulse {
    0%, 100% {
      text-shadow: 0 0 40px #ffd700, 0 0 80px #ff8800;
    }
    50% {
      text-shadow: 0 0 60px #ffd700, 0 0 120px #ff8800;
    }
  }

  @keyframes shakeFail {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px);
    }
    75% {
      transform: translateX(10px);
    }
  }

  .result-label {
    color: white;
    font-size: 1.2rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .result-label.critical {
    color: #ffd700;
    font-weight: bold;
    font-size: 1.5rem;
    animation: glowPulse 1s infinite;
  }

  .result-label.fail {
    color: #ff4444;
    font-weight: bold;
    font-size: 1.5rem;
  }

  /* Confetti particles */
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background: linear-gradient(45deg, #ffd700, #ff8800, #ff4444, #44ff44, #4444ff);
    animation: confettiFall 2s ease-out infinite;
    pointer-events: none;
  }

  @keyframes confettiFall {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  /* Critical hit background flash */
  .dice-animation-overlay.critical-hit {
    animation: fadeIn 0.3s ease-out, goldFlash 1s ease-out 0.3s;
  }

  @keyframes goldFlash {
    0%, 100% {
      background: rgba(0, 0, 0, 0.85);
    }
    50% {
      background: rgba(255, 215, 0, 0.3);
    }
  }

  /* Critical fail background flash */
  .dice-animation-overlay.critical-fail {
    animation: fadeIn 0.3s ease-out, redFlash 0.5s ease-out 0.3s;
  }

  @keyframes redFlash {
    0%, 100% {
      background: rgba(0, 0, 0, 0.85);
    }
    50% {
      background: rgba(255, 0, 0, 0.3);
    }
  }

  .dismiss-hint {
    position: fixed;
    bottom: 2rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    animation: pulse 2s infinite;
  }

  /* Accessibility: Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    .dice.rolling {
      animation: none;
    }
    .dice.result-reveal {
      animation: none;
    }
    .result-container {
      animation: none;
    }
    .result-value.crit,
    .result-value.fail {
      animation: none;
    }
    .confetti {
      display: none;
    }
    .dice-animation-overlay.critical-hit,
    .dice-animation-overlay.critical-fail {
      animation: fadeIn 0.3s ease-out;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .dice {
      font-size: 6rem;
    }
    .result-value {
      font-size: 3rem;
    }
    .rolling-text {
      font-size: 1.2rem;
    }
  }
</style>

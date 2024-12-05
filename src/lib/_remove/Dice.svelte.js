import { portal } from './State.js';


export async function loadAvailableDiceThemes() {
  const themes = await getDiceThemes();
  portal.dice.availableDiceThemes = themes;
  if (!themes.some((t) => t.name === portal.session.player.selectedDiceTheme)) {
    // if the current theme is not in the list, set it to the first one
    portal.session.player.selectedDiceTheme = portal.dice.availableDiceThemes.at(0);
  }
}
export function requestDiceRoll(expression = '1d20') {
  console.log('Requesting dice roll', expression, portal.player);

  if (!portal.player) return;
  portal.socket.emit('requestDiceRoll', {
    sessionId: portal.session.id,
    diceExpression: expression,
    playerName: portal.player.name,
    diceTheme: portal.player.selectedDiceTheme,
    diceId: portal.player.diceId, //HACK: ensure diceIds allow for rerolls
  });
}



socket.on('diceRollResult', async (data) => {
  const { result, diceTheme } = data;
  await processDiceResult(result, diceTheme);
});

/**
 * @param {string} diceString
 * @param {DiceTheme} theme
 */
async function processDiceResult(diceString, theme) {
  portal.ui.rolling = true;

  const result = await portal.ui.diceBox.roll(diceString, theme, -1);
  console.log('Result', result);

  //TODO: abstract this out to dice config to allow for custom dice roll mechanics
  let resultNumber = result.total ?? 0;
  let outcome = '';
  if (result.notation.includes('{l}')) {
    // @ts-ignore
    resultNumber = Math.max(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
  } else if (result.notation.includes('{s}')) {
    // @ts-ignore
    resultNumber = Math.min(...result.sets.flatMap((s) => s.rolls).map((r) => r.value));
  }

  console.log('calc output');

  if (result.notation.includes('{success}')) {
    if (resultNumber === 20) {
      outcome = 'lucid success';
      diceModifier.set('l');
    } else if (resultNumber >= 11 && resultNumber < 20) {
      outcome = 'success';
    } else if (resultNumber >= 6 && resultNumber < 11) {
      outcome = 'success with cost';
    } else if (resultNumber >= 2 && resultNumber < 6) {
      outcome = 'failure';
    } else if (resultNumber === 1) {
      outcome = 'surreal failure';
      diceModifier.set('s');
    }
  }

  let delay = portal.config.dice.clearDiceDelay;
  setTimeout(() => {
    //TODO: refine this and ensure that it supports rerolls and multiple dice in a roll
    portal.session.diceRolls.push({
      playerId: portal.player.id,
      diceId: '',
      type: '',
      modifer: '',
      result: resultNumber,
      diceExpression: diceString,
      theme: portal.player.selectedDiceTheme,      
      outcome
    });
    portal.ui.rolling = false;
    if (get(portal.config.dice.showDiceResultToast))
      showAlert(`${outcome} (${resultNumber})`);
  }, delay);
}
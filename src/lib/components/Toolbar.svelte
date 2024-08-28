<script>
	import PopoverButton from './PopoverButton.svelte';

	export let player;

	/**
	 * @type {string | any[]}
	 */
	export let players = [];
	export let showPlayerList = false;
	export let showPlayerSettings = false;
	export let showSceneSettings = false;
	export let diceNotation = '1d20';
	export let diceOptions = [
		{
			label: '1d20',
			value: '1d20'
		}
	];
	export let rollDice;
	export let leaveSession;
	export let endSession;
	export let copySessionUrl;
	export let addToken;

	function handleShowPlayerList() {
		showPlayerList = true;
	}
</script>

<div class="player-menu">
	<div class="horizontal-bar">
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={leaveSession}
			title="Leave Session"
		>
			<i class="bi bi-box-arrow-right"></i> </button
		>
		<div class="player-indicator">
			<button
				data-augmented-ui="all-hex border"
				class="aug-button"
				on:click={handleShowPlayerList}
				title="Players"
			>
				<i class="bi bi-people">
					<span class="player-count">{players.length}</span>
				</i></button
			>
		</div>
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={() => (showPlayerSettings = true)}
			title="Player Settings"
		>
			<i class="bi bi-gear"> </i>
		</button>
	</div>
	<div class="dice-button">
		<select bind:value={diceNotation}>
			{#each diceOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={rollDice}
			title="Roll {diceNotation}"
		>
			<svg
				fill="currentColor"
				width="20px"
				height="20px"
				viewBox="-16 0 512 512"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M106.75 215.06L1.2 370.95c-3.08 5 .1 11.5 5.93 12.14l208.26 22.07-108.64-190.1zM7.41 315.43L82.7 193.08 6.06 147.1c-2.67-1.6-6.06.32-6.06 3.43v162.81c0 4.03 5.29 5.53 7.41 2.09zM18.25 423.6l194.4 87.66c5.3 2.45 11.35-1.43 11.35-7.26v-65.67l-203.55-22.3c-4.45-.5-6.23 5.59-2.2 7.57zm81.22-257.78L179.4 22.88c4.34-7.06-3.59-15.25-10.78-11.14L17.81 110.35c-2.47 1.62-2.39 5.26.13 6.78l81.53 48.69zM240 176h109.21L253.63 7.62C250.5 2.54 245.25 0 240 0s-10.5 2.54-13.63 7.62L130.79 176H240zm233.94-28.9l-76.64 45.99 75.29 122.35c2.11 3.44 7.41 1.94 7.41-2.1V150.53c0-3.11-3.39-5.03-6.06-3.43zm-93.41 18.72l81.53-48.7c2.53-1.52 2.6-5.16.13-6.78l-150.81-98.6c-7.19-4.11-15.12 4.08-10.78 11.14l79.93 142.94zm79.02 250.21L256 438.32v65.67c0 5.84 6.05 9.71 11.35 7.26l194.4-87.66c4.03-1.97 2.25-8.06-2.2-7.56zm-86.3-200.97l-108.63 190.1 208.26-22.07c5.83-.65 9.01-7.14 5.93-12.14L373.25 215.06zM240 208H139.57L240 383.75 340.43 208H240z"
				/>
			</svg>
		</button>
	</div>
</div>
{#if player.host}
	<div class="host-menu">
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={endSession}
			title="End Session"
		>
			<i class="bi bi-stop-circle" />
		</button>
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={copySessionUrl}
			title="Copy Session URL"
		>
			<i class="bi bi-person-plus" />
		</button>
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			title="Edit Scene"
			on:click={() => (showSceneSettings = true)}
		>
			<i class="bi bi-image" />
		</button>
		<button
			data-augmented-ui="all-hex border"
			class="aug-button"
			on:click={addToken}
			title="Add Token"
		>
			<i class="bi bi-joystick" />
		</button>
	</div>
{/if}

<style>
	.player-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 16px;
		white-space: nowrap; /* Prevents text wrapping */
	}

	.horizontal-bar {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
		width: 100%;
	}

	.player-count {
		position: absolute;
		margin-left: 5px;
		font-size: 7px;
	}

	.host-menu {
		position: fixed;
		bottom: 25px;
		display: flex;
		gap: 0.5rem;
		flex-direction: column;
		align-items: flex-start;
	}
	.player-menu {
		position: fixed;
		top: 25px;
		bottom: 25px;
		right: 25px;
		left: 25px;
		display: flex;
		gap: 0.5rem;
		flex-direction: column;
		align-items: flex-end;
		justify-content: space-between;
	}

	.dice-button {
		display: flex;
		gap: 0.5rem;
	}
	select {
		height: min-content;
		align-self: center;
		padding: 0.5rem;
		font-size: 1.1rem;
		background-color: #000;
		border-color: var(--fourth-accent);
		border-radius: 10px;
		color: var(--text-light);
	}
	.edit-buttons button {
		background: none;
		border: none;
		color: #fff; /* White color for icons */
		cursor: pointer;
		padding: 5px;
		font-size: 20px;
	}

	.edit-buttons button:hover {
		color: #007bff; /* Highlight color on hover */
	}
	.aug-button {
		cursor: pointer;
		aspect-ratio: 1/1;
		--aug-border-all: 1px;
		--aug-border-bg: var(--yellow);
		--aug-all-width: max(45px, 2vw);
		--aug-inlay-bg: var(--pink);
		transition: transform var(--easing);
		opacity: 1;
	}
	.aug-button:hover,
	.aug-button:focus {
		color: white;
		--aug-border-bg: var(--pink);
	}
	.aug-button:hover i,
	.aug-button:focus i {
		font-size: 1.25rem;
	}

	@media (max-width: 500px) {
		.aug-button {
			padding: 0.85rem;
			width: min-content;
		}
	}
</style>

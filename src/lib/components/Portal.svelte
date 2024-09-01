<script>
	import Dialog from './Dialog.svelte';
	import DiceThemePicker from './DiceThemePicker.svelte';
	import { io } from 'socket.io-client';
	import DiceRoller from './DiceRoller.svelte';
	import SessionManager from './SessionManager.svelte';
	import Toolbar from './Toolbar.svelte';
	import { getNotificationsContext } from 'svelte-notifications';
	import Token from './Token.svelte';
	const { addNotification } = getNotificationsContext();

	const defaultAlertDisplayTime = 2000;

	/** @type {import("./types.js").PortalConfig} */
	export let config = {		
	}

	/**
	 * @type {null|string}
	 */
	export let sessionName;
	/**
	 * @type {null|string}
	 */
	export let sessionId;
	/**
	 * @type {null|string}
	 */
	export let sessionMode;

	/** @type {import("./types.js").Player} */
	export let player;

	/**
	 * @type {DC.PortalToken[]}
	 */
	export let extraTokens = [];

	export let inSession = false;

	//'http://localhost:1337'
	const socketHost = new URL(config.hubUrl).origin;
	const socketPath = new URL(config.hubUrl).pathname;
	console.log('Portal Hub', socketHost, socketPath);
	const socket = io(socketHost, {
		path: socketPath
	});

	/**
	 * @type {DiceRoller}
	 */
	let diceRoller;
	let diceNotation = '1d20';
	let isRolling = false;

	let showPlayerSettings = false;
	let showPlayerList = false;
	/**
	 * @type {any[]}
	 */
	let players = [];

	function addToken() {
		console.log(extraTokens.filter((item) => item.y == 50));

		/**
		 * @type {DC.PortalToken}
		 */
		const newToken = {
			id: '-1',
			name: 'New Token',
			type: 'icon',
			x: 50 * (extraTokens.filter((item) => item.y == 50).length + 1),
			y: 50,
			src: 'bi bi-plugin'
		};
		socket.emit('addToken', { sessionId, token: newToken });
	}
	function handleCreateSession(event) {
		const sessionData = event.detail;
		socket.emit('createSession', sessionData);
		players = [player];
	}

	function handleJoinSession(event) {
		const sessionData = event.detail;
		socket.emit('joinSession', sessionData);
		players.push(player);
	}

	function leaveSession() {
		socket.emit('leaveSession', { sessionId, player });
		inSession = false;
		sessionId = null;
		players = [];
	}

	function endSession() {
		socket.emit('endSession', { sessionId });
	}

	function copySessionUrl() {
		const sessionUrl = `${window.location.href.split('?')[0]}?mode=join&session=${sessionId}`;
		navigator.clipboard.writeText(sessionUrl).then(
			() => {
				addNotification({
					id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
					position: 'top-right',
					removeAfter: defaultAlertDisplayTime * 10,
					allowRemove: true,
					heading: 'Copied to clipboard!',
					type: 'success',
					text: `Send this URL to the player(s) you would like to invite: ${sessionUrl}`
				});
			},
			(err) => {
				addNotification({
					id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
					position: 'top-right',
					removeAfter: defaultAlertDisplayTime,
					allowRemove: true,
					heading: 'Failed to copy to clipboard!',
					type: 'success',
					text: 'Failed to copy the URL. Please try again.'
				});
			}
		);
	}

	function rollDice() {
		isRolling = true;
		let expression = diceNotation;
		//TODO: move this to server
		if (expression === 'lucid' || expression === 'surreal') {
			expression = '2d20';
		}
		socket.emit('requestDiceRoll', {
			sessionId,
			diceExpression: expression,
			playerName: player.name,
			diceTheme: player.diceThemeConfig,
			diceId: player.diceId
		});
	}

	socket.on('connect', () => {
		console.log('Connected to the server');
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from the server');
	});

	socket.on('tokenAdded', (data) => {
		console.log('Token Added', data);
		extraTokens = [...extraTokens, data.token];
	});
	socket.on('tokenRemoved', (data) => {
		console.log('Token Removed', data);
		extraTokens = [...extraTokens.filter((t) => t.id != data.tokenId)];
	});
	socket.on('diceRollResult', async (data) => {
		const { result, playerName, diceTheme, diceId } = data;
		isRolling = true;
		const output = await diceRoller.roll(result, diceTheme, diceId);
		let value = output.total;

		//TODO: ensure socket returns an indicator for special roles
		if (diceNotation === 'lucid') {
			// @ts-ignore
			value = Math.max(...output.sets.flatMap((s) => s.rolls).map((r) => r.value));
		} else if (diceNotation === 'surreal') {
			// @ts-ignore
			value = Math.min(...output.sets.flatMap((s) => s.rolls).map((r) => r.value));
		} else {
		}
		console.log('Dice Rolled', value, output, result, diceTheme, diceId);
		addNotification({
			id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
			position: 'top-right',
			removeAfter: defaultAlertDisplayTime,
			allowRemove: true,
			heading: 'Dice Rolled',
			type: 'success',
			text: `${playerName} rolled ${value}`
		});
		isRolling = false;
	});

	socket.on('sessionCreated', (data) => {
		sessionId = data.sessionId;
		sessionName = data.session.name;
		inSession = true;
		players = [...data.session.players];
		player = { ...player, ...data.player };
		extraTokens = [];
	});

	socket.on('sessionEnded', (data) => {
		console.log('Session ended', data);
		sessionId = null;
		sessionName = null;
		inSession = false;
	});

	socket.on('sessionJoined', (data) => {
		console.log('You have joined the session', data);
		sessionId = data.sessionId;
		sessionName = data.session.name;
		inSession = true;
		players = [...data.session.players];
		player = { ...player, ...data.player };
		extraTokens = [...data.session.tokens];
	});

	socket.on('playerJoined', (data) => {
		console.log('Player joined', data);
		players = [...data.players];
		extraTokens = [...data.tokens];
	});

	socket.on('playerLeft', (data) => {
		console.log('Player left', data);
		players = [...data.players];
		extraTokens = [...data.tokens];
	});

	socket.on('disconnect', (reason, details) => {
		if (details.context.type === 'close') {
			console.error('Connection closed', reason, details);
		}
	});
	socket.on('error', (error) => {
		console.error('Error:', error.message);
		addNotification({
			id: `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`,
			position: 'top-right',
			removeAfter: defaultAlertDisplayTime,
			allowRemove: true,
			heading: 'Error',
			type: 'error',
			text: error.message
		});
	});

	let backgroundUrl = '/assets/dc-banner-yellow.png';
	let isFileBackground = false;
	let isVideoBackground = false;
	let showSceneSettings = false;
	/**
	 * @type {HTMLInputElement}
	 */
	let backgroundFileInput;
	let newBackgroundDataUrl = '';
	let newBackgroundUrl = '';
	function handleFileChange(event) {
		const file = event.target.files[0];
		if (file && file.size <= 50 * 1024 * 1024) {
			isVideoBackground = file.type.startsWith('video/');
			const reader = new FileReader();
			reader.onload = function (e) {
				newBackgroundDataUrl = e.target?.result;
				isFileBackground = true;
				//socket.emit('changeBackground', { sessionId, backgroundUrl });
			};
			reader.onerror = function (error) {
				alert('Failed to load the file. Please try a different file.');
			};
			reader.readAsDataURL(file);
		} else {
			alert('File size exceeds 50MB or invalid file type.');
		}
	}
	function changeBackground() {
		showSceneSettings = false;
		if (isFileBackground) backgroundUrl = newBackgroundDataUrl;
		else backgroundUrl = newBackgroundUrl;

		socket.emit('changeBackground', { sessionId, backgroundUrl });

		newBackgroundDataUrl = '';
		newBackgroundUrl = '';
		showSceneSettings = false;
		isFileBackground = false;
		backgroundFileInput.value = '';
	}
	socket.on('backgroundChanged', (data) => {
		backgroundUrl = data.backgroundUrl;
		isVideoBackground = data.backgroundUrl.startsWith('data:video/');
	});
</script>

<div class="portal-container">
	{#if !inSession}
		<SessionManager
			bind:player
			bind:mode={sessionMode}
			bind:sessionId
			bind:portalHubUrl={config.hubUrl}
			allowHubSwitching={config.allowHubSwitching}
			{sessionName}
			on:createSession={handleCreateSession}
			on:joinSession={handleJoinSession}
		/>
	{:else if inSession}
		<Dialog bind:show={showPlayerSettings} title="Settings">
			<div>
				<DiceThemePicker bind:theme={player.diceThemeConfig} />
			</div>
		</Dialog>
		<Dialog bind:show={showPlayerList} title="Players">
			<div>
				<ul>
					{#each players as p}
						<li data-player-id={p.id}>
							{p.name}
							{#if p.host}
								(Host)
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</Dialog>
		<Dialog bind:show={showSceneSettings} title="Scene Settings">
			<div class="scene-settings-container">
				<p>Select a new background image.</p>
				<input
					bind:this={backgroundFileInput}
					type="file"
					accept="image/*,video/*"
					on:click|stopPropagation
					on:change={handleFileChange}
				/>
				Or enter a URL to a image.
				<input bind:value={newBackgroundUrl} type="text" placeholder="https://..." />
			</div>
			<div slot="footer">
				<div class="edit-buttons">
					<button
						title="Cancel"
						on:click={() => {
							newBackgroundDataUrl = '';
							newBackgroundUrl = '';
							showSceneSettings = false;
							isFileBackground = false;
							backgroundFileInput.value = '';
						}}
					>
						<i class="bi bi-x-circle"></i>
					</button>
					<button title="Save" on:click={changeBackground}
						><i class="bi bi-check-circle"></i></button
					>
				</div>
			</div>
		</Dialog>
		<Toolbar
			{players}
			{player}
			diceOptions={config.diceOptions}
			bind:diceNotation
			bind:showPlayerList
			bind:showPlayerSettings
			bind:showSceneSettings
			{addToken}
			{rollDice}
			{leaveSession}
			{copySessionUrl}
			{endSession}
		/>
		<div class="background-container">
			{#if isVideoBackground}
				<video autoplay muted loop class="background-media">
					<source src={backgroundUrl} type="video/mp4" />
					Your browser does not support the video tag.
				</video>
			{:else}
				<img src={backgroundUrl} alt="Background" class="background-media" />
			{/if}
		</div>
		<div class="token-container">
			{#each extraTokens as t (t.id)}
				<Token {socket} {sessionId} token={t} enable={player.host || player.id === t.id} />
			{/each}
		</div>
		<div id="dice-container" class="background-container" class:rolling={isRolling}>
			<DiceRoller bind:this={diceRoller} />
		</div>
	{/if}
</div>

<style>
	.edit-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
	}
	.portal-container {
		--dc-dialog-backdrop-color: transparent;
		width: 60ch;
	}
	.scene-settings-container {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
	.background-container {
		position: fixed;
		top: 50px;
		left: 0;
		display: grid;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: calc(100% - 50px);
		overflow: hidden;
		z-index: -1;
	}
	.background-media {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	#dice-container {
		opacity: 0;
		z-index: 0;
		pointer-events: none;
		transition: all 2s ease;
		transition-delay: 1s;
	}
	#dice-container.rolling {
		z-index: 10;
		opacity: 1;
		transition: all 200ms ease;
		transition-delay: 0ms;
	}
	@media (max-width: 768px) {
		.portal-container {
			width: 80dvw;
		}
	}
</style>

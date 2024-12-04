<script>
	import Dialog from './Dialog.svelte';
	import SessionManager from './SessionManager.svelte';

	import {
		host,
		inSession,
		players,
		showPlayerList,
		sessionId,
		sessionName,
		showSessionDetails,
		sessionPassword
	} from './PortalStore';
	import Editor from './editor/Editor.svelte';
	import { isHost } from './PortalStore.js';
	import './theme.css';
	let { config, player } = $props();
</script>

<div class="portal-container" class:in-session={$inSession} class:host={$isHost}>
	{#if $inSession == false}
		<SessionManager activeSession={config?.activeSession} />
	{:else if $inSession}
		<Dialog bind:show={$showPlayerList}>
			<div>
				<h4>Players in Session</h4>
				<ul>
					<li>{$host.name} (Dream Master)</li>
					{#each $players as p}
						<li>
							{p.name}
						</li>
					{/each}
				</ul>
			</div>
		</Dialog>
		<Dialog bind:show={$showSessionDetails}>
			<div>
				<h2>{$sessionName}</h2>
				<p>
					ID: {$sessionId}
				</p>
				<p>
					Password: {$sessionPassword ?? '***********'}
				</p>
			</div>
		</Dialog>
		<Editor backgroundImageUrl={config.backgroundImageUrl} />
	{/if}
</div>

<style>
	.portal-container {
		--dc-dialog-backdrop-color: transparent;
	}
	.portal-container.in-session {
		width: 100%;
		height: 100dvh;
	}
</style>

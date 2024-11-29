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
	import Editor from './sv-draw/Editor.svelte';

	let { config } = $props();
</script>

<div class="portal-container" class:in-session={$inSession}>
	{#if $inSession == false}
		<SessionManager portalId={config.portalId} />
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

	/* @media (max-width: 768px) {
		.portal-container {
			width: 80dvw;
		}
	} */
</style>

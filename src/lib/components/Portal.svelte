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
</script>

<div class="portal-container">
	{#if $inSession == false}
		<SessionManager />
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
		<div class="token-container">
			<Editor />
		</div>
	{/if}
</div>

<style>
	.portal-container {
		--dc-dialog-backdrop-color: transparent;
	}

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

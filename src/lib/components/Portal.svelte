<script>
	import Dialog from './Dialog.svelte';
	import SessionManager from './SessionManager.svelte';
	import { portal } from "$lib/models/PortalState.svelte.js";
	import Editor from './editor/Editor.svelte';
	import './theme.css';
	import { init } from '$lib/models/Session.svelte.js';
	$effect(()=>{
		init();
	});
</script>

<div class="portal-container" class:in-session={portal.session.mode == 'active'} class:host={portal.player?.isHost}>
	{#if portal.session.mode  != 'active'}
		<SessionManager />
	{:else}
		<Dialog bind:show={portal.ui.showPlayerList}>
			<div>
				<h4>Players in Session</h4>
				<ul>
					<li>{portal.session.host.name} (Dream Master)</li>
					{#each portal.session.players as p}
						<li>
							{p.name}
						</li>
					{/each}
				</ul>
			</div>
		</Dialog>
		<Dialog bind:show={portal.ui.showSessionDetails}>
			<div>
				<h2>{portal.session.name}</h2>
				<p>
					ID: {portal.session.id}
				</p>
				<p>
					Password: {portal.session.password ?? '***********'}
				</p>
			</div>
		</Dialog>
		<Editor backgroundImageUrl={portal.config.defaultScene.backgroundImageUrl} />
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

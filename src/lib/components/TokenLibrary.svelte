<script>
	import Dialog from './Dialog.svelte';
	import { ImageComponent, Mat33 } from 'js-draw';

	let { show = $bindable(false), editor, onClose = () => {} } = $props();

	// Token library data
	let tokenData = $state(null);
	let loading = $state(true);
	let error = $state(null);

	// UI state
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let viewMode = $state('grid'); // 'grid' or 'list'
	let selectedToken = $state(null);

	// Load token data
	async function loadTokens() {
		try {
			loading = true;
			error = null;
			const response = await fetch('/assets/tokens/tokens.json');
			if (!response.ok) {
				throw new Error('Failed to load tokens');
			}
			tokenData = await response.json();
		} catch (err) {
			error = err.message;
			console.error('Failed to load tokens:', err);
		} finally {
			loading = false;
		}
	}

	// Load tokens on mount
	$effect(() => {
		if (show && !tokenData) {
			loadTokens();
		}
	});

	// Filter tokens based on search and category
	function filteredTokens() {
		if (!tokenData?.tokens) return [];

		let filtered = tokenData.tokens;

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(token => token.category === selectedCategory);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(token =>
				token.name.toLowerCase().includes(query) ||
				token.description?.toLowerCase().includes(query) ||
				token.tags?.some(tag => tag.toLowerCase().includes(query))
			);
		}

		return filtered;
	}

	// Add token to canvas
	async function addToken(token) {
		if (!editor) {
			console.warn('No editor available');
			return;
		}

		try {
			// Construct image URL
			const imageUrl = `/assets/tokens/${token.filename}`;

			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.src = imageUrl;

			// Wait for image to load
			await new Promise((resolve, reject) => {
				image.onload = resolve;
				image.onerror = () => reject(new Error(`Failed to load token: ${token.name}`));
			});

			// Create image component
			const comp = await ImageComponent.fromImage(image, Mat33.identity);
			comp.attachLoadSaveData('token-id', [token.id]);
			comp.attachLoadSaveData('token-name', [token.name]);
			comp.attachLoadSaveData('token-size', [token.size]);

			// Add to editor
			await editor.addAndCenterComponents([comp], true, `Added ${token.name}`);

			console.log('Token added:', token.name);
			onClose();
		} catch (err) {
			console.error('Failed to add token:', err);
			alert(`Failed to add token: ${err.message}`);
		}
	}

	// Handle token click
	function handleTokenClick(token) {
		selectedToken = token;
		addToken(token);
	}

	// Get token image URL
	function getTokenImageUrl(token) {
		return token.isPlaceholder
			? `/assets/missing-image.png`
			: `/assets/tokens/${token.filename}`;
	}

	// Get size badge color
	function getSizeBadgeColor(size) {
		switch (size) {
			case 'tiny': return 'var(--color-info)';
			case 'small': return 'var(--color-success)';
			case 'medium': return 'var(--color-accent-one)';
			case 'large': return 'var(--color-warning)';
			case 'huge': return 'var(--color-error)';
			case 'gargantuan': return 'var(--color-error)';
			default: return 'var(--color-text-secondary)';
		}
	}

	function handleDialogClose() {
		show = false;
		onClose();
	}
</script>

<Dialog {show} title="Token Library" on:close={handleDialogClose}>
	<div class="token-library">
		<!-- Controls -->
		<div class="controls">
			<!-- Search -->
			<div class="search-box">
				<i class="bi bi-search"></i>
				<input
					type="text"
					placeholder="Search tokens..."
					bind:value={searchQuery}
				/>
			</div>

			<!-- Category Filter -->
			<div class="category-filter">
				<select bind:value={selectedCategory}>
					<option value="all">All Categories</option>
					{#if tokenData?.categories}
						{#each tokenData.categories as category}
							<option value={category.id}>
								{category.icon} {category.name}
							</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- View Mode Toggle -->
			<div class="view-toggle">
				<button
					class="view-btn"
					class:active={viewMode === 'grid'}
					onclick={() => viewMode = 'grid'}
					title="Grid View"
				>
					<i class="bi bi-grid-3x3"></i>
				</button>
				<button
					class="view-btn"
					class:active={viewMode === 'list'}
					onclick={() => viewMode = 'list'}
					title="List View"
				>
					<i class="bi bi-list-ul"></i>
				</button>
			</div>
		</div>

		<!-- Token Grid/List -->
		<div class="token-container" class:grid-view={viewMode === 'grid'} class:list-view={viewMode === 'list'}>
			{#if loading}
				<div class="loading-state">
					<i class="bi bi-hourglass-split"></i>
					<p>Loading tokens...</p>
				</div>
			{:else if error}
				<div class="error-state">
					<i class="bi bi-exclamation-triangle"></i>
					<p>Error: {error}</p>
					<button onclick={loadTokens}>Retry</button>
				</div>
			{:else if filteredTokens().length === 0}
				<div class="empty-state">
					<i class="bi bi-inbox"></i>
					<p>No tokens found</p>
					{#if searchQuery || selectedCategory !== 'all'}
						<button onclick={() => { searchQuery = ''; selectedCategory = 'all'; }}>
							Clear Filters
						</button>
					{/if}
				</div>
			{:else}
				{#each filteredTokens() as token (token.id)}
					<div
						class="token-card"
						class:placeholder={token.isPlaceholder}
						onclick={() => handleTokenClick(token)}
						role="button"
						tabindex="0"
						onkeypress={(e) => e.key === 'Enter' && handleTokenClick(token)}
					>
						<div class="token-image">
							<img src={getTokenImageUrl(token)} alt={token.name} loading="lazy" />
							<span class="size-badge" style="background-color: {getSizeBadgeColor(token.size)}">
								{token.size}
							</span>
						</div>
						<div class="token-info">
							<h4>{token.name}</h4>
							{#if viewMode === 'list'}
								<p class="token-description">{token.description || 'No description'}</p>
								<div class="token-tags">
									{#each (token.tags || []) as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Token count -->
		<div class="footer-info">
			Showing {filteredTokens().length} of {tokenData?.metadata?.totalTokens || 0} tokens
		</div>
	</div>
</Dialog>

<style>
	.token-library {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 70vh;
		max-height: 800px;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.search-box {
		flex: 1;
		min-width: 200px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-secondary);
		border-radius: var(--border-radius);
	}

	.search-box i {
		color: var(--color-text-secondary);
	}

	.search-box input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--color-text);
		outline: none;
	}

	.category-filter select {
		padding: 0.5rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-secondary);
		border-radius: var(--border-radius);
		cursor: pointer;
	}

	.view-toggle {
		display: flex;
		gap: 0.25rem;
	}

	.view-btn {
		padding: 0.5rem 0.75rem;
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-secondary);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: all 0.2s;
	}

	.view-btn:hover {
		background-color: var(--color-primary);
	}

	.view-btn.active {
		background-color: var(--color-accent-two);
		color: var(--color-accent-one);
	}

	.token-container {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.token-container.grid-view {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.token-container.list-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.token-card {
		background-color: var(--color-bg-secondary);
		border: 2px solid var(--color-secondary);
		border-radius: var(--border-radius);
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.grid-view .token-card {
		aspect-ratio: 1;
	}

	.list-view .token-card {
		flex-direction: row;
		gap: 1rem;
		aspect-ratio: unset;
	}

	.token-card:hover {
		border-color: var(--color-accent-two);
		transform: translateY(-2px);
		box-shadow: var(--shadow-accent-two);
	}

	.token-card.placeholder {
		opacity: 0.6;
	}

	.token-image {
		position: relative;
		flex-shrink: 0;
	}

	.grid-view .token-image {
		width: 100%;
		aspect-ratio: 1;
	}

	.list-view .token-image {
		width: 100px;
		height: 100px;
	}

	.token-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--border-radius);
	}

	.size-badge {
		position: absolute;
		bottom: 4px;
		right: 4px;
		padding: 0.15rem 0.4rem;
		font-size: 0.7rem;
		font-weight: bold;
		color: white;
		border-radius: var(--border-radius);
		text-transform: uppercase;
	}

	.token-info {
		flex: 1;
	}

	.token-info h4 {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.list-view .token-info h4 {
		font-size: 1.1rem;
		white-space: normal;
	}

	.token-description {
		margin: 0.25rem 0;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.token-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	.tag {
		padding: 0.15rem 0.4rem;
		font-size: 0.7rem;
		background-color: var(--color-primary);
		color: var(--color-text);
		border-radius: var(--border-radius);
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: var(--color-text-secondary);
	}

	.loading-state i,
	.error-state i,
	.empty-state i {
		font-size: 3rem;
	}

	.footer-info {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		border-top: 1px solid var(--color-secondary);
	}

	@media (max-width: 768px) {
		.controls {
			flex-direction: column;
		}

		.search-box {
			width: 100%;
		}

		.token-container.grid-view {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}
	}
</style>

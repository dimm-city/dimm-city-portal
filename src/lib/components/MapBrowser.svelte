<script>
	import { onMount } from 'svelte';

	let { onClose, onSelectMap } = $props();

	let maps = $state([]);
	let categories = $state([]);
	let loading = $state(true);
	let error = $state(null);

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let viewMode = $state('grid'); // 'grid' or 'list'
	let selectedMap = $state(null);
	let showPreview = $state(false);

	// Load maps data
	onMount(async () => {
		try {
			const response = await fetch('/assets/maps/maps.json');
			if (!response.ok) throw new Error('Failed to load maps');

			const data = await response.json();
			maps = data.maps || [];
			categories = data.categories || [];
			loading = false;
		} catch (err) {
			console.error('Error loading maps:', err);
			error = err.message;
			loading = false;
		}
	});

	// Filtered maps based on search and category
	let filteredMaps = $derived(() => {
		let result = maps;

		// Filter by category
		if (selectedCategory !== 'all') {
			result = result.filter(map => map.category === selectedCategory);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(map =>
				map.name.toLowerCase().includes(query) ||
				map.description?.toLowerCase().includes(query) ||
				map.tags?.some(tag => tag.toLowerCase().includes(query))
			);
		}

		return result;
	});

	function handleSelectMap(map) {
		if (map.isPlaceholder) {
			showPreview = true;
			selectedMap = map;
		} else {
			if (onSelectMap) {
				onSelectMap({
					id: map.id,
					name: map.name,
					url: `/assets/maps/${map.filename}`,
					gridSize: map.gridSize,
					gridUnits: map.gridUnits,
					resolution: map.resolution
				});
			}
			if (onClose) onClose();
		}
	}

	function handleClosePreview() {
		showPreview = false;
		selectedMap = null;
	}
</script>

<div class="map-browser-overlay">
	<div class="map-browser-modal">
		<div class="map-browser-header">
			<h2>Battle Maps Library</h2>
			<button
				class="close-btn"
				onclick={onClose}
				aria-label="Close map browser"
				title="Close"
			>
				<i class="bi bi-x-lg"></i>
			</button>
		</div>

		<div class="map-browser-content">
			{#if loading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading maps...</p>
				</div>
			{:else if error}
				<div class="error-state">
					<i class="bi bi-exclamation-triangle"></i>
					<p>Error loading maps: {error}</p>
					<button onclick={() => window.location.reload()}>Retry</button>
				</div>
			{:else}
				<!-- Toolbar -->
				<div class="toolbar">
					<div class="search-box">
						<i class="bi bi-search"></i>
						<input
							type="text"
							placeholder="Search maps by name, description, or tags..."
							bind:value={searchQuery}
						/>
					</div>

					<div class="toolbar-controls">
						<select bind:value={selectedCategory} class="category-select">
							<option value="all">All Categories</option>
							{#each categories as category}
								<option value={category.id}>
									{category.icon} {category.name}
								</option>
							{/each}
						</select>

						<div class="view-toggle">
							<button
								class:active={viewMode === 'grid'}
								onclick={() => (viewMode = 'grid')}
								title="Grid view"
								aria-label="Grid view"
							>
								<i class="bi bi-grid-3x3-gap"></i>
							</button>
							<button
								class:active={viewMode === 'list'}
								onclick={() => (viewMode = 'list')}
								title="List view"
								aria-label="List view"
							>
								<i class="bi bi-list-ul"></i>
							</button>
						</div>
					</div>
				</div>

				<!-- Maps Grid/List -->
				<div class="maps-container" class:grid-view={viewMode === 'grid'} class:list-view={viewMode === 'list'}>
					{#if filteredMaps().length === 0}
						<div class="empty-state">
							<i class="bi bi-map"></i>
							<p>No maps found matching your criteria</p>
							{#if searchQuery || selectedCategory !== 'all'}
								<button onclick={() => {searchQuery = ''; selectedCategory = 'all';}}>
									Clear Filters
								</button>
							{/if}
						</div>
					{:else}
						{#each filteredMaps() as map}
							<div class="map-card" onclick={() => handleSelectMap(map)}>
								<div class="map-thumbnail">
									{#if map.isPlaceholder}
										<div class="placeholder-thumbnail">
											<i class="bi bi-image"></i>
											<span>Placeholder</span>
										</div>
									{:else}
										<img
											src="/assets/maps/{map.thumbnail || map.filename}"
											alt={map.name}
											loading="lazy"
										/>
									{/if}
									{#if map.isPlaceholder}
										<div class="placeholder-badge">
											<i class="bi bi-info-circle"></i> Add Image
										</div>
									{/if}
								</div>

								<div class="map-info">
									<h3 class="map-name">{map.name}</h3>
									{#if viewMode === 'list'}
										<p class="map-description">{map.description}</p>
									{/if}
									<div class="map-meta">
										<span class="meta-item">
											<i class="bi bi-grid"></i>
											{map.gridSize}x{map.gridSize}
										</span>
										<span class="meta-item">
											<i class="bi bi-rulers"></i>
											{map.gridUnits}
										</span>
										{#if map.tags && map.tags.length > 0}
											<span class="meta-item tags">
												{#each map.tags.slice(0, 3) as tag}
													<span class="tag">{tag}</span>
												{/each}
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Results count -->
				<div class="results-footer">
					<span>
						{filteredMaps().length} map{filteredMaps().length !== 1 ? 's' : ''} found
						{#if maps.filter(m => m.isPlaceholder).length > 0}
							<span class="placeholder-notice">
								({maps.filter(m => m.isPlaceholder).length} placeholder{maps.filter(m => m.isPlaceholder).length !== 1 ? 's' : ''})
							</span>
						{/if}
					</span>
				</div>
			{/if}
		</div>
	</div>

	{#if showPreview && selectedMap}
		<div class="map-preview-overlay" onclick={handleClosePreview}>
			<div class="map-preview-modal" onclick={(e) => e.stopPropagation()}>
				<div class="preview-header">
					<h3>{selectedMap.name}</h3>
					<button onclick={handleClosePreview} aria-label="Close preview">
						<i class="bi bi-x-lg"></i>
					</button>
				</div>

				<div class="preview-content">
					<div class="placeholder-message">
						<i class="bi bi-image"></i>
						<h4>Placeholder Map</h4>
						<p>{selectedMap.description}</p>
						<div class="placeholder-details">
							<strong>To use this map:</strong>
							<ol>
								<li>Find or create a battle map image ({selectedMap.gridSize}x{selectedMap.gridSize} grid recommended)</li>
								<li>Save it as: <code>/static/assets/maps/{selectedMap.filename}</code></li>
								<li>Update <code>/static/assets/maps/maps.json</code></li>
								<li>Set <code>"isPlaceholder": false</code> for this map</li>
							</ol>
							<p class="help-text">
								See <code>static/assets/maps/maps.json</code> for detailed instructions.
							</p>
						</div>
					</div>
				</div>

				<div class="preview-footer">
					<button onclick={handleClosePreview}>Close</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.map-browser-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10001;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.map-browser-modal {
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-one);
		border-radius: var(--border-radius);
		max-width: 1200px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.map-browser-header {
		background-color: var(--color-accent-one);
		color: var(--color-bg-primary);
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid var(--color-accent-two);
	}

	.map-browser-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--color-bg-primary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		opacity: 0.8;
		transition: opacity 0.2s;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.map-browser-content {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: var(--color-primary-text);
	}

	.loading-state i,
	.error-state i,
	.empty-state i {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: var(--color-accent-two);
	}

	.spinner {
		border: 4px solid var(--color-bg-secondary);
		border-top: 4px solid var(--color-accent-one);
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-box i {
		position: absolute;
		left: 1rem;
		color: var(--color-primary-text);
		opacity: 0.5;
	}

	.search-box input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		background: var(--color-bg-secondary);
		color: var(--color-primary-text);
		font-size: 0.95rem;
	}

	.toolbar-controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.category-select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		background: var(--color-bg-secondary);
		color: var(--color-primary-text);
		font-size: 0.95rem;
		cursor: pointer;
	}

	.view-toggle {
		display: flex;
		gap: 0.25rem;
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		overflow: hidden;
	}

	.view-toggle button {
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary);
		border: none;
		color: var(--color-primary-text);
		cursor: pointer;
		transition: all 0.2s;
	}

	.view-toggle button.active {
		background: var(--color-accent-one);
		color: var(--color-bg-primary);
	}

	.maps-container {
		min-height: 300px;
	}

	.maps-container.grid-view {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.maps-container.list-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.map-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
	}

	.map-card:hover {
		border-color: var(--color-accent-one);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.grid-view .map-card {
		display: flex;
		flex-direction: column;
	}

	.list-view .map-card {
		display: flex;
		flex-direction: row;
	}

	.map-thumbnail {
		position: relative;
		aspect-ratio: 16 / 11;
		overflow: hidden;
		background: var(--color-bg-primary);
	}

	.grid-view .map-thumbnail {
		width: 100%;
	}

	.list-view .map-thumbnail {
		width: 200px;
		flex-shrink: 0;
	}

	.map-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-thumbnail {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: repeating-linear-gradient(
			45deg,
			var(--color-bg-secondary),
			var(--color-bg-secondary) 10px,
			var(--color-bg-primary) 10px,
			var(--color-bg-primary) 20px
		);
		color: var(--color-primary-text);
		opacity: 0.5;
	}

	.placeholder-thumbnail i {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.placeholder-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-accent-two);
		color: var(--color-bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.map-info {
		padding: 1rem;
		flex: 1;
	}

	.map-name {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: var(--color-accent-two);
	}

	.map-description {
		margin: 0 0 0.75rem 0;
		font-size: 0.9rem;
		color: var(--color-primary-text);
		opacity: 0.8;
	}

	.map-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
		color: var(--color-primary-text);
		opacity: 0.7;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.meta-item.tags {
		display: flex;
		gap: 0.25rem;
	}

	.tag {
		background: var(--color-bg-primary);
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-size: 0.75rem;
	}

	.results-footer {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-accent-two);
		text-align: center;
		color: var(--color-primary-text);
		font-size: 0.9rem;
	}

	.placeholder-notice {
		color: var(--color-accent-two);
		font-style: italic;
	}

	/* Preview Modal */
	.map-preview-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10002;
		padding: 1rem;
	}

	.map-preview-modal {
		background-color: var(--color-bg-primary);
		border: 2px solid var(--color-accent-two);
		border-radius: var(--border-radius);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.preview-header {
		background-color: var(--color-bg-secondary);
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--color-accent-two);
	}

	.preview-header h3 {
		margin: 0;
		color: var(--color-accent-two);
	}

	.preview-header button {
		background: transparent;
		border: none;
		color: var(--color-primary-text);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.5rem;
	}

	.preview-content {
		padding: 2rem;
	}

	.placeholder-message {
		text-align: center;
		color: var(--color-primary-text);
	}

	.placeholder-message i {
		font-size: 3rem;
		color: var(--color-accent-two);
		margin-bottom: 1rem;
	}

	.placeholder-message h4 {
		margin: 0 0 1rem 0;
		color: var(--color-accent-one);
	}

	.placeholder-details {
		margin-top: 1.5rem;
		text-align: left;
		background: var(--color-bg-secondary);
		padding: 1.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--color-accent-two);
	}

	.placeholder-details strong {
		display: block;
		margin-bottom: 0.75rem;
		color: var(--color-accent-two);
	}

	.placeholder-details ol {
		margin: 0.75rem 0;
		padding-left: 1.5rem;
	}

	.placeholder-details li {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.placeholder-details code {
		background: var(--color-bg-primary);
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
		color: var(--color-accent-one);
		font-size: 0.9rem;
	}

	.help-text {
		margin-top: 1rem;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.preview-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--color-accent-two);
		display: flex;
		justify-content: flex-end;
	}

	.preview-footer button {
		padding: 0.75rem 2rem;
		background: var(--color-accent-one);
		color: var(--color-bg-primary);
		border: none;
		border-radius: var(--border-radius);
		cursor: pointer;
		font-weight: bold;
		transition: all 0.2s;
	}

	.preview-footer button:hover {
		background: var(--color-accent-two);
	}

	/* Mobile responsive */
	@media (max-width: 767px) {
		.map-browser-modal {
			max-height: 100vh;
			border-radius: 0;
		}

		.map-browser-header h2 {
			font-size: 1.2rem;
		}

		.toolbar {
			flex-direction: column;
		}

		.search-box {
			min-width: 100%;
		}

		.maps-container.grid-view {
			grid-template-columns: 1fr;
		}

		.list-view .map-card {
			flex-direction: column;
		}

		.list-view .map-thumbnail {
			width: 100%;
		}
	}
</style>

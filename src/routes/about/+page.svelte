<!-- <article class="glass">
    <header>
        <h1>About Dimm City Portal</h1>
    </header>
    <section>

    </section>
</article> -->
<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
<h1><small>About the</small>Dimm City Portal</h1>
<section class="glass">
    <p>This is a test</p>
</section>

<style>
	section {
		min-height: 100dvh;
		position: relative;
		background: rgba(255, 255, 255, 0.1);
	}

	small {
		display: block;
		font-size: 0.5rem;
	}
	h1 {
		text-align: center;
		margin-block: 1.5rem;
	}

	section.glass {
		width: min(90ch, 100svw);
		min-height: 50svh;
		place-self: center;
		margin-top: 1rem;
		box-shadow: var(--shadow-accent);
		display: grid;
	}
</style>

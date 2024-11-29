<script>
	
	/** @type {{theme?: DiceTheme}} */
	let { theme = $bindable({
		 foreground: '#ffffff',
		 background: '#ef1ebf',
		 material: 'glass',
		 name: "glass 01",
		 texture: "glass",
		 description: ""
	 }) } = $props();
</script>

<div>
	<label>Dice Text Color</label>
	<input type="color" bind:value={theme.foreground} style="border-color: {theme.foreground}" />
</div>
<div>
	<label>Dice Color</label>
	<input type="color" bind:value={theme.background} style="background-color: {theme.background}" />
</div>

<style>
	div {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1em;
	}
	label {
		text-wrap: nowrap;
	}
	input {
		width: 5rem;
	}
</style>

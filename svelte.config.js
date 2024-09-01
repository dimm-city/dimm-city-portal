import adapter from '@sveltejs/adapter-auto';
import azure from 'svelte-adapter-azure-swa';

let buildAdapter = adapter;

if (process.env.GITHUB_ACTIONS == 'true') {
  buildAdapter = azure;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: buildAdapter()
	}
};

export default config;

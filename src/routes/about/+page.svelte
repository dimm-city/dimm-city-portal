
<svelte:head>
	<title>Dimm City Portal</title>
</svelte:head>
<h1><small>About the</small>Dimm City Portal</h1>
<section class="glass">
	<p>
		Welcome to the <strong>Dimm City Portal</strong>, an innovative, open-source platform designed for
		enthusiasts and players of tabletop roleplaying games (TTRPGs). The portal makes
        it easy to play your favorite TTRPG adventures directly in your web browser—no
		complicated setups or subscriptions required.
	</p>

	<h3>Check out the demo</h3>
	<ul>
		<li>
			<strong>Web-Based Gameplay:</strong> Enjoy your favorite TTRPGs directly in your web browser, eliminating
			the need for additional software or installations.
		</li>
		<li>
			<strong>Seamless Multiplayer:</strong> Invite friends to join your gaming sessions with effortless
			multiplayer support for an engaging, collaborative experience.
		</li>
		<li>
			<strong>User-Friendly Interface:</strong> Navigate through an intuitive interface designed to keep
			the focus on the adventure, not the technology.
		</li>
	</ul>

	<h3>Join the Adventure</h3>
	<p>
		Dive into a new realm of TTRPG experiences with Dimm City Portal. Whether you're a seasoned
		player or new to the world of roleplaying games, our platform offers a seamless and enjoyable
		way to embark on your next adventure.
	</p>

	<h3>Get Involved</h3>
	<p>
		Dimm City Portal is an open-source project driven by a passionate community. We're always
		looking for new contributors to help improve and expand the platform. Whether you're a
		developer, designer, or simply a TTRPG enthusiast with ideas, we'd love to hear from you!
	</p>
	<h3>Meet Our Contributors ✨</h3>
	<p>We are proud to showcase the amazing people who make Dimm City Portal possible:</p>
	<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
	<table>
		<tbody>
			<tr>
				<td align="center" valign="top" width="14.28%">
					<a href="https://github.com/itlackey">
						<img
							src="https://avatars.githubusercontent.com/u/6414031?v=4?s=100"
							width="100px;"
							alt="IT Lackey"
						/><br />
						<sub><b>IT Lackey</b></sub>
					</a>
					<br />
					<a
						href="https://github.com/dimm-city/dimm-city-portal/commits?author=itlackey"
						title="Code">💻</a
					>
					<a
						href="https://github.com/dimm-city/dimm-city-portal/commits?author=itlackey"
						title="Documentation">📖</a
					>
				</td>
				<td align="center" valign="top" width="14.28%">
					<a href="https://github.com/Scotto1980">
						<img
							src="https://avatars.githubusercontent.com/u/99844122?v=4?s=100"
							width="100px;"
							alt="Scotto1980"
						/><br />
						<sub><b>Scotto1980</b></sub>
					</a>
					<br />
					<a href="#design-Scotto1980" title="Design">🎨</a>
				</td>
			</tr>
		</tbody>
	</table>
	<!-- ALL-CONTRIBUTORS-LIST:END -->
	<p>
		This project follows the <a href="https://github.com/all-contributors/all-contributors"
			>all-contributors</a
		> specification. Contributions of any kind are welcome!
	</p>


	<h3>License</h3>
	<p>
		Dimm City Portal is licensed under the <a
			href="https://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1"
			target="_blank"
			rel="license noopener noreferrer"
			>Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)</a
		>. This means you are free to use, share, and adapt this work as long as you attribute the
		original authors. See the
		<a
			href="https://raw.githubusercontent.com/dimm-city/dimm-city-portal/refs/heads/main/LICENSE"
			target="_blank">LICENSE</a
		> file for details.
	</p>
</section>

<style>
	section {
		min-height: 100dvh;
        margin-inline: 1rem;
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
    h3{
        margin-block: 1rem;
    }

	section.glass {
		min-height: 50svh;
		place-self: center;
		margin-top: 1rem;
		box-shadow: var(--shadow-accent);
		display: grid;
	}
	p {
		padding-left: 0.5rem;
		padding-bottom: 1rem;
	}
    p:first-of-type{
        padding: 0;
    }
	ul{
		margin-left: 2rem;
	}
	li {
		margin-left: 1rem;
	}

    @container (max-width: 400px){
        h3{
            font-size: 0.8rem;
        }
    }
</style>

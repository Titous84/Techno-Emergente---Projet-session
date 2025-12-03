<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	const navigation = [
		{ href: '/', libelle: 'Accueil' },
		{ href: '/equipements', libelle: 'Équipements' },
		{ href: '/panoplies', libelle: 'Gestion des panoplies' },
		{ href: '/comparaison', libelle: 'Comparaison' }
	];

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Application Dofus – Gestion des équipements</title>
</svelte:head>

<div class="app-shell">
	<header>
		<h1>Application Dofus – Prototype SvelteKit</h1>
		<nav>
			<ul>
				<!-- Onglets de navigation de l'application configuré plus haut -->
				{#each navigation as lien}
					<li><a href={lien.href}>{lien.libelle}</a></li>
				{/each}
			</ul>
		</nav>
	</header>

	<main>
		{@render children?.()}
	</main>

	<footer>
		<p>
			Projet de recherche – Technologie émergente : SvelteKit. Prototype éducatif pour le cours de
			Technologie Émergente.
		</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', sans-serif;
		background: #f5f5f5;
		color: #222;
	}

	.app-shell {
		min-height: 100vh;
		display: grid;
		grid-template-rows: auto 1fr auto;
	}

	header {
		background: linear-gradient(135deg, #2a4a7b, #1b2838);
		color: white;
		padding: 1.5rem 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	header h1 {
		margin: 0 0 0.75rem;
		font-size: 1.75rem;
	}

	nav ul {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 0;
		padding: 0;
	}

	nav a {
		color: white;
		text-decoration: none;
		font-weight: 600;
		border-bottom: 2px solid transparent;
		padding-bottom: 0.25rem;
		transition: border-color 0.2s ease;
	}

	nav a:hover,
	nav a:focus {
		border-color: #f4d03f;
	}

	main {
		padding: 2rem;
	}

	footer {
		background: #1b2838;
		color: #f5f5f5;
		padding: 1rem 2rem;
		font-size: 0.9rem;
		text-align: center;
	}
</style>

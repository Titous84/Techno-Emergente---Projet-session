<script lang="ts">
	// ===============================================================
	// Objectif : afficher la liste complète des équipements avec filtres
	// (nom, type, niveau, effets) et gestion du prix personnalisé.
	// ===============================================================

	import equipements from '$lib/data/equipements.json';
	import { prixEquipements } from '$lib/stores/prix';
	import type { Equipement } from '$lib/types';
	import { effetToImageUrl } from '$lib/utils/effets';

	/**
	 * Fonction utilitaire : renvoie un libellé de type lisible
	 * même si la donnée JSON est absente ou vide.
	 */
	function libelleType(brut: string | undefined) {
		const valeur = brut?.trim();
		return valeur && valeur.length > 0 ? valeur : 'Type inconnu';
	}

	const equipementsAvecNom = equipements.filter(
		(equipement) => typeof equipement.nom === 'string' && equipement.nom.trim().length > 0
	);

	/**
	 * Génération dynamique de la liste de types disponibles.
	 * Utilisation de Set() pour éliminer les doublons automatiquement.
	 */
	const typesDisponibles = [
		'Tous',
		...new Set(equipementsAvecNom.map((equipement) => libelleType(equipement.Type)))
	];

	let recherche = '';
	let typeSelectionne = 'Tous';

	/**
	 * Calcul automatique des bornes min/max de niveaux d’équipements.
	 * Permet de construire des filtres numériques cohérents
	 * même si le jeu de données évolue.
	 */
	const bornesNiveau = equipementsAvecNom.reduce(
		(acc, equipement) => {
			return {
				min: Math.min(acc.min, equipement.niveau),
				max: Math.max(acc.max, equipement.niveau)
			};
		},
		{ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
	);

	const niveauAbsoluMin = Number.isFinite(bornesNiveau.min) ? bornesNiveau.min : 1;
	const niveauAbsoluMax = Number.isFinite(bornesNiveau.max) ? bornesNiveau.max : 200;

	let niveauMin: number = niveauAbsoluMin;
	let niveauMax: number = niveauAbsoluMax;
	let filtresEffetsTexte = '';
	let filtresEffets: string[] = [];

	function normaliserBorne(valeur: number, min: number, max: number) {
		if (Number.isNaN(valeur)) {
			return min;
		}
		return Math.min(Math.max(valeur, min), max);
	}

	/**
	 * Normalise les chaînes pour comparer de manière insensible à la casse.
	 * Un bon réflexe pour simplifier les recherches utilisateur.
	 */
	function normaliserTexte(texte: unknown) {
		return `${texte ?? ''}`.toLowerCase();
	}

	/**
	 * Vérifie si un équipement contient tous les effets demandés.
	 * ⚠️ Problème rencontré (corrigé) :
	 *   certaines recherches échouaient si l’effet contenait des majuscules
	 *   ou un accent. Solution : normalisation systématique avant comparaison.
	 */
	function effetsCorrespondent(equipement: Equipement, filtres: string[]) {
		if (filtres.length === 0) {
			return true;
		}
		const effets = equipement.effets ? Object.keys(equipement.effets) : [];
		if (effets.length === 0) {
			return false;
		}
		const effetsNormalises = effets.map((effet) => normaliserTexte(effet));
		return filtres.every((mot) => effetsNormalises.some((effet) => effet.includes(mot)));
	}

	$: niveauMin = normaliserBorne(niveauMin, niveauAbsoluMin, niveauAbsoluMax);
	$: niveauMax = normaliserBorne(niveauMax, niveauMin, niveauAbsoluMax);

	$: filtresEffets = filtresEffetsTexte
		.split(',')
		.map((mot) => normaliserTexte(mot).trim())
		.filter((mot) => mot.length > 0);

	/**
	 *  Réactivité Svelte :
	 * - Les blocs $: mettent à jour automatiquement la liste filtrée
	 *   dès qu’une variable liée (recherche, niveau, effet) change.
	 * - Approche déclarative : pas besoin d’appels manuels à “update()”.
	 */
	$: equipementsFiltres = equipementsAvecNom.filter((equipement) => {
		const typeNormalise = libelleType(equipement.Type);
		const correspondAuType =
			typeSelectionne === 'Tous' || typeNormalise === libelleType(typeSelectionne);
		const correspondRecherche = normaliserTexte(equipement.nom).includes(
			normaliserTexte(recherche)
		);
		const correspondNiveau = equipement.niveau >= niveauMin && equipement.niveau <= niveauMax;
		const correspondEffets = effetsCorrespondent(equipement, filtresEffets);
		return correspondAuType && correspondRecherche && correspondNiveau && correspondEffets;
	});

	/**
	 * Formate les valeurs numériques d’effets.
	 * Exemple : [5, 10] → "5 à 10".
	 */
	function formaterValeur(valeur: number | [number, number]) {
		if (Array.isArray(valeur)) {
			return `${valeur[0]} à ${valeur[1]}`;
		}
		return `${valeur}`;
	}

	/**
	 * Met à jour le prix personnel d’un équipement.
	 * Utilise un store Svelte pour persister la valeur localement (localStorage).
	 */
	function mettreAJourPrix(equipement: Equipement, event: Event) {
		const cible = event.currentTarget as HTMLInputElement;
		const valeur = Number(cible.value);
		prixEquipements.definirPrix(equipement.nom, valeur);
	}
</script>

<section class="outils">
	<label>
		Recherche par nom
		<input type="search" placeholder="Ex. : Cape du Sinistrofu" bind:value={recherche} />
	</label>
	<label>
		Type d'équipement
		<select bind:value={typeSelectionne}>
			{#each typesDisponibles as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
	</label>
	<label>
		Niveau minimum
		<input type="number" min={niveauAbsoluMin} max={niveauAbsoluMax} bind:value={niveauMin} />
	</label>
	<label>
		Niveau maximum
		<input type="number" min={niveauAbsoluMin} max={niveauAbsoluMax} bind:value={niveauMax} />
	</label>
	<label class="effets">
		Effets à inclure (séparés par des virgules)
		<input type="text" placeholder="Ex. : Force, Résistance Eau" bind:value={filtresEffetsTexte} />
	</label>
	<button type="button" on:click={() => prixEquipements.reinitialiser()}>
		Réinitialiser les prix
	</button>
</section>

<section class="liste">
	<h2>{equipementsFiltres.length} équipement(s) trouvé(s)</h2>
	<ul>
		{#each equipementsFiltres as equipement}
			<li>
				<header>
					{#if equipement.illustration_url}
						<img src={equipement.illustration_url} alt={equipement.nom} />
					{/if}
					<div>
						<h3>
							<a href={`/equipements/${encodeURIComponent(equipement.nom)}`}>
								{equipement.nom}
							</a>
						</h3>
						<p>Type : {libelleType(equipement.Type)} · Niveau {equipement.niveau}</p>
					</div>
				</header>
				{#if equipement.effets}
					{@const effets = equipement.effets as Record<string, number | [number, number]>}
					<details>
						<summary>Voir les effets principaux</summary>
						<ul class="effets">
							{#each Object.entries(effets) as [effet, valeur]}
								<li>
									<img
										src={effetToImageUrl(effet)}
										alt={effet}
										on:error={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
									<span><strong>{effet} :</strong> {formaterValeur(valeur)}</span>
								</li>
							{/each}
						</ul>
					</details>
				{/if}
				<div class="prix">
					<label>
						Prix personnel (kamas)
						<input
							type="number"
							min="0"
							step="1000"
							value={$prixEquipements[equipement.nom] ?? ''}
							on:input={(event) => mettreAJourPrix(equipement, event)}
						/>
					</label>
					<p class="note">Le prix est enregistré localement dans votre navigateur.</p>
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	section.outils {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		margin-bottom: 1.5rem;
	}

	section.outils label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-weight: 600;
	}

	section.outils input,
	section.outils select {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #d0d6e1;
	}

	section.outils button {
		background: #2a4a7b;
		color: white;
		border: none;
		border-radius: 999px;
		padding: 0.5rem 1.25rem;
		cursor: pointer;
	}

	section.liste ul {
		display: grid;
		gap: 1.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	section.liste li {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
	}

	section.liste header {
		display: flex;
		gap: 1rem;
	}

	section.liste img {
		width: 64px;
		height: 64px;
		object-fit: contain;
		border-radius: 0.5rem;
	}

	section.liste h3 {
		margin: 0 0 0.25rem;
	}

	section.liste a {
		color: #2a4a7b;
		text-decoration: none;
	}

	details summary {
		cursor: pointer;
		font-weight: 600;
	}

	.effets {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.35rem;
		list-style: none;
		padding: 0;
	}

	.effets li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.effets img {
		width: 28px;
		height: 28px;
	}

	.prix {
		margin-top: 1rem;
		display: grid;
		gap: 0.35rem;
	}

	.prix input {
		max-width: 200px;
	}

	.note {
		font-size: 0.85rem;
		color: #555;
	}
</style>

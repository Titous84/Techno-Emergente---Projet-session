<script lang="ts">
	import equipements from '$lib/data/equipements.json';
	import { prixEquipements } from '$lib/stores/prix';
	import { panopliesUtilisateur } from '$lib/stores/panoplies';
	import { calculerResumePanoplie, trouverEquipement } from '$lib/services/analyse-panoplies';
	import {
		EMPLACEMENTS_PANOPLIE,
		type EmplacementId,
		type Equipement,
		type PanopliePersonnalisee,
		type ResumePanoplie
	} from '$lib/types';

	// Champs contrôlés par les formulaires de la page.
	let rechercheEquipement = '';
	let panoplieSelectionneeId = '';
	let emplacementSelectionne: EmplacementId | '' = '';
	let equipementSelectionne = '';
	let panoplies: PanopliePersonnalisee[] = [];
	let panopliesAffichees: PanopliePersonnalisee[] = [];
	let registrePrix = {} as Record<string, number>;
	let panoplieSelectionnee: PanopliePersonnalisee | null = null;
	let resumePanoplie: ResumePanoplie | null = null;
	let equipementsFiltres: Equipement[] = [];

	// Préparation du jeu de données des équipements.
	const equipementsAvecNom = equipements.filter(
		(equipement) => typeof equipement.nom === 'string' && equipement.nom.trim().length > 0
	);

	// Fonction utilitaire : renvoie un libellé de type lisible
	// même si la donnée JSON est absente ou vide.
	function libelleType(brut: string | undefined) {
		const valeur = brut?.trim();
		return valeur && valeur.length > 0 ? valeur : 'Type inconnu';
	}

	// Vérifie si un équipement est compatible avec un emplacement donné.
	function obtenirDefinitionEmplacement(id: EmplacementId | '') {
		if (!id) return null;
		return EMPLACEMENTS_PANOPLIE.find((emplacement) => emplacement.id === id) ?? null;
	}

	// Filtre les équipements compatibles avec un emplacement spécifique.
	function estCompatibleAvecEmplacement(equipement: Equipement, emplacementId: EmplacementId | '') {
		const definition = obtenirDefinitionEmplacement(emplacementId);
		if (!definition || !definition.typesCompatibles || definition.typesCompatibles.length === 0) {
			return true;
		}
		const typeEquipement = libelleType(equipement.Type);
		return definition.typesCompatibles.some(
			(typeAutorise) => libelleType(typeAutorise) === typeEquipement
		);
	}

	// Synchronisation automatique avec les stores Svelte.
	function horodatage(panoplie: PanopliePersonnalisee) {
		const modifie = Date.parse(panoplie.modifieLe ?? '');
		if (!Number.isNaN(modifie)) {
			return modifie;
		}
		const cree = Date.parse(panoplie.creeLe ?? '');
		return Number.isNaN(cree) ? 0 : cree;
	}

	$: panoplies = $panopliesUtilisateur as PanopliePersonnalisee[];
	$: panopliesAffichees = [...panoplies].sort((a, b) => horodatage(b) - horodatage(a));
	$: registrePrix = $prixEquipements;
	$: panoplieSelectionnee = panoplies.find((p) => p.id === panoplieSelectionneeId) ?? null;
	$: if (!emplacementSelectionne && EMPLACEMENTS_PANOPLIE.length > 0) {
		emplacementSelectionne = EMPLACEMENTS_PANOPLIE[0].id;
	}
	$: resumePanoplie = panoplieSelectionnee
		? calculerResumePanoplie(panoplieSelectionnee, registrePrix)
		: null;

	// Normalise le texte pour comparaison insensible à la casse.
	function normaliserTexte(texte: unknown) {
		return `${texte ?? ''}`.toLowerCase();
	}

	$: equipementsFiltres = equipementsAvecNom
		.filter((equipement) =>
			normaliserTexte(equipement.nom).includes(normaliserTexte(rechercheEquipement.trim()))
		)
		.filter((equipement) => estCompatibleAvecEmplacement(equipement, emplacementSelectionne))
		.slice(0, 30);

	$: if (equipementSelectionne && emplacementSelectionne) {
		const equipement = equipementsAvecNom.find((item) => item.nom === equipementSelectionne);
		if (!equipement || !estCompatibleAvecEmplacement(equipement, emplacementSelectionne)) {
			equipementSelectionne = '';
		}
	}

	// Crée une panoplie vide puis la sélectionne.
	function creerPanoplieRapide() {
		const id = panopliesUtilisateur.ajouterPanoplie('Nouvelle panoplie');
		panoplieSelectionneeId = id;
	}

	// Demande confirmation avant de supprimer une panoplie.
	function supprimerPanoplie(id: string) {
		if (confirm('Supprimer cette panoplie ?')) {
			panopliesUtilisateur.supprimerPanoplie(id);
			if (panoplieSelectionneeId === id) {
				panoplieSelectionneeId = '';
			}
		}
	}

	// Duplique la panoplie existante et sélectionne la copie.
	function dupliquerPanoplie(id: string) {
		const nouveauId = panopliesUtilisateur.dupliquerPanoplie(id);
		if (nouveauId) {
			panoplieSelectionneeId = nouveauId;
		}
	}

	// Ajoute un équipement choisi dans la liste déroulante.
	function assignerEquipement(emplacement: EmplacementId, nom: string) {
		if (!panoplieSelectionneeId) {
			alert('Veuillez sélectionner une panoplie dans la liste.');
			return;
		}
		panopliesUtilisateur.definirEquipement(panoplieSelectionneeId, emplacement, nom);
	}

	// Retire l’équipement assigné à un emplacement spécifique.
	function viderEmplacement(emplacement: EmplacementId) {
		if (!panoplieSelectionneeId) return;
		panopliesUtilisateur.retirerEquipement(panoplieSelectionneeId, emplacement);
	}

	// Valide l’ajout d’un équipement sélectionné.
	function validerAssignationSelectionnee() {
		if (!panoplieSelectionneeId || !emplacementSelectionne || !equipementSelectionne) {
			alert('Veuillez choisir un emplacement et un équipement.');
			return;
		}
		assignerEquipement(emplacementSelectionne, equipementSelectionne);
		equipementSelectionne = '';
	}

	// Met à jour le nom de la panoplie en direct.
	function renommerPanoplie(event: Event) {
		if (!panoplieSelectionneeId) return;
		const cible = event.currentTarget as HTMLInputElement;
		panopliesUtilisateur.renommerPanoplie(panoplieSelectionneeId, cible.value);
	}

	// Texte court pour afficher les statistiques clés dans la liste.
	function resumeCourt(panoplie: PanopliePersonnalisee) {
		const resume = calculerResumePanoplie(panoplie, registrePrix);
		return `${resume.nombreEquipements} objet(s) · ${resume.coutTotal.toLocaleString()} kamas · niv. min ${resume.niveauMinimum}`;
	}
</script>

<section class="gestion">
	<div class="liste-panoplies">
		<h2>Mes panoplies</h2>

		<ul>
			{#if panopliesAffichees.length === 0}
				<li class="vide">Aucune panoplie enregistrée pour le moment.</li>
			{/if}
			{#each panopliesAffichees as panoplie}
				<li class:active={panoplie.id === panoplieSelectionneeId}>
					<button type="button" on:click={() => (panoplieSelectionneeId = panoplie.id)}>
						<strong>{panoplie.nom}</strong>
						<span>{resumeCourt(panoplie)}</span>
					</button>
					<div class="actions">
						<button type="button" on:click={() => dupliquerPanoplie(panoplie.id)}>
							Dupliquer
						</button>
						<button type="button" on:click={() => supprimerPanoplie(panoplie.id)}>
							Supprimer
						</button>
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<div class="details">
		<button type="button" class="action-creation" on:click={creerPanoplieRapide}>
			Créer une nouvelle panoplie
		</button>
		{#if !panoplieSelectionnee}
			<p>Sélectionnez ou créez une panoplie pour afficher les détails.</p>
		{:else}
			<h2>Détails de {panoplieSelectionnee.nom}</h2>
			<div class="meta">
				<label>
					Nom
					<input type="text" value={panoplieSelectionnee.nom} on:input={renommerPanoplie} />
				</label>
			</div>

			<section class="ajout">
				<h3>Ajouter un équipement</h3>
				<div class="controle">
					<input
						type="search"
						placeholder="Rechercher un équipement"
						bind:value={rechercheEquipement}
					/>
					<select bind:value={emplacementSelectionne}>
						{#each EMPLACEMENTS_PANOPLIE as emplacement}
							<option value={emplacement.id}>
								{emplacement.nom}
							</option>
						{/each}
					</select>
					<select bind:value={equipementSelectionne}>
						<option value="">Sélectionner</option>
						{#if equipementsFiltres.length === 0}
							<option value="" disabled> Aucun équipement compatible pour cet emplacement </option>
						{/if}
						{#each equipementsFiltres as equipement}
							<option value={equipement.nom}>{equipement.nom} (niv. {equipement.niveau})</option>
						{/each}
					</select>
					<button
						type="button"
						on:click={validerAssignationSelectionnee}
						disabled={!equipementSelectionne || !emplacementSelectionne}
					>
						Ajouter
					</button>
				</div>
			</section>

			<section class="emplacements">
				<h3>Emplacements de la panoplie</h3>
				<div class="grille-emplacements">
					{#each EMPLACEMENTS_PANOPLIE as emplacement}
						{@const nomAttribue = panoplieSelectionnee.emplacements[emplacement.id]}
						{@const equipement = nomAttribue
							? (trouverEquipement(nomAttribue) as Equipement | undefined)
							: null}
						<article class:vide={!nomAttribue} data-categorie={emplacement.categorie}>
							<header>
								<h4>{emplacement.nom}</h4>
							</header>
							{#if equipement}
								<div class="details-equipement">
									<strong>{equipement.nom}</strong>
									<span>Niveau {equipement.niveau} · {libelleType(equipement.Type)}</span>
									<div class="actions">
										<a href={`/equipements/${encodeURIComponent(equipement.nom)}`}>
											Voir la fiche
										</a>
										<button type="button" on:click={() => viderEmplacement(emplacement.id)}>
											Retirer
										</button>
									</div>
								</div>
							{:else}
								<p class="libre">Emplacement libre</p>
							{/if}
						</article>
					{/each}
				</div>
			</section>

			{#if resumePanoplie}
				<section class="resume">
					<h3>Résumé automatique</h3>
					<ul>
						<li>
							<strong>Nombre d'équipements :</strong>
							{resumePanoplie.nombreEquipements}
						</li>
						<li>
							<strong>Coût total :</strong>
							{resumePanoplie.coutTotal.toLocaleString()} kamas
						</li>
						<li>
							<strong>Niveau minimum requis :</strong>
							{resumePanoplie.niveauMinimum}
						</li>
					</ul>
					<details>
						<summary>Effets cumulés</summary>
						<table>
							<thead>
								<tr>
									<th>Effet</th>
									<th>Valeur minimale</th>
									<th>Valeur maximale</th>
								</tr>
							</thead>
							<tbody>
								{#each Object.entries(resumePanoplie.effets) as [effet, intervalle]}
									<tr>
										<td>{effet}</td>
										<td>{intervalle.min}</td>
										<td>{intervalle.max}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</details>
				</section>
			{/if}
		{/if}
	</div>
</section>

<style>
	.gestion {
		display: grid;
		grid-template-columns: minmax(280px, 360px) 1fr;
		gap: 2rem;
	}

	.liste-panoplies,
	.details {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		display: grid;
		gap: 1rem;
	}

	.liste-panoplies ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.liste-panoplies li {
		background: #f7f9fc;
		border-radius: 0.75rem;
		padding: 0.75rem;
		display: grid;
		gap: 0.5rem;
	}

	.liste-panoplies li.active {
		border: 2px solid #2a4a7b;
	}

	.liste-panoplies button {
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
	}

	.liste-panoplies .actions {
		display: flex;
		gap: 0.5rem;
	}

	.liste-panoplies .actions button {
		background: #e4eaf5;
		border: none;
		border-radius: 0.5rem;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
	}

	.liste-panoplies .vide {
		text-align: center;
		color: #666;
	}

	.details .meta {
		display: grid;
		gap: 0.75rem;
	}

	.details input,
	.controle input,
	.controle select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #d0d6e1;
	}

	.controle {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.controle button {
		background: #2a4a7b;
		color: white;
		border: none;
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	.controle button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.details .action-creation {
		background: #2a4a7b;
		color: white;
		border: none;
		border-radius: 999px;
		padding: 0.5rem 1.25rem;
		cursor: pointer;
		justify-self: start;
	}

	.emplacements {
		display: grid;
		gap: 1rem;
	}

	.grille-emplacements {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.grille-emplacements article {
		border-radius: 0.75rem;
		padding: 1rem;
		background: linear-gradient(145deg, #f7f9fc, #eef3fb);
		display: grid;
		gap: 0.5rem;
		min-height: 160px;
	}

	.grille-emplacements article header h4 {
		margin: 0;
		font-size: 1rem;
		color: #2a4a7b;
	}

	.grille-emplacements article.vide {
		opacity: 0.8;
	}

	.grille-emplacements article .details-equipement {
		display: grid;
		gap: 0.35rem;
	}

	.grille-emplacements article .details-equipement strong {
		font-size: 1rem;
	}

	.grille-emplacements article .details-equipement .actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.grille-emplacements article .details-equipement a {
		color: #2a4a7b;
		text-decoration: none;
	}

	.grille-emplacements article .details-equipement button {
		background: #e84f4f;
		color: white;
		border: none;
		border-radius: 0.5rem;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
	}

	.grille-emplacements article .libre {
		color: #6c7486;
		font-style: italic;
	}

	.resume ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.75rem;
	}

	th,
	td {
		border: 1px solid #d0d6e1;
		padding: 0.5rem;
		text-align: left;
	}

	@media (max-width: 960px) {
		.gestion {
			grid-template-columns: 1fr;
		}
	}
</style>

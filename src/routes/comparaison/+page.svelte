<script lang="ts">
        import { prixEquipements } from '$lib/stores/prix';
        import { panopliesUtilisateur } from '$lib/stores/panoplies';
        import { calculerResumePanoplie, comparerEffets } from '$lib/services/analyse-panoplies';
        import type { PanopliePersonnalisee, ResumePanoplie } from '$lib/types';

        // États locaux pour la sélection des panoplies à comparer.
        let panoplies: PanopliePersonnalisee[] = [];
        let registrePrix = {} as Record<string, number>;
        let panoplieGaucheId = '';
        let panoplieDroiteId = '';
        let selectionGauche: PanopliePersonnalisee | null = null;
        let selectionDroite: PanopliePersonnalisee | null = null;
        let resumeGauche: ResumePanoplie | null = null;
        let resumeDroite: ResumePanoplie | null = null;
        let effetsComparés: { effet: string; a: { min: number; max: number } | null; b: { min: number; max: number } | null }[] = [];

        // Mise à jour automatique lorsque les stores évoluent.
        $: panoplies = $panopliesUtilisateur as PanopliePersonnalisee[];
        $: registrePrix = $prixEquipements;
        $: selectionGauche = panoplies.find((p) => p.id === panoplieGaucheId) ?? null;
        $: selectionDroite = panoplies.find((p) => p.id === panoplieDroiteId) ?? null;
        $: resumeGauche = selectionGauche
                ? calculerResumePanoplie(selectionGauche, registrePrix)
                : null;
        $: resumeDroite = selectionDroite
                ? calculerResumePanoplie(selectionDroite, registrePrix)
                : null;
        $: effetsComparés = comparerEffets(resumeGauche, resumeDroite);

        // Affiche la différence entre deux valeurs numériques (B - A).
        function difference(a: number | null, b: number | null) {
                if (a == null || b == null) return '';
                const diff = b - a;
                if (diff === 0) return '±0';
                const signe = diff > 0 ? '+' : '';
                return `${signe}${diff.toLocaleString()}`;
        }

        // Fournit un résumé de l'écart entre deux intervalles d'effets.
        function differenceIntervalle(
                gauche: { min: number; max: number } | null,
                droite: { min: number; max: number } | null
        ) {
                if (!gauche && !droite) return '';
                if (!gauche) return `+${droite?.min} à +${droite?.max}`;
                if (!droite) return `-${gauche.min} à -${gauche.max}`;
                const diffMin = droite.min - gauche.min;
                const diffMax = droite.max - gauche.max;
                const prefixeMin = diffMin > 0 ? '+' : '';
                const prefixeMax = diffMax > 0 ? '+' : '';
                return `${prefixeMin}${diffMin} à ${prefixeMax}${diffMax}`;
        }
</script>

<section class="comparaison">
        <header>
                <div>
                        <label>
                                Panoplie A
                                <select bind:value={panoplieGaucheId}>
                                        <option value="">Sélectionner</option>
                                        {#each panoplies as panoplie}
                                                <option value={panoplie.id}>{panoplie.nom}</option>
                                        {/each}
                                </select>
                        </label>
                </div>
                <div>
                        <label>
                                Panoplie B
                                <select bind:value={panoplieDroiteId}>
                                        <option value="">Sélectionner</option>
                                        {#each panoplies as panoplie}
                                                <option value={panoplie.id}>{panoplie.nom}</option>
                                        {/each}
                                </select>
                        </label>
                </div>
        </header>

        {#if panoplies.length === 0}
                <p>
                        Aucune panoplie personnalisée n'est disponible. Rendez-vous dans la section « Gestion des panoplies » pour
                        en créer au moins une.
                </p>
        {:else if !resumeGauche || !resumeDroite}
                <p>Choisissez deux panoplies à comparer.</p>
        {:else}
                <section class="resume">
                        <h2>Résumé numérique</h2>
                        <table>
                                <thead>
                                        <tr>
                                                <th></th>
                                                <th>{selectionGauche?.nom}</th>
                                                <th>{selectionDroite?.nom}</th>
                                                <th>Différence (B - A)</th>
                                        </tr>
                                </thead>
                                <tbody>
                                        <tr>
                                                <th>Nombre d'équipements</th>
                                                <td>{resumeGauche.nombreEquipements}</td>
                                                <td>{resumeDroite.nombreEquipements}</td>
                                                <td>{difference(resumeGauche.nombreEquipements, resumeDroite.nombreEquipements)}</td>
                                        </tr>
                                        <tr>
                                                <th>Coût total (kamas)</th>
                                                <td>{resumeGauche.coutTotal.toLocaleString()}</td>
                                                <td>{resumeDroite.coutTotal.toLocaleString()}</td>
                                                <td>{difference(resumeGauche.coutTotal, resumeDroite.coutTotal)}</td>
                                        </tr>
                                        <tr>
                                                <th>Niveau minimum requis</th>
                                                <td>{resumeGauche.niveauMinimum}</td>
                                                <td>{resumeDroite.niveauMinimum}</td>
                                                <td>{difference(resumeGauche.niveauMinimum, resumeDroite.niveauMinimum)}</td>
                                        </tr>
                                </tbody>
                        </table>
                </section>

                <section class="effets">
                        <h2>Comparaison des effets cumulés</h2>
                        <table>
                                <thead>
                                        <tr>
                                                <th>Effet</th>
                                                <th>Panoplie A</th>
                                                <th>Panoplie B</th>
                                                <th>Écart</th>
                                        </tr>
                                </thead>
                                <tbody>
                                        {#each effetsComparés as ligne}
                                                <tr>
                                                        <td>{ligne.effet}</td>
                                                        <td>
                                                                {#if ligne.a}
                                                                        {ligne.a.min} à {ligne.a.max}
                                                                {:else}
                                                                        —
                                                                {/if}
                                                        </td>
                                                        <td>
                                                                {#if ligne.b}
                                                                        {ligne.b.min} à {ligne.b.max}
                                                                {:else}
                                                                        —
                                                                {/if}
                                                        </td>
                                                        <td>{differenceIntervalle(ligne.a, ligne.b)}</td>
                                                </tr>
                                        {/each}
                                </tbody>
                        </table>
                </section>
        {/if}
</section>

<style>
        .comparaison {
                display: grid;
                gap: 2rem;
        }

        header {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                background: white;
                padding: 1.5rem;
                border-radius: 1rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        label {
                display: grid;
                gap: 0.5rem;
        }

        select {
                padding: 0.5rem 0.75rem;
                border-radius: 0.5rem;
                border: 1px solid #d0d6e1;
        }

        .resume,
        .effets {
                background: white;
                padding: 1.5rem;
                border-radius: 1rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
        }

        th,
        td {
                border: 1px solid #d0d6e1;
                padding: 0.5rem;
                text-align: left;
        }

        th {
                background: #f7f9fc;
        }
</style>

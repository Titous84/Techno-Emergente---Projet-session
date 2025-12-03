<script>
        const parcours = [
                {
                        titre: '1. Identifier les besoins',
                        texte:
                                "Répertorier les statistiques importantes, le niveau requis et le coût des équipements pour construire une panoplie optimisée."
                },
                {
                        titre: '2. Explorer la technologie',
                        texte:
                                "Utiliser SvelteKit pour bâtir rapidement une application réactive avec persistance locale et composants réutilisables."
                },
                {
                        titre: '3. Construire le prototype',
                        texte:
                                "Créer des panoplies personnalisées, comparer leurs effets et consigner les prix pour estimer un budget d'équipement."
                }
        ];
</script>

<section class="hero">
        <div>
                <h2>Bienvenue sur l'outil Dofus – Gestion des panoplies</h2>
                <p>
                        Ce prototype illustre l'utilisation de <strong>SvelteKit</strong> comme technologie émergente dans le cadre
                        du projet de recherche. Naviguez dans les sections pour consulter les équipements, composer vos
                        panoplies personnalisées et comparer différents builds.
                </p>
                <div class="actions">
                        <a class="action" href="/equipements">Explorer les équipements</a>
                        <a class="action secondaire" href="/panoplies">Créer une panoplie</a>
                </div>
        </div>
        <aside>
                <h3>Démarche du rapport</h3>
                <ul>
                        {#each parcours as etape}
                                <li>
                                        <strong>{etape.titre}</strong>
                                        <p>{etape.texte}</p>
                                </li>
                        {/each}
                </ul>
        </aside>
</section>

<section class="objectifs">
        <h3>Fonctionnalités clés du prototype</h3>
        <ul>
                <li>Catalogue local d'équipements Dofus (JSON)</li>
                <li>Saisie de prix personnalisés et calcul automatique du coût total</li>
                <li>Création, duplication et gestion de panoplies enregistrées dans le navigateur</li>
                <li>Comparaison détaillée des effets et du niveau requis pour deux panoplies</li>
                <li>Interface entièrement en français et abondamment commentée pour le niveau collégial</li>
        </ul>
</section>

<style>
        .hero {
                display: grid;
                gap: 2rem;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .hero h2 {
                margin-top: 0;
        }

        .actions {
                margin-top: 1.5rem;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
        }

        .action {
                background: #2a4a7b;
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 999px;
                text-decoration: none;
                font-weight: 600;
        }

        .action.secondaire {
                background: #f4d03f;
                color: #1b2838;
        }

        aside ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: grid;
                gap: 1rem;
        }

        aside li {
                background: #f7f9fc;
                border-left: 4px solid #2a4a7b;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
        }

        .objectifs {
                margin-top: 2rem;
                background: white;
                padding: 1.5rem 2rem;
                border-radius: 1rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .objectifs ul {
                display: grid;
                gap: 0.75rem;
        }
</style>

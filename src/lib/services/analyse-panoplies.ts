/**
 * ===============================================================
 *  Projet : Dofus API — Nathan Reyes
 *  Fichier : analyse-panoplies.ts
 *
 *  Rôle :
 *  Ce module regroupe les fonctions servant à :
 *   - Retrouver les informations d’un équipement à partir de son nom
 *   - Calculer le résumé d’une panoplie personnalisée (prix total, effets cumulés, niveau)
 *   - Comparer les effets entre deux panoplies
 *
 *  ⚙️ Fonctionne avec :
 *   - Les données locales /lib/data/equipements.json
 *   - Les types définis dans /lib/types
 *   - Le registre des prix provenant du store /lib/stores/prix
 *
 * ===============================================================
 */

import equipements from '$lib/data/equipements.json';
import type {
	Equipement,
	IntervalleEffet,
	PanopliePersonnalisee,
	ResumePanoplie
} from '$lib/types';
import type { RegistrePrix } from '$lib/stores/prix';

/**
 * Recherche un équipement précis à partir de son nom dans le
 * catalogue JSON local.
 *
 * @param nom  Nom exact de l’équipement recherché
 * @returns    L’objet Equipement trouvé ou undefined s’il n’existe pas
 * ---------------------------------------------------------------
 */
export function trouverEquipement(nom: string): Equipement | undefined {
	return equipements.find(
		(equipement) => typeof equipement.nom === 'string' && equipement.nom === nom
	);
}

/**
 * Additionne un effet dans la structure cumulée des effets d’un set.
 * Si un effet existe déjà, on additionne simplement ses valeurs.
 *
 * @param effets   Objet contenant les effets cumulés
 * @param effet    Nom de l’effet à ajouter (ex. "Force")
 * @param valeur   Valeur numérique ou intervalle [min, max]
 * ---------------------------------------------------------------
 */
function cumulerEffet(
	effets: Record<string, IntervalleEffet>,
	effet: string,
	valeur: number | [number, number]
) {
	const enCours = effets[effet] ?? { min: 0, max: 0 };
	if (Array.isArray(valeur)) {
		enCours.min += valeur[0];
		enCours.max += valeur[1];
	} else {
		enCours.min += valeur;
		enCours.max += valeur;
	}
	effets[effet] = enCours;
}

/**
 * Génère un résumé statistique complet pour une panoplie :
 *   - Prix total selon le registre
 *   - Niveau minimum requis
 *   - Effets cumulés (somme des valeurs min/max)
 *
 * @param panoplie      Panoplie personnalisée à analyser
 * @param registrePrix  Dictionnaire des prix saisis par l’utilisateur
 * @returns             Objet ResumePanoplie avec toutes les données calculées
 * ---------------------------------------------------------------
 */
export function calculerResumePanoplie(
	panoplie: PanopliePersonnalisee,
	registrePrix: RegistrePrix
): ResumePanoplie {
	const effetsCumules: Record<string, IntervalleEffet> = {};
	let coutTotal = 0;
	let niveauMinimum = 0;

	// Liste les équipements actifs (emplacements non vides)
	const equipementsActifs = Object.values(panoplie.emplacements).filter(
		(nom): nom is string => typeof nom === 'string' && nom.length > 0
	);

	for (const nomEquipement of equipementsActifs) {
		// Recherche les infos complètes de l’équipement
		const equipement = trouverEquipement(nomEquipement);
		if (!equipement) {
			continue; // passe au suivant si l’équipement n’existe pas
		}

		// Calcule le niveau minimal du set
		niveauMinimum = Math.max(niveauMinimum, equipement.niveau ?? 0);

		// Ajoute le prix à partir du registre des prix
		const prix = registrePrix[nomEquipement];
		if (prix) {
			coutTotal += prix;
		}

		// Additionne tous les effets de l’équipement
		if (equipement.effets) {
			for (const [effet, valeur] of Object.entries(equipement.effets)) {
				cumulerEffet(effetsCumules, effet, valeur);
			}
		}
	}

	// Trie les effets par ordre alphabétique pour affichage propre
	return {
		nombreEquipements: equipementsActifs.length,
		coutTotal,
		niveauMinimum,
		effets: Object.fromEntries(
			Object.entries(effetsCumules).sort(([effetA], [effetB]) => effetA.localeCompare(effetB))
		)
	};
}

/**
 * Compare deux résumés de panoplies (A et B) pour l’affichage.
 * Génère une liste de tous les effets présents dans l’un ou l’autre,
 * afin d’afficher les valeurs côte à côte dans le comparateur.
 *
 * @param resumeA Résumé de la première panoplie
 * @param resumeB Résumé de la seconde panoplie
 * @returns      Tableau contenant chaque effet et ses valeurs A / B
 * ---------------------------------------------------------------
 */
export function comparerEffets(resumeA: ResumePanoplie | null, resumeB: ResumePanoplie | null) {
	const effets = new Set<string>();

	// Collecte tous les effets des deux panoplies
	if (resumeA) {
		Object.keys(resumeA.effets).forEach((effet) => effets.add(effet));
	}
	if (resumeB) {
		Object.keys(resumeB.effets).forEach((effet) => effets.add(effet));
	}

	// Trie et prépare les objets pour affichage comparatif
	return Array.from(effets)
		.sort((a, b) => a.localeCompare(b))
		.map((effet) => ({
			effet,
			a: resumeA?.effets[effet] ?? null,
			b: resumeB?.effets[effet] ?? null
		}));
}

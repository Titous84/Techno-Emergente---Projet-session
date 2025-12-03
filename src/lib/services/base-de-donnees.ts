// ===============================================================
// Fichier : src/lib/services/base-de-donnees.ts
// Service responsable du chargement et de la manipulation locale
// des données (équipements, panoplies, ressources).
// Inspiré de la fiche de cours « Gestion des données locales ».
// ===============================================================

import equipements from '$lib/data/equipements.json';
import panoplies from '$lib/data/panoplie.json';
import ressources from '$lib/data/ressources.json';
import type { Equipement, PanoplieOfficielle } from '$lib/types';

// Conversion explicite pour bénéficier de l'autocomplétion TypeScript.
const equipementsDonnees = equipements as unknown as Equipement[];
const panopliesDonnees = panoplies as unknown as PanoplieOfficielle[];

/**
 * Fonction utilitaire servant à normaliser le texte (accents, majuscules, etc.).
 * Elle permet d’effectuer des comparaisons plus fiables entre les noms.
 *
 * Exemple : "Épée du Chevalier" => "epee du chevalier"
 */
function normaliserTexte(texte: unknown): string {
	return `${texte ?? ''}`
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

/**
 * Retourne un équipement correspondant à un nom exact.
 * Affiche des avertissements en console si aucun équipement n’est trouvé.
 */
export function getEquipementParNom(nom: string): Equipement | undefined {
	const resultat = equipementsDonnees.find(
		(e) => typeof e.nom === 'string' && e.nom.trim().length > 0 && e.nom === nom
	);

	if (!resultat) {
		console.warn('❌ Équipement non trouvé :', nom);
		console.log(
			'Voici quelques noms disponibles :',
			equipementsDonnees.slice(0, 5).map((e) => e.nom)
		);
	}
	return resultat;
}

/**
 * Retourne la panoplie officielle associée à un équipement donné.
 * ⚠️ BUG rencontré dans le prototype :
 * - Certaines correspondances échouaient, car le JSON de panoplies contenait
 *   des variations de casse ou d’accents (ex. "Ceinture de l’Abraknyde Ancestral").
 * ✅ Solution :
 *   utilisation de la fonction `normaliserTexte` pour comparer chaque nom
 *   de manière insensible à la casse et aux accents.
 */
export function getPanoplieParEquipement(equipementNom: string): PanoplieOfficielle | undefined {
	const nomNormalise = normaliserTexte(equipementNom);
	return panopliesDonnees.find((p) =>
		p.composition.some((nom) => normaliserTexte(nom) === nomNormalise)
	);
}

/**
 * Recherche une ressource par son nom.
 * Retourne l’objet complet trouvé dans le fichier ressources.json.
 */
export function trouverRessource(nom: string) {
	return ressources.find((r) => r.nom === nom);
}

/**
 * Génère la liste complète et unique des effets disponibles
 * dans l’ensemble des équipements.
 *
 * ⚠️ BUG observé :
 * - Certains effets apparaissaient en double avec des variantes ("Vitalité" vs "vitalité").
 * ✅ Solution adoptée :
 *   utilisation d’un Set + tri alphabétique pour garantir l’unicité et la lisibilité.
 */
export function listerTousLesEffets() {
	const setEffets = new Set<string>();

	for (const eq of equipements) {
		if (eq.effets) {
			for (const effet of Object.keys(eq.effets)) {
				setEffets.add(effet);
			}
		}
	}

	return Array.from(setEffets).sort();
}

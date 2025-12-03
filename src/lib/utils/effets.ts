// ===============================================================
// Fichier : src/lib/services/icones-effets.ts
// Objectif : associer chaque effet de jeu à une icône visuelle
// provenant du site DofusDB.
//
// Source : Inspiré de la fiche "Affichage dynamique d’icônes"
// ===============================================================

/**
 * Dictionnaire reliant les noms d’effets connus à leurs fichiers d’icônes.
 * @see https://dofusdb.fr/icons/effects/
 *
 * ⚠️ Problème observé :
 * - Certains effets n’étaient pas trouvés (ex. "Dommages" vs "Dommage(s)").
 * - Cela produisait des URL invalides et donc des images manquantes.
 *
 * ✅ Solution :
 * - harmoniser les clés via un mapping explicite.
 * - ajouter une étape de normalisation dans `effetToImageUrl()`
 *   pour gérer les variations mineures (casse, espaces, caractères spéciaux).
 */
const mapping: Record<string, string> = {
	Vitalité: 'pv',
	Force: 'terre',
	Intelligence: 'feu',
	Chance: 'eau',
	Agilité: 'air',
	Sagesse: 'sagesse',
	Tacle: 'tacle',
	Fuite: 'fuite',
	Portée: 'po',
	PA: 'pa',
	PM: 'pm',
	Prospection: 'pp',
	Puissance: 'puissance',
	'Retrait PA': 'retraitPA',
	'Retrait PM': 'retraitPM',
	'Esquive PA': 'esquivePA',
	'Esquive PM': 'esquivePM',
	'% Critique': 'critique',
	'Dommage(s)': 'dommages',
	'Dommage(s) Critiques': 'dommagesCrit',
	Initiative: 'initiative',
	'% Résistance Neutre': 'resNeutre',
	'% Résistance Terre': 'resTerre',
	'% Résistance Feu': 'resFeu',
	'% Résistance Eau': 'resEau',
	'% Résistance Air': 'resAir',
	'Résistance(s) Critiques': 'resCrit',
	'Invocation(s)': 'invocation',
	'Résistance(s) Poussée': 'resPoussee'
};

/**
 * Retourne l’URL d’une icône illustrant un effet donné.
 *
 * ⚠️ Ancien bug : si un effet ne figurait pas dans le `mapping`,
 * la fonction générait un nom de fichier incorrect (caractères non retirés).
 *
 * ✅ Correction :
 * - application d’une normalisation stricte (suppression des espaces, % et caractères spéciaux)
 * - conversion systématique en minuscules pour éviter les 404 sur DofusDB
 */
export function effetToImageUrl(effet: string): string {
	// Normalisation manuelle des caractères interdits dans les URLs
	const filename = mapping[effet] || effet.toLowerCase().replace(/\s|\(|\)|%|'|\/|-/g, '');
	return `https://dofusdb.fr/icons/effects/${filename}.png`;
}

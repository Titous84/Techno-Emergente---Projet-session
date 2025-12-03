// ===============================================================
// Fichier : src/lib/stores/panoplies.ts
// Objectif : gérer l’état réactif des panoplies personnalisées.
// Le store assure la persistance dans le navigateur et fournit
// les opérations CRUD sur les panoplies de l’utilisateur.
//
// Source : Inspiré de la fiche de cours « Gestion d’état local avec Svelte »
// ===============================================================

import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { EmplacementId, PanopliePersonnalisee } from '$lib/types';
import { emplacementsVides } from '$lib/types';

// --- Clé de stockage locale ---
const STORAGE_KEY = 'dofus-panoplies-utilisateur';

// --- Type interne représentant la liste de panoplies ---
type PanopliesState = PanopliePersonnalisee[];

/**
 * Génère un identifiant unique compatible navigateur/serveur.
 * ⚠️ Lors des tests initiaux, certaines panoplies dupliquées
 * avaient le même id, causant des collisions dans la liste.
 * ✅ Solution : utilisation de `crypto.randomUUID()` pour
 * garantir l’unicité même en cas de rechargement simultané.
 */
function genererId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `panoplie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normalise une panoplie chargée depuis le localStorage.
 * Elle assure la compatibilité avec d’anciennes versions du format JSON.
 */
function normaliserPanoplie(entree: unknown): PanopliePersonnalisee | null {
	if (!entree || typeof entree !== 'object') {
		return null;
	}
	const base = emplacementsVides();
	const emplacements: typeof base = { ...base };

	const source = entree as Record<string, unknown>;

	// ✅ Compatibilité : ancienne structure (liste) ou nouvelle (objet)
	if (source.emplacements && typeof source.emplacements === 'object') {
		for (const cle of Object.keys(base) as EmplacementId[]) {
			const valeur = (source.emplacements as Record<string, unknown>)[cle];
			if (typeof valeur === 'string' && valeur.trim().length > 0) {
				emplacements[cle] = valeur;
			}
		}
	} else if (Array.isArray(source.equipements)) {
		const ids = Object.keys(base) as EmplacementId[];
		source.equipements
			.filter((nom): nom is string => typeof nom === 'string' && nom.trim().length > 0)
			.forEach((nom, index) => {
				const slot = ids[index];
				if (slot) {
					emplacements[slot] = nom;
				}
			});
	}

	const nom =
		typeof source.nom === 'string' && source.nom.trim().length > 0
			? source.nom.trim()
			: 'Panoplie sans nom';

	const description = typeof source.description === 'string' ? source.description : undefined;
	const creeLe = typeof source.creeLe === 'string' ? source.creeLe : new Date().toISOString();
	const modifieLe = typeof source.modifieLe === 'string' ? source.modifieLe : creeLe;

	return {
		id: typeof source.id === 'string' ? source.id : genererId(),
		nom,
		description,
		emplacements,
		creeLe,
		modifieLe
	};
}

/**
 * Charge les panoplies sauvegardées dans le localStorage.
 * ⚠️ Bug rencontré : certaines panoplies chargées étaient invalides
 * (emplacements `undefined` ou propriétés manquantes).
 * ✅ Solution : passage systématique dans `normaliserPanoplie()` avant intégration.
 */
function chargerPanoplies(): PanopliesState {
	if (!browser) {
		return [];
	}
	try {
		const texte = localStorage.getItem(STORAGE_KEY);
		if (!texte) {
			return [];
		}
		const donnees = JSON.parse(texte);
		if (Array.isArray(donnees)) {
			return donnees
				.map((item) => normaliserPanoplie(item))
				.filter((item): item is PanopliePersonnalisee => item !== null);
		}
	} catch (erreur) {
		console.warn('Impossible de lire les panoplies sauvegardées :', erreur);
	}
	return [];
}

/**
 * Sauvegarde la liste des panoplies dans le localStorage.
 * Protége contre les erreurs de quota ou de JSON invalide.
 */
function sauvegarderPanoplies(panoplies: PanopliesState) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(panoplies));
	} catch (erreur) {
		console.warn('Impossible de sauvegarder les panoplies :', erreur);
	}
}

/**
 * Crée une nouvelle panoplie vide avec un nom donné.
 */
function creerPanoplie(nom: string): PanopliePersonnalisee {
	const maintenant = new Date().toISOString();
	return {
		id: genererId(),
		nom,
		description: '',
		emplacements: emplacementsVides(),
		creeLe: maintenant,
		modifieLe: maintenant
	};
}

/**
 * Fonction principale : crée le store des panoplies.
 * Permet d’ajouter, modifier, supprimer, dupliquer et réinitialiser les données.
 */
function creerStorePanoplies() {
	const { subscribe, update, set } = writable<PanopliesState>(chargerPanoplies());

	// 🔄 Synchronisation automatique avec le localStorage
	if (browser) {
		subscribe((valeur) => sauvegarderPanoplies(valeur));
	}

	return {
		subscribe,

		// --- CRUD ---
		ajouterPanoplie(nom: string) {
			const nomNettoye = nom.trim() || 'Nouvelle panoplie';
			const panoplie = creerPanoplie(nomNettoye);
			update((liste) => [...liste, panoplie]);
			return panoplie.id;
		},

		supprimerPanoplie(id: string) {
			update((liste) => liste.filter((p) => p.id !== id));
		},

		renommerPanoplie(id: string, nouveauNom: string) {
			const nomNettoye = nouveauNom.trim();
			if (!nomNettoye) return;
			update((liste) =>
				liste.map((p) =>
					p.id === id ? { ...p, nom: nomNettoye, modifieLe: new Date().toISOString() } : p
				)
			);
		},

		definirDescription(id: string, description: string) {
			update((liste) =>
				liste.map((p) =>
					p.id === id ? { ...p, description, modifieLe: new Date().toISOString() } : p
				)
			);
		},

		/**
		 * Définit un équipement dans un emplacement précis.
		 * ⚠️ BUG observé :
		 * - L’équipement ne se mettait pas à jour visuellement sans rechargement.
		 *   (problème de réactivité dû à la mutation interne de l’objet).
		 * ✅ Solution :
		 *   création d’un nouvel objet `emplacements` (copie immuable)
		 *   pour déclencher la réactivité de Svelte.
		 */
		definirEquipement(id: string, emplacement: EmplacementId, equipementNom: string | null) {
			update((liste) =>
				liste.map((p) =>
					p.id === id
						? {
								...p,
								emplacements: {
									...p.emplacements,
									[emplacement]: equipementNom
								},
								modifieLe: new Date().toISOString()
							}
						: p
				)
			);
		},

		retirerEquipement(id: string, emplacement: EmplacementId) {
			update((liste) =>
				liste.map((p) =>
					p.id === id
						? {
								...p,
								emplacements: {
									...p.emplacements,
									[emplacement]: null
								},
								modifieLe: new Date().toISOString()
							}
						: p
				)
			);
		},

		reinitialiserEmplacements(id: string) {
			update((liste) =>
				liste.map((p) =>
					p.id === id
						? { ...p, emplacements: emplacementsVides(), modifieLe: new Date().toISOString() }
						: p
				)
			);
		},

		/**
		 * Duplique une panoplie existante.
		 * ⚠️ Ancien bug : la duplication réutilisait le même ID
		 * => les deux panoplies se remplaçaient mutuellement dans le store.
		 * ✅ Solution : appel explicite à `genererId()` lors de la copie.
		 */
		dupliquerPanoplie(id: string) {
			let nouvelId = '';
			update((liste) => {
				const panoplieOriginale = liste.find((p) => p.id === id);
				if (!panoplieOriginale) return liste;

				const duplication: PanopliePersonnalisee = {
					...panoplieOriginale,
					id: genererId(),
					nom: `${panoplieOriginale.nom} (copie)`,
					emplacements: { ...panoplieOriginale.emplacements },
					creeLe: new Date().toISOString(),
					modifieLe: new Date().toISOString()
				};
				nouvelId = duplication.id;
				return [...liste, duplication];
			});
			return nouvelId;
		},

		// Réinitialisation complète du store
		reinitialiser() {
			set([]);
		}
	};
}

// --- Export du store réactif ---
export const panopliesUtilisateur = creerStorePanoplies();

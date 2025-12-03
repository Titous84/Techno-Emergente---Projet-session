import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/**
 * Clé de persistance pour les prix saisis par l'utilisateur.
 */
const STORAGE_KEY = 'dofus-prix-equipements';

export type RegistrePrix = Record<string, number>;

/**
 * Charge les données initiales depuis le localStorage uniquement côté navigateur.
 */
function chargerPrixDepuisLocalStorage(): RegistrePrix {
	if (!browser) {
		return {};
	}

	try {
		const texte = localStorage.getItem(STORAGE_KEY);
		if (!texte) {
			return {};
		}
		const donnees = JSON.parse(texte);
		if (typeof donnees === 'object' && donnees) {
			return donnees as RegistrePrix;
		}
	} catch (erreur) {
		console.warn('Impossible de lire les prix sauvegardés :', erreur);
	}
	return {};
}

/**
 * Persiste l'état actuel dans le localStorage (côté navigateur seulement).
 */
function sauvegarderPrix(registre: RegistrePrix) {
	if (!browser) {
		return;
	}
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(registre));
	} catch (erreur) {
		console.warn('Impossible de sauvegarder les prix :', erreur);
	}
}

/**
 * Crée un store Svelte pour gérer les prix des équipements.
 */
function creerStorePrix() {
	const { subscribe, update, set } = writable<RegistrePrix>(chargerPrixDepuisLocalStorage());

	if (browser) {
		subscribe((valeur) => {
			sauvegarderPrix(valeur);
		});
	}

	return {
		subscribe,
		/**
		 * Définit ou met à jour le prix d'un équipement. Une valeur vide ou négative supprime l'entrée.
		 */
		definirPrix(nom: string, prix?: number) {
			const valeurNumerique = prix ?? 0;
			update((registre) => {
				const copie = { ...registre };
				if (!valeurNumerique || valeurNumerique <= 0) {
					delete copie[nom];
				} else {
					copie[nom] = Math.round(valeurNumerique);
				}
				return copie;
			});
		},
		/**
		 * Réinitialise complètement les prix mémorisés.
		 */
		reinitialiser() {
			set({});
		}
	};
}

export const prixEquipements = creerStorePrix();

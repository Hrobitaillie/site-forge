/**
 * SiteForge Helpers
 * Utilitaires centralisés pour simplifier le code des blocs
 */

import { __ } from '@wordpress/i18n';

// ============================================================================
// BLOCK DATA HELPERS
// ============================================================================

/**
 * Récupère les fields d'un bloc depuis window.siteforgeBlocks
 * @param {string} blockName - Nom du bloc (ex: 'siteforge/hero')
 * @returns {array|null} - Liste des fields ou null
 */
export const getBlockFields = (blockName) => {
    if (typeof window.siteforgeBlocks === 'undefined') {
        return null;
    }

    const blockData = window.siteforgeBlocks[blockName];
    if (!blockData?.fields) {
        return null;
    }

    const fields = blockData.fields;
    if (!Array.isArray(fields) || fields.length === 0) {
        return null;
    }

    return fields;
};

/**
 * Récupère les métadonnées d'un bloc
 * @param {string} blockName - Nom du bloc
 * @returns {Object} - Métadonnées du bloc
 */
export const getBlockData = (blockName) => {
    if (typeof window.siteforgeBlocks === 'undefined') {
        return null;
    }
    return window.siteforgeBlocks[blockName] || null;
};

// ============================================================================
// ARRAY HELPERS (immutable operations)
// ============================================================================

export const arrayHelpers = {
    /**
     * Ajoute un élément à la fin du tableau
     */
    add: (arr, item) => [...(arr || []), item],

    /**
     * Supprime un élément par index
     */
    remove: (arr, index) => (arr || []).filter((_, i) => i !== index),

    /**
     * Déplace un élément d'une position à une autre
     */
    move: (arr, fromIndex, toIndex) => {
        const result = [...(arr || [])];
        const [item] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, item);
        return result;
    },

    /**
     * Met à jour un élément par index
     */
    update: (arr, index, value) => {
        const result = [...(arr || [])];
        result[index] = value;
        return result;
    },

    /**
     * Met à jour une propriété d'un élément par index
     */
    updateProp: (arr, index, prop, value) => {
        const result = [...(arr || [])];
        result[index] = { ...result[index], [prop]: value };
        return result;
    },
};

// ============================================================================
// IMAGE HELPERS
// ============================================================================

export const imageHelpers = {
    /**
     * Vérifie si une valeur d'image est vide
     * Gère le cas où WordPress convertit {} en [] (array vide)
     * @param {*} value - Valeur à vérifier
     * @returns {boolean} - True si vide
     */
    isEmpty: (value) => {
        if (!value) return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    },

    /**
     * Extrait l'URL d'une valeur d'image (string, object, ou number)
     * @param {string|number|Object} value - Valeur de l'image
     * @returns {string} - URL de l'image
     */
    getUrl: (value) => {
        if (imageHelpers.isEmpty(value)) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value?.url) return value.url;
        return '';
    },

    /**
     * Extrait l'ID d'une valeur d'image
     * @param {string|number|Object} value - Valeur de l'image
     * @returns {number|null} - ID de l'image
     */
    getId: (value) => {
        if (imageHelpers.isEmpty(value)) return null;
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value?.id) return value.id;
        return null;
    },

    /**
     * Formate la valeur d'image selon le return_value attendu
     * @param {Object} media - Objet média de WordPress
     * @param {string} returnValue - 'id', 'url', ou 'object'
     * @returns {string|number|Object} - Valeur formatée
     */
    formatValue: (media, returnValue = 'url') => {
        if (!media) return '';

        switch (returnValue) {
            case 'id':
                return media.id;
            case 'url':
                return media.url;
            case 'object':
                return {
                    id: media.id,
                    url: media.url,
                    alt: media.alt || '',
                    title: media.title || '',
                    width: media.width,
                    height: media.height,
                };
            default:
                return media.url;
        }
    },
};

// ============================================================================
// OBJECT HELPERS
// ============================================================================

export const objectHelpers = {
    /**
     * Met à jour une propriété d'un objet de manière immutable
     */
    setProp: (obj, prop, value) => ({ ...(obj || {}), [prop]: value }),

    /**
     * Récupère une propriété avec valeur par défaut
     */
    getProp: (obj, prop, defaultValue = '') => obj?.[prop] ?? defaultValue,

    /**
     * Fusionne plusieurs objets
     */
    merge: (...objects) => Object.assign({}, ...objects),
};

// ============================================================================
// FIELD HELPERS
// ============================================================================

/**
 * Crée un objet field normalisé depuis une définition
 * @param {string} name - Nom du champ
 * @param {Object} fieldDef - Définition du champ
 * @returns {Object} - Field normalisé
 */
export const normalizeField = (name, fieldDef) => ({
    name,
    type: fieldDef.type || 'text',
    label: fieldDef.label || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    config: fieldDef,
});

/**
 * Crée les valeurs par défaut pour un repeater item
 * @param {Object} subFields - Définition des sous-champs
 * @returns {Object} - Objet avec valeurs par défaut
 */
export const createRepeaterItemDefaults = (subFields) => {
    const defaults = {};
    if (subFields) {
        Object.entries(subFields).forEach(([name, field]) => {
            if (field.default !== undefined) {
                defaults[name] = field.default;
            }
        });
    }
    return defaults;
};

/**
 * Crée les valeurs par défaut pour un group
 * @param {Object} subFields - Définition des sous-champs
 * @returns {Object} - Objet avec valeurs par défaut
 */
export const createGroupDefaults = createRepeaterItemDefaults;

// ============================================================================
// STYLE HELPERS
// ============================================================================

export const styleHelpers = {
    /**
     * Combine des classes CSS conditionnellement
     * @param  {...string|Object|Array} args - Classes ou conditions
     * @returns {string} - Classes combinées
     */
    classNames: (...args) => {
        return args
            .flat()
            .filter((cls) => {
                if (typeof cls === 'string') return cls;
                if (typeof cls === 'object' && cls !== null) {
                    return Object.entries(cls)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(' ');
                }
                return '';
            })
            .join(' ')
            .trim();
    },

    /**
     * Génère un style inline depuis un objet
     * @param {Object} styles - Objet de styles
     * @returns {Object} - Style React
     */
    inlineStyle: (styles) => {
        const result = {};
        Object.entries(styles || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                result[key] = value;
            }
        });
        return result;
    },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validationHelpers = {
    /**
     * Vérifie si une valeur est vide
     */
    isEmpty: (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },

    /**
     * Vérifie si une URL est valide
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Vérifie si un email est valide
     */
    isValidEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
};

// ============================================================================
// ATTRIBUTE HELPERS
// ============================================================================

/**
 * Crée un setter d'attribut unique
 * @param {Function} setAttributes - Fonction setAttributes de Gutenberg
 * @param {string} name - Nom de l'attribut
 * @returns {Function} - Setter pour cet attribut
 */
export const createAttributeSetter = (setAttributes, name) => (value) => {
    setAttributes({ [name]: value });
};

/**
 * Crée des setters pour tous les attributs d'un bloc
 * @param {Function} setAttributes - Fonction setAttributes de Gutenberg
 * @param {Array} fieldNames - Liste des noms de champs
 * @returns {Object} - Objet avec les setters
 */
export const createAttributeSetters = (setAttributes, fieldNames) => {
    const setters = {};
    fieldNames.forEach((name) => {
        setters[name] = createAttributeSetter(setAttributes, name);
    });
    return setters;
};

// ============================================================================
// EXPORTS GROUPÉS
// ============================================================================

export default {
    getBlockFields,
    getBlockData,
    arrayHelpers,
    imageHelpers,
    objectHelpers,
    styleHelpers,
    validationHelpers,
    normalizeField,
    createRepeaterItemDefaults,
    createGroupDefaults,
    createAttributeSetter,
    createAttributeSetters,
};

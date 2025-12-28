/**
 * SiteForge Field Control Factory
 * Génère automatiquement les InspectorControls depuis les field definitions
 */

import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { FieldControls } from './field-controls';
import { getBlockFields } from './helpers';

// ============================================================================
// COMPOSANTS DE RENDU DE CHAMPS
// ============================================================================

/**
 * Affiche une erreur pour un type de champ inconnu
 */
const UnknownFieldError = ({ field }) => (
    <div className="siteforge-error">
        <p className="siteforge-error-title">
            {__('Error', 'siteforge')}: {__('Unknown field type', 'siteforge')}
        </p>
        <p>
            {__('Field', 'siteforge')}: <code>{field.name}</code>
            <br />
            {__('Type', 'siteforge')}: <code>{field.type}</code>
        </p>
    </div>
);

/**
 * Rend un champ unique avec son composant approprié
 */
const renderField = (field, attributes, setAttributes) => {
    const FieldComponent = FieldControls[field.type];

    if (!FieldComponent) {
        console.warn(`[SiteForge] Unknown field type: ${field.type} for field: ${field.name}`);
        return <UnknownFieldError key={field.name} field={field} />;
    }

    return (
        <FieldComponent
            key={field.name}
            field={field}
            value={attributes[field.name]}
            onChange={(value) => setAttributes({ [field.name]: value })}
        />
    );
};

/**
 * Rend une liste de champs
 */
const renderFields = (fields, attributes, setAttributes) => {
    return fields.map((field) => renderField(field, attributes, setAttributes));
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Crée les InspectorControls React depuis les définitions de champs
 *
 * @param {string} blockName - Nom du bloc (ex: 'siteforge/hero')
 * @param {Object} attributes - Attributs du bloc
 * @param {Function} setAttributes - Fonction pour mettre à jour les attributs
 * @param {string} panelTitle - Titre du panel (optionnel)
 * @return {JSX.Element|null} Composant InspectorControls ou null
 */
export const createFieldControls = (blockName, attributes, setAttributes, panelTitle = null) => {
    const fields = getBlockFields(blockName);

    if (!fields) {
        return null;
    }

    const defaultPanelTitle = panelTitle || __('Block Settings', 'siteforge');

    return (
        <InspectorControls>
            <PanelBody title={defaultPanelTitle} initialOpen={true}>
                {renderFields(fields, attributes, setAttributes)}
            </PanelBody>
        </InspectorControls>
    );
};

/**
 * Crée plusieurs panels groupés par sections
 *
 * @param {string} blockName - Nom du bloc
 * @param {Object} attributes - Attributs du bloc
 * @param {Function} setAttributes - Fonction pour mettre à jour les attributs
 * @param {Object} sections - Object avec sections {sectionName: {title, fields: [fieldNames], initialOpen}}
 * @return {JSX.Element|null} Composant InspectorControls ou null
 *
 * @example
 * createSectionedFieldControls('siteforge/hero', attributes, setAttributes, {
 *     content: {
 *         title: 'Content',
 *         fields: ['title', 'subtitle', 'description'],
 *         initialOpen: true
 *     },
 *     style: {
 *         title: 'Style',
 *         fields: ['backgroundColor', 'textColor'],
 *         initialOpen: false
 *     }
 * });
 */
export const createSectionedFieldControls = (blockName, attributes, setAttributes, sections) => {
    const allFields = getBlockFields(blockName);

    if (!allFields) {
        return null;
    }

    return (
        <InspectorControls>
            {Object.entries(sections).map(([sectionKey, section]) => {
                // Filtrer les champs pour cette section
                const sectionFields = allFields.filter((field) =>
                    section.fields.includes(field.name)
                );

                if (sectionFields.length === 0) {
                    return null;
                }

                return (
                    <PanelBody
                        key={sectionKey}
                        title={section.title}
                        initialOpen={section.initialOpen !== undefined ? section.initialOpen : true}
                    >
                        {renderFields(sectionFields, attributes, setAttributes)}
                    </PanelBody>
                );
            })}
        </InspectorControls>
    );
};

/**
 * Crée des InspectorControls avec des onglets (tabs)
 *
 * @param {string} blockName - Nom du bloc
 * @param {Object} attributes - Attributs du bloc
 * @param {Function} setAttributes - Fonction pour mettre à jour les attributs
 * @param {Array} tabs - Configuration des onglets [{name, title, icon, fields: [fieldNames]}]
 * @return {JSX.Element|null} Composant InspectorControls ou null
 */
export const createTabbedFieldControls = (blockName, attributes, setAttributes, tabs) => {
    const allFields = getBlockFields(blockName);

    if (!allFields) {
        return null;
    }

    // Import dynamique du TabPanel si nécessaire
    const { TabPanel } = wp.components;

    const tabsConfig = tabs.map((tab) => ({
        name: tab.name,
        title: tab.title,
        icon: tab.icon,
        className: `siteforge-tab-${tab.name}`,
    }));

    return (
        <InspectorControls>
            <TabPanel tabs={tabsConfig}>
                {(tab) => {
                    const tabConfig = tabs.find((t) => t.name === tab.name);
                    const tabFields = allFields.filter((field) =>
                        tabConfig.fields.includes(field.name)
                    );

                    return (
                        <PanelBody>
                            {renderFields(tabFields, attributes, setAttributes)}
                        </PanelBody>
                    );
                }}
            </TabPanel>
        </InspectorControls>
    );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook React pour utiliser les field controls
 *
 * @param {string} blockName - Nom du bloc
 * @return {Object} {hasFields, fieldCount, fieldNames, fields, getField}
 */
export const useSiteForgeFields = (blockName) => {
    const fields = getBlockFields(blockName);

    if (!fields) {
        return {
            hasFields: false,
            fieldCount: 0,
            fieldNames: [],
            fields: [],
            getField: () => null,
        };
    }

    return {
        hasFields: true,
        fieldCount: fields.length,
        fieldNames: fields.map((f) => f.name),
        fields: fields,
        getField: (name) => fields.find((f) => f.name === name) || null,
    };
};

/**
 * Hook pour créer facilement les setters d'attributs
 *
 * @param {Function} setAttributes - Fonction setAttributes de Gutenberg
 * @param {Array} fieldNames - Liste des noms de champs
 * @return {Object} Objet avec les setters {setTitle, setSubtitle, ...}
 */
export const useAttributeSetters = (setAttributes, fieldNames) => {
    const setters = {};

    fieldNames.forEach((name) => {
        // Convertit 'myField' en 'setMyField'
        const setterName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        setters[setterName] = (value) => setAttributes({ [name]: value });
    });

    return setters;
};

// ============================================================================
// COMPOSANT WRAPPER
// ============================================================================

/**
 * Composant wrapper pour afficher les controls d'un bloc
 *
 * @example
 * <SiteForgeBlockControls
 *     blockName="siteforge/hero"
 *     attributes={attributes}
 *     setAttributes={setAttributes}
 * >
 *     <div>Block content here</div>
 * </SiteForgeBlockControls>
 */
export const SiteForgeBlockControls = ({
    blockName,
    attributes,
    setAttributes,
    panelTitle,
    sections,
    children,
}) => {
    // Si sections est fourni, utiliser les panels sectionnés
    const controls = sections
        ? createSectionedFieldControls(blockName, attributes, setAttributes, sections)
        : createFieldControls(blockName, attributes, setAttributes, panelTitle);

    return (
        <>
            {controls}
            {children}
        </>
    );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default createFieldControls;

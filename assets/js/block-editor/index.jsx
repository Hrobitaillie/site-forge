/**
 * SiteForge Block Editor
 * Point d'entrée principal pour les assets de l'éditeur
 */

// Import des helpers
import helpers, {
    getBlockFields,
    getBlockData,
    arrayHelpers,
    imageHelpers,
    objectHelpers,
    styleHelpers,
    validationHelpers,
    normalizeField,
    createRepeaterItemDefaults,
    createAttributeSetter,
    createAttributeSetters,
} from './helpers';

// Import des field controls
import {
    FieldControls,
    TextField,
    TextareaField,
    WysiwygField,
    ImageField,
    FileField,
    SelectField,
    CheckboxField,
    ToggleField,
    NumberField,
    RangeField,
    UrlField,
    EmailField,
    ColorField,
    RepeaterField,
    GroupField,
    FieldWrapper,
    FieldLabel,
    getFieldComponent,
    renderSubFields,
} from './field-controls';

// Import du factory
import {
    createFieldControls,
    createSectionedFieldControls,
    createTabbedFieldControls,
    useSiteForgeFields,
    useAttributeSetters,
    SiteForgeBlockControls,
} from './field-control-factory';

// Import de l'enregistrement automatique des blocs
import { registerSiteForgeBlocks } from './register-blocks';

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // ========== Helpers ==========
    helpers,
    getBlockFields,
    getBlockData,
    arrayHelpers,
    imageHelpers,
    objectHelpers,
    styleHelpers,
    validationHelpers,
    normalizeField,
    createRepeaterItemDefaults,
    createAttributeSetter,
    createAttributeSetters,

    // ========== Field Controls ==========
    TextField,
    TextareaField,
    WysiwygField,
    ImageField,
    FileField,
    SelectField,
    CheckboxField,
    ToggleField,
    NumberField,
    RangeField,
    UrlField,
    EmailField,
    ColorField,
    RepeaterField,
    GroupField,

    // ========== Composants utilitaires ==========
    FieldWrapper,
    FieldLabel,
    getFieldComponent,
    renderSubFields,

    // ========== Objet contenant tous les controls ==========
    FieldControls,

    // ========== Factory functions ==========
    createFieldControls,
    createSectionedFieldControls,
    createTabbedFieldControls,

    // ========== React Hooks ==========
    useSiteForgeFields,
    useAttributeSetters,

    // ========== Wrapper Component ==========
    SiteForgeBlockControls,

    // ========== Register function ==========
    registerSiteForgeBlocks,
};

// Export par défaut du factory principal
export default createFieldControls;

// ============================================================================
// GLOBAL WINDOW OBJECT
// ============================================================================

// Rendre disponible globalement pour les blocs qui utilisent wp.element.createElement
window.SiteForge = window.SiteForge || {};

// Helpers
window.SiteForge.helpers = helpers;
window.SiteForge.getBlockFields = getBlockFields;
window.SiteForge.getBlockData = getBlockData;
window.SiteForge.arrayHelpers = arrayHelpers;
window.SiteForge.imageHelpers = imageHelpers;
window.SiteForge.objectHelpers = objectHelpers;
window.SiteForge.styleHelpers = styleHelpers;

// Field Controls
window.SiteForge.FieldControls = FieldControls;
window.SiteForge.getFieldComponent = getFieldComponent;
window.SiteForge.FieldWrapper = FieldWrapper;
window.SiteForge.FieldLabel = FieldLabel;

// Factory
window.SiteForge.createFieldControls = createFieldControls;
window.SiteForge.createSectionedFieldControls = createSectionedFieldControls;
window.SiteForge.createTabbedFieldControls = createTabbedFieldControls;

// Hooks
window.SiteForge.useSiteForgeFields = useSiteForgeFields;
window.SiteForge.useAttributeSetters = useAttributeSetters;

// Components
window.SiteForge.SiteForgeBlockControls = SiteForgeBlockControls;

// Registration
window.SiteForge.registerSiteForgeBlocks = registerSiteForgeBlocks;

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Debug logs (only in development)
if (process.env.NODE_ENV !== 'production') {
    console.log('[SiteForge] Block editor components loaded');
    console.log('[SiteForge] Available field types:', Object.keys(FieldControls));
}

if (window.siteforgeBlocks) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[SiteForge] Registered blocks:', Object.keys(window.siteforgeBlocks));
    }

    // Auto-register blocks when ready
    if (typeof wp !== 'undefined' && typeof wp.domReady !== 'undefined') {
        wp.domReady(() => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[SiteForge] Auto-registering blocks...');
            }
            registerSiteForgeBlocks();
        });
    } else {
        // Fallback: register on window load
        window.addEventListener('load', () => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[SiteForge] Auto-registering blocks (fallback)...');
            }
            registerSiteForgeBlocks();
        });
    }
}

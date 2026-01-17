/**
 * SiteForge Field Controls
 * Composants React pour chaque type de champ
 */

import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
    TextControl,
    TextareaControl,
    SelectControl,
    CheckboxControl,
    Button,
    ColorPicker,
    RangeControl,
    ButtonGroup,
    ComboboxControl,
    Spinner,
    BaseControl,
} from '@wordpress/components';
import { MediaUpload, MediaUploadCheck, RichText } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';

import {
    arrayHelpers,
    imageHelpers,
    normalizeField,
    createRepeaterItemDefaults,
} from './helpers';

// ============================================================================
// COMPOSANTS UTILITAIRES RÉUTILISABLES
// ============================================================================

/**
 * Wrapper standardisé pour tous les field controls
 */
const FieldWrapper = ({ type, children, className = '' }) => (
    <div className={`siteforge-field-control siteforge-${type}-control ${className}`.trim()}>
        {children}
    </div>
);

/**
 * Label + Help text réutilisable
 */
const FieldLabel = ({ label, help }) => (
    <>
        {label && <label className="siteforge-field-label">{label}</label>}
        {help && <p className="siteforge-field-help">{help}</p>}
    </>
);

// ============================================================================
// MAPPING CENTRALISÉ DES FIELD CONTROLS
// Ce mapping est utilisé partout (export, RepeaterField, GroupField)
// ============================================================================

// Sera initialisé après la définition des composants
let FieldControlsMap = {};

/**
 * Récupère le composant pour un type de champ
 */
export const getFieldComponent = (type) => FieldControlsMap[type] || null;

/**
 * Rend un sous-champ (utilisé par Repeater et Group)
 */
const renderSubField = (subName, subField, value, onChange) => {
    const SubFieldComponent = FieldControlsMap[subField.type];

    if (!SubFieldComponent) {
        console.warn(`[SiteForge] Unknown sub-field type: ${subField.type}`);
        return null;
    }

    return (
        <SubFieldComponent
            key={subName}
            field={normalizeField(subName, subField)}
            value={value}
            onChange={onChange}
        />
    );
};

/**
 * Rend une liste de sous-champs
 */
const renderSubFields = (subFields, values, onFieldChange) => {
    if (!subFields) return null;

    return Object.entries(subFields).map(([subName, subField]) =>
        renderSubField(subName, subField, values?.[subName], (newValue) =>
            onFieldChange(subName, newValue)
        )
    );
};

// ============================================================================
// COMPOSANTS DE CHAMPS SIMPLES
// ============================================================================

/**
 * Text Field Control
 */
export const TextField = ({ field, value, onChange }) => (
    <FieldWrapper type="text">
        <TextControl
            __next40pxDefaultSize
            __nextHasNoMarginBottom
            label={field.label}
            value={value || ''}
            onChange={onChange}
            placeholder={field.config?.placeholder || ''}
            help={field.config?.help || ''}
            required={field.config?.required || false}
        />
    </FieldWrapper>
);

/**
 * Textarea Field Control
 */
export const TextareaField = ({ field, value, onChange }) => (
    <FieldWrapper type="textarea">
        <TextareaControl
            __nextHasNoMarginBottom
            label={field.label}
            value={value || ''}
            onChange={onChange}
            placeholder={field.config?.placeholder || ''}
            rows={field.config?.rows || 4}
            help={field.config?.help || ''}
        />
    </FieldWrapper>
);

/**
 * WYSIWYG Field Control
 */
export const WysiwygField = ({ field, value, onChange }) => (
    <FieldWrapper type="wysiwyg">
        <FieldLabel label={field.label} help={field.config?.help} />
        <RichText
            tagName="div"
            value={value || ''}
            onChange={onChange}
            placeholder={field.config?.placeholder || __('Enter content...', 'siteforge')}
        />
    </FieldWrapper>
);

/**
 * Number Field Control
 */
export const NumberField = ({ field, value, onChange }) => {
    const config = field.config || {};

    return (
        <FieldWrapper type="number">
            <TextControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={field.label}
                type="number"
                value={value !== undefined ? value : ''}
                onChange={(val) => onChange(val ? Number(val) : '')}
                min={config.min}
                max={config.max}
                step={config.step || 1}
                help={config.help || ''}
            />
        </FieldWrapper>
    );
};

/**
 * Range Field Control (slider)
 */
export const RangeField = ({ field, value, onChange }) => {
    const config = field.config || {};

    return (
        <FieldWrapper type="range">
            <RangeControl
                label={field.label}
                value={value ?? config.default ?? 50}
                onChange={onChange}
                min={config.min ?? 0}
                max={config.max ?? 100}
                step={config.step || 1}
                help={config.help || ''}
            />
        </FieldWrapper>
    );
};

/**
 * URL Field Control
 */
export const UrlField = ({ field, value, onChange }) => (
    <FieldWrapper type="url">
        <TextControl
            __next40pxDefaultSize
            __nextHasNoMarginBottom
            label={field.label}
            type="url"
            value={value || ''}
            onChange={onChange}
            placeholder={field.config?.placeholder || 'https://'}
            help={field.config?.help || ''}
        />
    </FieldWrapper>
);

/**
 * Email Field Control
 */
export const EmailField = ({ field, value, onChange }) => (
    <FieldWrapper type="email">
        <TextControl
            __next40pxDefaultSize
            __nextHasNoMarginBottom
            label={field.label}
            type="email"
            value={value || ''}
            onChange={onChange}
            placeholder={field.config?.placeholder || 'email@example.com'}
            help={field.config?.help || ''}
        />
    </FieldWrapper>
);

/**
 * Select Field Control
 */
export const SelectField = ({ field, value, onChange }) => {
    const choices = field.config?.choices || {};
    const options = Object.entries(choices).map(([key, label]) => ({
        value: key,
        label: label,
    }));

    return (
        <FieldWrapper type="select">
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={field.label}
                value={value || field.config?.default || ''}
                options={options}
                onChange={onChange}
                help={field.config?.help || ''}
            />
        </FieldWrapper>
    );
};

/**
 * Checkbox Field Control
 */
export const CheckboxField = ({ field, value, onChange }) => (
    <FieldWrapper type="checkbox">
        <CheckboxControl
            __nextHasNoMarginBottom
            label={field.label}
            checked={value || false}
            onChange={onChange}
            help={field.config?.help || ''}
        />
    </FieldWrapper>
);

/**
 * Toggle Field Control (alias pour checkbox avec style toggle)
 */
export const ToggleField = CheckboxField;

/**
 * Color Field Control
 */
export const ColorField = ({ field, value, onChange }) => (
    <FieldWrapper type="color">
        <FieldLabel label={field.label} help={field.config?.help} />
        <ColorPicker
            color={value || field.config?.default || '#000000'}
            onChangeComplete={(color) => onChange(color.hex)}
        />
    </FieldWrapper>
);

// ============================================================================
// COMPOSANTS DE CHAMPS MÉDIA
// ============================================================================

/**
 * Image Field Control
 */
export const ImageField = ({ field, value, onChange }) => {
    const returnValue = field.config?.return_value || 'url';
    const imageUrl = imageHelpers.getUrl(value);

    const onSelectImage = (media) => {
        onChange(imageHelpers.formatValue(media, returnValue));
    };

    return (
        <FieldWrapper type="image">
            <FieldLabel label={field.label} help={field.config?.help} />
            <MediaUploadCheck>
                <MediaUpload
                    onSelect={onSelectImage}
                    allowedTypes={['image']}
                    value={imageHelpers.getId(value)}
                    render={({ open }) => (
                        <div className="siteforge-image-field">
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt={field.label}
                                    className="siteforge-image-preview"
                                    style={{ maxWidth: '100%', height: 'auto', marginBottom: '8px' }}
                                />
                            )}
                            <div className="siteforge-image-buttons">
                                <Button variant="secondary" onClick={open}>
                                    {imageUrl
                                        ? __('Change Image', 'siteforge')
                                        : __('Select Image', 'siteforge')}
                                </Button>
                                {imageUrl && (
                                    <Button
                                        variant="link"
                                        isDestructive
                                        onClick={() => onChange('')}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        {__('Remove', 'siteforge')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                />
            </MediaUploadCheck>
        </FieldWrapper>
    );
};

/**
 * File Field Control (similaire à Image mais pour tous types de fichiers)
 */
export const FileField = ({ field, value, onChange }) => {
    const returnValue = field.config?.return_value || 'url';
    const fileUrl = imageHelpers.getUrl(value);
    const fileName = fileUrl ? fileUrl.split('/').pop() : '';

    const onSelectFile = (media) => {
        onChange(imageHelpers.formatValue(media, returnValue));
    };

    return (
        <FieldWrapper type="file">
            <FieldLabel label={field.label} help={field.config?.help} />
            <MediaUploadCheck>
                <MediaUpload
                    onSelect={onSelectFile}
                    allowedTypes={field.config?.allowed_types}
                    value={imageHelpers.getId(value)}
                    render={({ open }) => (
                        <div className="siteforge-file-field">
                            {fileUrl && (
                                <div className="siteforge-file-info" style={{ marginBottom: '8px' }}>
                                    <span>{fileName}</span>
                                </div>
                            )}
                            <div className="siteforge-file-buttons">
                                <Button variant="secondary" onClick={open}>
                                    {fileUrl
                                        ? __('Change File', 'siteforge')
                                        : __('Select File', 'siteforge')}
                                </Button>
                                {fileUrl && (
                                    <Button
                                        variant="link"
                                        isDestructive
                                        onClick={() => onChange('')}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        {__('Remove', 'siteforge')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                />
            </MediaUploadCheck>
        </FieldWrapper>
    );
};

// ============================================================================
// COMPOSANTS DE CHAMPS AVANCÉS
// ============================================================================

/**
 * Icon Field Control - Sélecteur d'icône Lucide avec grille et recherche
 */
export const IconField = ({ field, value, onChange }) => {
    const [icons, setIcons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Charger les icônes depuis l'API REST
    useEffect(() => {
        const loadIcons = async () => {
            try {
                const response = await apiFetch({ path: '/siteforge/v1/icons' });
                setIcons(response.icons || []);
            } catch (error) {
                console.error('[SiteForge] Error loading icons:', error);
                setIcons([]);
            }
            setIsLoading(false);
        };
        loadIcons();
    }, []);

    // Filtrer les icônes selon la recherche
    const filteredIcons = icons.filter((icon) =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // URL du sprite pour afficher les icônes
    const spriteUrl = window.siteforgeConfig?.spriteUrl || '';

    const config = field.config || {};

    return (
        <FieldWrapper type="icon">
            <FieldLabel label={field.label} help={config.help} />

            {/* Bouton pour ouvrir le sélecteur */}
            <div className="siteforge-icon-field">
                <div className="siteforge-icon-selected" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {value && spriteUrl && (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            style={{
                                display: 'inline-block',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: 2,
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                            }}
                            aria-hidden="true"
                        >
                            <use href={`${spriteUrl}#${value}`} />
                        </svg>
                    )}
                    <span style={{ color: value ? 'inherit' : '#757575' }}>
                        {value || __('Aucune icône sélectionnée', 'siteforge')}
                    </span>
                </div>

                <div className="siteforge-icon-buttons" style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? __('Fermer', 'siteforge') : __('Choisir une icône', 'siteforge')}
                    </Button>
                    {value && (
                        <Button variant="link" isDestructive onClick={() => onChange('')}>
                            {__('Supprimer', 'siteforge')}
                        </Button>
                    )}
                </div>

                {/* Panneau de sélection */}
                {isOpen && (
                    <div
                        className="siteforge-icon-picker"
                        style={{
                            marginTop: '12px',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                        }}
                    >
                        {/* Barre de recherche */}
                        <TextControl
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            placeholder={__('Rechercher une icône...', 'siteforge')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            style={{ marginBottom: '12px' }}
                        />

                        {/* Grille d'icônes */}
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <Spinner />
                            </div>
                        ) : (
                            <>
                                <div
                                    className="siteforge-icon-grid"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                                        gap: '4px',
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        padding: '4px',
                                    }}
                                >
                                    {filteredIcons.slice(0, 200).map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            title={icon}
                                            onClick={() => {
                                                onChange(icon);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '40px',
                                                height: '40px',
                                                padding: '8px',
                                                border: value === icon ? '2px solid #007cba' : '1px solid #ddd',
                                                borderRadius: '4px',
                                                backgroundColor: value === icon ? '#f0f7fc' : '#fff',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                e.currentTarget.style.borderColor = '#007cba';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = value === icon ? '#f0f7fc' : '#fff';
                                                e.currentTarget.style.borderColor = value === icon ? '#007cba' : '#ddd';
                                            }}
                                        >
                                            {spriteUrl ? (
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    style={{
                                                        fill: 'none',
                                                        stroke: 'currentColor',
                                                        strokeWidth: 2,
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                    }}
                                                    aria-hidden="true"
                                                >
                                                    <use href={`${spriteUrl}#${icon}`} />
                                                </svg>
                                            ) : (
                                                <span style={{ fontSize: '10px' }}>{icon.slice(0, 3)}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Compteur de résultats */}
                                <p style={{ marginTop: '8px', fontSize: '12px', color: '#757575' }}>
                                    {filteredIcons.length > 200
                                        ? `${__('Affichage des 200 premiers sur', 'siteforge')} ${filteredIcons.length} ${__('icônes', 'siteforge')}`
                                        : `${filteredIcons.length} ${__('icône(s) trouvée(s)', 'siteforge')}`}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
};

/**
 * Link Field Control - Champ de lien avancé
 * Modes: link (URL custom), page (recherche post), phone, email
 */
export const LinkField = ({ field, value, onChange }) => {
    const config = field.config || {};
    const availableModes = config.modes || ['link', 'page', 'phone', 'email'];
    const defaultMode = config.default_mode || availableModes[0];

    // Valeur par défaut
    const linkValue = value || {
        mode: defaultMode,
        label: '',
        url: '',
        postId: null,
        postTitle: '',
        phone: '',
        email: '',
        target: '_self',
    };

    // State pour la recherche de posts
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchInput, setSearchInput] = useState(linkValue.postTitle || '');

    // Mettre à jour une propriété du lien
    const updateLink = (key, val) => {
        onChange({ ...linkValue, [key]: val });
    };

    // Recherche de posts
    const searchPosts = async (search) => {
        if (!search || search.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Rechercher dans les posts et pages
            const postTypes = config.post_types || ['post', 'page'];
            const results = await apiFetch({
                path: `/wp/v2/search?search=${encodeURIComponent(search)}&type=post&subtype=${postTypes.join(',')}&per_page=10`,
            });

            setSearchResults(
                results.map((item) => ({
                    value: item.id,
                    label: `${item.title} (${item.subtype})`,
                    title: item.title,
                }))
            );
        } catch (error) {
            console.error('[SiteForge] Search error:', error);
            setSearchResults([]);
        }
        setIsSearching(false);
    };

    // Debounce pour la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            if (linkValue.mode === 'page') {
                searchPosts(searchInput);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, linkValue.mode]);

    // Labels des modes
    const modeLabels = {
        link: __('Lien', 'siteforge'),
        page: __('Page', 'siteforge'),
        phone: __('Téléphone', 'siteforge'),
        email: __('Email', 'siteforge'),
    };

    // Icons des modes
    const modeIcons = {
        link: '🔗',
        page: '📄',
        phone: '📞',
        email: '✉️',
    };

    return (
        <FieldWrapper type="link">
            <FieldLabel label={field.label} help={config.help} />

            {/* Sélecteur de mode */}
            <div className="siteforge-link-modes" style={{ marginBottom: '12px' }}>
                <ButtonGroup>
                    {availableModes.map((mode) => (
                        <Button
                            key={mode}
                            variant={linkValue.mode === mode ? 'primary' : 'secondary'}
                            onClick={() => updateLink('mode', mode)}
                            size="small"
                        >
                            {modeIcons[mode]} {modeLabels[mode]}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>

            {/* Champ Label (commun à tous les modes) */}
            <TextControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={__('Texte du lien', 'siteforge')}
                value={linkValue.label || ''}
                onChange={(val) => updateLink('label', val)}
                placeholder={__('Texte à afficher...', 'siteforge')}
            />

            {/* Champs spécifiques selon le mode */}
            {linkValue.mode === 'link' && (
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={__('URL', 'siteforge')}
                    type="url"
                    value={linkValue.url || ''}
                    onChange={(val) => updateLink('url', val)}
                    placeholder="https://..."
                />
            )}

            {linkValue.mode === 'page' && (
                <BaseControl label={__('Rechercher une page', 'siteforge')}>
                    <ComboboxControl
                        value={linkValue.postId}
                        onChange={(postId) => {
                            const selected = searchResults.find((r) => r.value === postId);
                            updateLink('postId', postId);
                            if (selected) {
                                updateLink('postTitle', selected.title);
                                // Pré-remplir le label si vide
                                if (!linkValue.label) {
                                    updateLink('label', selected.title);
                                }
                            }
                        }}
                        options={searchResults}
                        onFilterValueChange={(input) => setSearchInput(input)}
                        placeholder={__('Tapez pour rechercher...', 'siteforge')}
                    />
                    {isSearching && <Spinner />}
                    {linkValue.postId && linkValue.postTitle && (
                        <p style={{ marginTop: '4px', color: '#757575', fontSize: '12px' }}>
                            {__('Sélectionné:', 'siteforge')} <strong>{linkValue.postTitle}</strong> (ID: {linkValue.postId})
                        </p>
                    )}
                </BaseControl>
            )}

            {linkValue.mode === 'phone' && (
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={__('Numéro de téléphone', 'siteforge')}
                    type="tel"
                    value={linkValue.phone || ''}
                    onChange={(val) => updateLink('phone', val)}
                    placeholder="+33 1 23 45 67 89"
                />
            )}

            {linkValue.mode === 'email' && (
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={__('Adresse email', 'siteforge')}
                    type="email"
                    value={linkValue.email || ''}
                    onChange={(val) => updateLink('email', val)}
                    placeholder="contact@example.com"
                />
            )}

            {/* Target (pour tous les modes sauf phone/email) */}
            {(linkValue.mode === 'link' || linkValue.mode === 'page') && (
                <SelectControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={__('Ouvrir dans', 'siteforge')}
                    value={linkValue.target || '_self'}
                    options={[
                        { value: '_self', label: __('Même fenêtre', 'siteforge') },
                        { value: '_blank', label: __('Nouvel onglet', 'siteforge') },
                    ]}
                    onChange={(val) => updateLink('target', val)}
                />
            )}
        </FieldWrapper>
    );
};

/**
 * Button Field Control - Combine Link + Icon + Style
 * Structure: { link: {...}, icon: '', iconPosition: 'after', style: 'btn-primary' }
 */
export const ButtonField = ({ field, value, onChange }) => {
    const config = field.config || {};

    // State pour les styles de boutons
    const [buttonStyles, setButtonStyles] = useState([]);
    const [stylesData, setStylesData] = useState([]);
    const [isLoadingStyles, setIsLoadingStyles] = useState(true);

    // Valeur par défaut
    const buttonValue = value || {
        link: {
            mode: config.default_mode || 'link',
            label: '',
            url: '',
            postId: null,
            postTitle: '',
            phone: '',
            email: '',
            target: '_self',
        },
        icon: '',
        iconPosition: 'after',
        style: 'btn-primary',
    };

    // Charger les styles de boutons depuis l'API
    useEffect(() => {
        const loadStyles = async () => {
            try {
                const response = await apiFetch({ path: '/siteforge/v1/button-styles' });
                const styles = Array.isArray(response) ? response : [];

                setStylesData(styles);
                setButtonStyles(
                    styles.map((style) => ({
                        value: style.name,
                        label: style.label || style.name.replace('btn-', ''),
                    }))
                );
            } catch (error) {
                console.error('[SiteForge] Error loading button styles:', error);
                setButtonStyles([{ value: 'btn-primary', label: 'Primaire' }]);
                setStylesData([]);
            }
            setIsLoadingStyles(false);
        };
        loadStyles();
    }, []);

    // Récupérer les variables d'un style
    const getStyleVariables = (styleName) => {
        const style = stylesData.find((s) => s.name === styleName);
        return style?.variables || {};
    };

    // Vérifier si les icônes sont activées pour ce style
    const areIconsEnabled = () => {
        const vars = getStyleVariables(buttonValue.style);
        return vars.icon !== 'false';
    };

    // Vérifier si le changement de position est activé
    const isIconMoveEnabled = () => {
        const vars = getStyleVariables(buttonValue.style);
        return vars['icon-move'] !== 'false';
    };

    // Récupérer la position d'icône par défaut
    const getDefaultIconPosition = () => {
        const vars = getStyleVariables(buttonValue.style);
        return vars['icon-position'] || 'after';
    };

    // Récupérer l'icône par défaut
    const getDefaultIcon = () => {
        const vars = getStyleVariables(buttonValue.style);
        return vars['icon-default'] || '';
    };

    // Mettre à jour une propriété
    const updateButton = (key, val) => {
        onChange({ ...buttonValue, [key]: val });
    };

    // Mettre à jour le lien
    const updateLink = (linkVal) => {
        onChange({ ...buttonValue, link: linkVal });
    };

    // Quand le style change, appliquer les valeurs par défaut
    const handleStyleChange = (newStyle) => {
        const vars = stylesData.find((s) => s.name === newStyle)?.variables || {};
        const updates = { ...buttonValue, style: newStyle };

        // Appliquer la position par défaut si définie
        if (vars['icon-position']) {
            updates.iconPosition = vars['icon-position'];
        }

        // Appliquer l'icône par défaut si définie et pas d'icône actuelle
        if (vars['icon-default'] && !buttonValue.icon) {
            updates.icon = vars['icon-default'];
        }

        onChange(updates);
    };

    // URL du sprite Lucide
    const spriteUrl = window.siteforgeConfig?.spriteUrl || '';

    return (
        <FieldWrapper type="button">
            <FieldLabel label={field.label} help={config.help} />

            {/* Sélecteur de style */}
            <div style={{ marginBottom: '16px' }}>
                {isLoadingStyles ? (
                    <Spinner />
                ) : (
                    <SelectControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        label={__('Style du bouton', 'siteforge')}
                        value={buttonValue.style}
                        options={buttonStyles}
                        onChange={handleStyleChange}
                    />
                )}
            </div>

            {/* Champs du lien (via LinkField inline) */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <LinkField
                    field={{
                        ...field,
                        label: __('Lien', 'siteforge'),
                        config: {
                            ...config,
                            modes: config.modes || ['link', 'page', 'phone', 'email'],
                        },
                    }}
                    value={buttonValue.link}
                    onChange={updateLink}
                />
            </div>

            {/* Icône (si activée) */}
            {areIconsEnabled() && (
                <div style={{ marginBottom: '16px' }}>
                    <FieldLabel label={__('Icône', 'siteforge')} />

                    {/* Affichage de l'icône actuelle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {buttonValue.icon && spriteUrl && (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                style={{
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    strokeWidth: 2,
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                }}
                            >
                                <use href={`${spriteUrl}#${buttonValue.icon}`} />
                            </svg>
                        )}
                        <span style={{ color: buttonValue.icon ? 'inherit' : '#757575' }}>
                            {buttonValue.icon || __('Aucune icône', 'siteforge')}
                        </span>
                        {buttonValue.icon && (
                            <Button
                                variant="link"
                                isDestructive
                                onClick={() => updateButton('icon', '')}
                                size="small"
                            >
                                {__('Supprimer', 'siteforge')}
                            </Button>
                        )}
                    </div>

                    {/* Sélecteur d'icône simplifié - utilise IconField */}
                    <IconField
                        field={{ ...field, label: '', config: {} }}
                        value={buttonValue.icon}
                        onChange={(iconVal) => updateButton('icon', iconVal)}
                    />

                    {/* Position de l'icône */}
                    {buttonValue.icon && isIconMoveEnabled() && (
                        <div style={{ marginTop: '12px' }}>
                            <FieldLabel label={__('Position de l\'icône', 'siteforge')} />
                            <ButtonGroup>
                                <Button
                                    variant={buttonValue.iconPosition === 'before' ? 'primary' : 'secondary'}
                                    onClick={() => updateButton('iconPosition', 'before')}
                                    size="small"
                                >
                                    {__('Avant', 'siteforge')}
                                </Button>
                                <Button
                                    variant={buttonValue.iconPosition === 'after' ? 'primary' : 'secondary'}
                                    onClick={() => updateButton('iconPosition', 'after')}
                                    size="small"
                                >
                                    {__('Après', 'siteforge')}
                                </Button>
                            </ButtonGroup>
                        </div>
                    )}
                </div>
            )}

            {/* Message si icônes désactivées */}
            {!areIconsEnabled() && (
                <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
                    {__('Les icônes sont désactivées pour ce style de bouton.', 'siteforge')}
                </p>
            )}
        </FieldWrapper>
    );
};

// ============================================================================
// COMPOSANTS DE CHAMPS COMPLEXES
// ============================================================================

/**
 * Repeater Field Control
 */
export const RepeaterField = ({ field, value, onChange }) => {
    const items = Array.isArray(value) ? value : [];
    const config = field.config || {};
    // Support both 'fields' (from block.json) and 'sub_fields' (legacy)
    const subFields = config.fields || config.sub_fields;

    // Handlers utilisant arrayHelpers
    const addItem = () => {
        const newItem = createRepeaterItemDefaults(subFields);
        onChange(arrayHelpers.add(items, newItem));
    };

    const removeItem = (index) => {
        onChange(arrayHelpers.remove(items, index));
    };

    const moveItem = (fromIndex, toIndex) => {
        onChange(arrayHelpers.move(items, fromIndex, toIndex));
    };

    const updateItem = (index, itemValue) => {
        onChange(arrayHelpers.update(items, index, itemValue));
    };

    return (
        <FieldWrapper type="repeater">
            <FieldLabel label={field.label} help={config.help} />

            <div className="siteforge-repeater-items">
                {items.map((item, index) => (
                    <div key={index} className="siteforge-repeater-item">
                        <div className="siteforge-repeater-item-header">
                            <span className="siteforge-repeater-item-title">
                                {__('Item', 'siteforge')} {index + 1}
                            </span>
                            <div className="siteforge-repeater-item-actions">
                                {index > 0 && (
                                    <Button
                                        variant="tertiary"
                                        icon="arrow-up-alt2"
                                        onClick={() => moveItem(index, index - 1)}
                                        label={__('Move up', 'siteforge')}
                                        size="small"
                                    />
                                )}
                                {index < items.length - 1 && (
                                    <Button
                                        variant="tertiary"
                                        icon="arrow-down-alt2"
                                        onClick={() => moveItem(index, index + 1)}
                                        label={__('Move down', 'siteforge')}
                                        size="small"
                                    />
                                )}
                                <Button
                                    variant="tertiary"
                                    isDestructive
                                    icon="trash"
                                    onClick={() => removeItem(index)}
                                    label={__('Remove', 'siteforge')}
                                    size="small"
                                />
                            </div>
                        </div>

                        <div className="siteforge-repeater-item-fields">
                            {renderSubFields(subFields, item, (subName, subValue) => {
                                updateItem(index, { ...item, [subName]: subValue });
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <Button
                variant="secondary"
                onClick={addItem}
                className="siteforge-repeater-add"
            >
                {config.button_label || __('Add Item', 'siteforge')}
            </Button>
        </FieldWrapper>
    );
};

/**
 * Group Field Control
 */
export const GroupField = ({ field, value, onChange }) => {
    const groupValue = value || {};
    const config = field.config || {};
    // Support both 'fields' (from block.json) and 'sub_fields' (legacy)
    const subFields = config.fields || config.sub_fields;

    return (
        <FieldWrapper type="group">
            <FieldLabel label={field.label} help={config.help} />

            <div className="siteforge-group-fields">
                {renderSubFields(subFields, groupValue, (subName, subValue) => {
                    onChange({ ...groupValue, [subName]: subValue });
                })}
            </div>
        </FieldWrapper>
    );
};

// ============================================================================
// INITIALISATION DU MAPPING CENTRALISÉ
// ============================================================================

FieldControlsMap = {
    text: TextField,
    textarea: TextareaField,
    wysiwyg: WysiwygField,
    image: ImageField,
    file: FileField,
    select: SelectField,
    checkbox: CheckboxField,
    toggle: ToggleField,
    link: LinkField,
    icon: IconField,
    button: ButtonField,
    repeater: RepeaterField,
    group: GroupField,
    number: NumberField,
    range: RangeField,
    url: UrlField,
    email: EmailField,
    color: ColorField,
};

// Export du mapping
export const FieldControls = FieldControlsMap;

// Export des composants utilitaires pour réutilisation externe
export { FieldWrapper, FieldLabel, renderSubFields };

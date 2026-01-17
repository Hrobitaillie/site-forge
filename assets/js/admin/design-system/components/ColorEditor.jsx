/**
 * Color Editor Component
 *
 * Main editor for managing design system colors.
 * Displays all colors with their shades and allows adding/editing/removing.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Modal, TextControl } from '@wordpress/components';
import { plus, trash } from '@wordpress/icons';

import ColorCard from './ColorCard';
import ColorPicker from './ColorPicker';
import {
    generateShades,
    getDefaultColor,
    sanitizeColorName,
    validateColorName,
    shouldHaveShades,
} from '../utils/oklch';
import { svgStringToElement } from '../utils/utils';

export default function ColorEditor({ colors, onChange }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorBase, setNewColorBase] = useState(getDefaultColor());
    const [newColorWithShades, setNewColorWithShades] = useState(true);
    const [nameError, setNameError] = useState('');

    // Handle adding a new color
    const handleAddColor = () => {
        const sanitized = sanitizeColorName(newColorName);

        // Validate name
        if (!sanitized) {
            setNameError(__('Le nom est requis.', 'siteforge'));
            return;
        }

        if (!validateColorName(sanitized)) {
            setNameError(__('Le nom doit commencer par une lettre et ne contenir que des lettres, chiffres et tirets.', 'siteforge'));
            return;
        }

        if (colors[sanitized]) {
            setNameError(__('Ce nom existe déjà.', 'siteforge'));
            return;
        }

        // Create new color
        const newColor = {
            base: newColorBase,
        };

        // Add shades if needed
        if (newColorWithShades && shouldHaveShades(sanitized)) {
            newColor.shades = generateShades(newColorBase);
        }

        // Update colors
        const updatedColors = {
            ...colors,
            [sanitized]: newColor,
        };

        onChange(updatedColors);

        // Reset modal state
        setIsAddModalOpen(false);
        setNewColorName('');
        setNewColorBase(getDefaultColor());
        setNewColorWithShades(true);
        setNameError('');
    };

    // Handle deleting a color
    const handleDeleteColor = (colorName) => {
        if (!confirm(__('Supprimer cette couleur ?', 'siteforge'))) {
            return;
        }

        const updatedColors = { ...colors };
        delete updatedColors[colorName];
        onChange(updatedColors);
    };

    // Handle renaming a color
    const handleRenameColor = (oldName, newName) => {
        const sanitized = sanitizeColorName(newName);

        if (!sanitized || !validateColorName(sanitized)) {
            return false;
        }

        if (sanitized !== oldName && colors[sanitized]) {
            return false;
        }

        if (sanitized === oldName) {
            return true;
        }

        // Create new colors object with renamed key
        const updatedColors = {};
        for (const [key, value] of Object.entries(colors)) {
            if (key === oldName) {
                updatedColors[sanitized] = value;
            } else {
                updatedColors[key] = value;
            }
        }

        onChange(updatedColors);
        return true;
    };

    // Handle updating a color's base
    const handleUpdateColorBase = (colorName, newBase) => {
        const color = colors[colorName];
        if (!color) return;

        const updatedColor = {
            ...color,
            base: newBase,
        };

        // Regenerate shades if this color has shades
        if (color.shades && shouldHaveShades(colorName)) {
            updatedColor.shades = generateShades(newBase);
        }

        onChange({
            ...colors,
            [colorName]: updatedColor,
        });
    };

    // Handle updating a specific shade
    const handleUpdateShade = (colorName, shade, value) => {
        const color = colors[colorName];
        if (!color || !color.shades) return;

        onChange({
            ...colors,
            [colorName]: {
                ...color,
                shades: {
                    ...color.shades,
                    [shade]: value,
                },
            },
        });
    };

    // Handle regenerating shades from current base
    const handleRegenerateShades = (colorName) => {
        const color = colors[colorName];
        if (!color) return;

        const newShades = generateShades(color.base);

        onChange({
            ...colors,
            [colorName]: {
                ...color,
                shades: newShades,
            },
        });
    };

    // Handle toggling shades for a color
    const handleToggleShades = (colorName) => {
        const color = colors[colorName];
        if (!color) return;

        if (color.shades) {
            // Remove shades
            const { shades, ...rest } = color;
            onChange({
                ...colors,
                [colorName]: rest,
            });
        } else {
            // Add shades
            onChange({
                ...colors,
                [colorName]: {
                    ...color,
                    shades: generateShades(color.base),
                },
            });
        }
    };

    const colorEntries = Object.entries(colors);

    return (
        <div className="siteforge-color-editor">
            {/* Color list */}
            <div className="siteforge-color-list">
                {colorEntries.length === 0 ? (
                    <div className="siteforge-color-empty">
                        <p>{__('Aucune couleur définie.', 'siteforge')}</p>
                        <p>{__('Cliquez sur "Ajouter une couleur" pour commencer.', 'siteforge')}</p>
                    </div>
                ) : (
                    colorEntries.map(([name, color]) => (
                        <ColorCard
                            key={name}
                            name={name}
                            color={color}
                            onDelete={() => handleDeleteColor(name)}
                            onRename={(newName) => handleRenameColor(name, newName)}
                            onUpdateBase={(base) => handleUpdateColorBase(name, base)}
                            onUpdateShade={(shade, value) => handleUpdateShade(name, shade, value)}
                            onRegenerateShades={() => handleRegenerateShades(name)}
                            onToggleShades={() => handleToggleShades(name)}
                        />
                    ))
                )}
            </div>

            {/* Add color button */}
            <div className="siteforge-color-actions">
                <Button
                    variant="secondary"
                    icon={svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-plus-icon lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>')}
                    onClick={() => setIsAddModalOpen(true)}
                >
                    {__('Ajouter une couleur', 'siteforge')}
                </Button>
            </div>

            {/* Add color modal */}
            {isAddModalOpen && (
                <Modal
                    title={__('Nouvelle couleur', 'siteforge')}
                    onRequestClose={() => {
                        setIsAddModalOpen(false);
                        setNameError('');
                    }}
                    className="siteforge-add-color-modal"
                >
                    <div className="siteforge-modal-content">
                        <TextControl
                            label={__('Nom de la couleur', 'siteforge')}
                            value={newColorName}
                            onChange={(value) => {
                                setNewColorName(value);
                                setNameError('');
                            }}
                            placeholder="primary, secondary, accent..."
                            help={nameError || __('Lettres minuscules, chiffres et tirets uniquement.', 'siteforge')}
                            className={nameError ? 'has-error' : ''}
                        />

                        <div className="siteforge-color-picker-field">
                            <label>{__('Couleur de base', 'siteforge')}</label>
                            <ColorPicker
                                value={newColorBase}
                                onChange={setNewColorBase}
                            />
                        </div>

                        <div className="siteforge-checkbox-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newColorWithShades}
                                    onChange={(e) => setNewColorWithShades(e.target.checked)}
                                />
                                {__('Générer les teintes (50-950)', 'siteforge')}
                            </label>
                            <p className="siteforge-field-help">
                                {__('Les couleurs utilitaires (success, warning, error) n\'ont pas de teintes.', 'siteforge')}
                            </p>
                        </div>

                        <div className="siteforge-modal-actions">
                            <Button
                                variant="tertiary"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNameError('');
                                }}
                            >
                                {__('Annuler', 'siteforge')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddColor}
                            >
                                {__('Ajouter', 'siteforge')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

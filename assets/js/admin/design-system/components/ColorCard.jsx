/**
 * Color Card Component
 *
 * Displays a single color with its base and all shades.
 * Allows editing the name, base color, and individual shades.
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical, trash, rotateRight, seen, unseen } from '@wordpress/icons';

import ColorPicker from './ColorPicker';
import { oklchToHex, getShadeLevels, shouldHaveShades } from '../utils/oklch';
import { svgStringToElement } from '../utils/utils';

export default function ColorCard({
    name,
    color,
    onDelete,
    onRename,
    onUpdateBase,
    onUpdateShade,
    onRegenerateShades,
    onToggleShades,
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(name);
    const [selectedShade, setSelectedShade] = useState(null);
    const nameInputRef = useRef(null);

    // Focus name input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    // Handle name edit submit
    const handleNameSubmit = () => {
        if (editedName.trim() && editedName !== name) {
            const success = onRename(editedName);
            if (!success) {
                setEditedName(name);
            }
        } else {
            setEditedName(name);
        }
        setIsEditingName(false);
    };

    // Handle name input key press
    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setEditedName(name);
            setIsEditingName(false);
        }
    };

    const hasShades = !!color.shades;
    const shadeLevels = getShadeLevels();
    const canHaveShades = shouldHaveShades(name);

    return (
        <div className="siteforge-color-card">
            {/* Header with name and actions */}
            <div className="siteforge-color-card-header">
                <div className="siteforge-color-name">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleNameSubmit}
                            onKeyDown={handleNameKeyDown}
                            className="siteforge-color-name-input"
                        />
                    ) : (
                        <button
                            type="button"
                            className="siteforge-color-name-button"
                            onClick={() => setIsEditingName(true)}
                            title={__('Cliquer pour modifier', 'siteforge')}
                        >
                            {name}
                        </button>
                    )}
                </div>

                <div className="siteforge-color-card-actions">
                    <Dropdown
                        popoverProps={{ placement: 'bottom-end' }}
                        renderToggle={({ isOpen, onToggle }) => (
                            <Button
                                icon={svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-plus-icon lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>')}
                                onClick={onToggle}
                                aria-expanded={isOpen}
                                label={__('Options', 'siteforge')}
                            />
                        )}
                        renderContent={({ onClose }) => (
                            <MenuGroup>
                                {canHaveShades && (
                                    <>
                                        <MenuItem
                                            icon={hasShades ? 
                                                svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>') : 
                                                svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off-icon lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>')}
                                            onClick={() => {
                                                onToggleShades();
                                                onClose();
                                            }}
                                        >
                                            {hasShades
                                                ? __('Retirer les teintes', 'siteforge')
                                                : __('Ajouter les teintes', 'siteforge')}
                                        </MenuItem>
                                        {hasShades && (
                                            <MenuItem
                                                icon={svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw-icon lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>')}
                                                onClick={() => {
                                                    onRegenerateShades();
                                                    onClose();
                                                }}
                                            >
                                                {__('Régénérer les teintes', 'siteforge')}
                                            </MenuItem>
                                        )}
                                    </>
                                )}
                                <MenuItem
                                    icon={svgStringToElement('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>')}
                                    isDestructive
                                    onClick={() => {
                                        onDelete();
                                        onClose();
                                    }}
                                >
                                    {__('Supprimer', 'siteforge')}
                                </MenuItem>
                            </MenuGroup>
                        )}
                    />
                </div>
            </div>

            {/* Color swatches */}
            <div className="siteforge-color-swatches">
                {/* Base color (500) */}
                <div className="siteforge-color-swatch-group siteforge-color-base-group">
                    <ColorSwatch
                        color={color.base}
                        label={hasShades ? '500' : __('Base', 'siteforge')}
                        isBase
                        isSelected={selectedShade === 'base'}
                        onSelect={() => setSelectedShade(selectedShade === 'base' ? null : 'base')}
                    />

                    {selectedShade === 'base' && (
                        <div className="siteforge-color-picker-popover">
                            <ColorPicker
                                value={color.base}
                                onChange={(newValue) => onUpdateBase(newValue)}
                            />
                        </div>
                    )}
                </div>

                {/* Shades */}
                {hasShades && (
                    <div className="siteforge-color-shades">
                        {shadeLevels.map((level) => {
                            const shadeValue = color.shades[level];
                            if (!shadeValue) return null;

                            return (
                                <div key={level} className="siteforge-color-swatch-group">
                                    <ColorSwatch
                                        color={shadeValue}
                                        label={String(level)}
                                        isSelected={selectedShade === level}
                                        onSelect={() => setSelectedShade(selectedShade === level ? null : level)}
                                    />

                                    {selectedShade === level && (
                                        <div className="siteforge-color-picker-popover">
                                            <ColorPicker
                                                value={shadeValue}
                                                onChange={(newValue) => onUpdateShade(level, newValue)}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Close picker when clicking outside */}
            {selectedShade !== null && (
                <div
                    className="siteforge-color-picker-overlay"
                    onClick={() => setSelectedShade(null)}
                />
            )}
        </div>
    );
}

/**
 * Color Swatch Component
 */
function ColorSwatch({ color, label, isBase, isSelected, onSelect }) {
    const hexColor = oklchToHex(color);
    const isLight = isColorLight(hexColor);

    return (
        <button
            type="button"
            className={`siteforge-color-swatch ${isBase ? 'is-base' : ''} ${isSelected ? 'is-selected' : ''}`}
            style={{ backgroundColor: hexColor }}
            onClick={onSelect}
            title={`${label}: ${color}`}
        >
            <span
                className="siteforge-swatch-label"
                style={{ color: isLight ? '#000' : '#fff' }}
            >
                {label}
            </span>
        </button>
    );
}

/**
 * Check if a hex color is light
 */
function isColorLight(hex) {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

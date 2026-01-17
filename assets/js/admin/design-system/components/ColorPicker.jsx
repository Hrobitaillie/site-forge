/**
 * Color Picker Component
 *
 * Provides a hex color input with automatic OKLCH conversion.
 * Uses native color picker for ease of use.
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

import { oklchToHex, hexToOklch, parseOklch } from '../utils/oklch';

export default function ColorPicker({ value, onChange }) {
    const [hexValue, setHexValue] = useState(() => oklchToHex(value));
    const [oklchValue, setOklchValue] = useState(value);

    // Update hex when value prop changes
    useEffect(() => {
        setHexValue(oklchToHex(value));
        setOklchValue(value);
    }, [value]);

    // Handle native color picker change
    const handleColorInputChange = (e) => {
        const newHex = e.target.value;
        setHexValue(newHex);

        const newOklch = hexToOklch(newHex);
        setOklchValue(newOklch);
        onChange(newOklch);
    };

    // Handle hex text input change
    const handleHexTextChange = (newHex) => {
        // Allow partial input while typing
        setHexValue(newHex);

        // Only convert if it looks like a valid hex
        const cleanHex = newHex.replace(/^#/, '');
        if (cleanHex.length === 3 || cleanHex.length === 6) {
            if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
                const newOklch = hexToOklch(cleanHex);
                setOklchValue(newOklch);
                onChange(newOklch);
            }
        }
    };

    // Handle OKLCH text input change
    const handleOklchTextChange = (newOklch) => {
        setOklchValue(newOklch);

        // Validate and update if valid
        const parsed = parseOklch(newOklch);
        if (parsed) {
            setHexValue(oklchToHex(newOklch));
            onChange(newOklch);
        }
    };

    return (
        <div className="siteforge-color-picker">
            {/* Native color input */}
            <div className="siteforge-color-picker-native">
                <input
                    type="color"
                    value={hexValue}
                    onChange={handleColorInputChange}
                    className="siteforge-color-input"
                />
                <div
                    className="siteforge-color-preview"
                    style={{ backgroundColor: hexValue }}
                />
            </div>

            {/* Text inputs */}
            <div className="siteforge-color-picker-fields">
                <TextControl
                    label={__('Hex', 'siteforge')}
                    value={hexValue}
                    onChange={handleHexTextChange}
                    className="siteforge-color-hex-input"
                />

                <TextControl
                    label={__('OKLCH', 'siteforge')}
                    value={oklchValue}
                    onChange={handleOklchTextChange}
                    className="siteforge-color-oklch-input"
                    help={__('Format: oklch(L C H)', 'siteforge')}
                />
            </div>
        </div>
    );
}

/**
 * Design System Editor App
 *
 * Main application component with sidebar navigation and content area.
 * Styled to match WordPress Full Site Editor look.
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
    Button,
    Spinner,
    Notice,
} from '@wordpress/components';

import Sidebar from './components/Sidebar';
import ColorEditor from './components/ColorEditor';

const PAGES = {
    colors: {
        label: __('Couleurs', 'siteforge'),
        icon: 'admin-appearance',
    },
    // Future pages can be added here:
    // typography: { label: __('Typographie', 'siteforge'), icon: 'editor-textcolor' },
    // spacing: { label: __('Espacement', 'siteforge'), icon: 'editor-expand' },
};

export default function App() {
    const [currentPage, setCurrentPage] = useState('colors');
    const [colors, setColors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Load colors on mount
    useEffect(() => {
        loadColors();
    }, []);

    // Load colors from API
    const loadColors = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch({
                path: '/siteforge/v1/design-system/colors',
            });

            if (response.success) {
                setColors(response.colors || {});
            } else {
                setError(__('Erreur lors du chargement des couleurs.', 'siteforge'));
            }
        } catch (err) {
            setError(err.message || __('Erreur de connexion.', 'siteforge'));
        } finally {
            setLoading(false);
        }
    };

    // Save colors to API
    const saveColors = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await apiFetch({
                path: '/siteforge/v1/design-system/colors',
                method: 'POST',
                data: { colors },
            });

            if (response.success) {
                setSuccess(response.message);
                setHasChanges(false);
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(response.message || __('Erreur lors de la sauvegarde.', 'siteforge'));
            }
        } catch (err) {
            setError(err.message || __('Erreur de connexion.', 'siteforge'));
        } finally {
            setSaving(false);
        }
    };

    // Reset all colors
    const resetColors = async () => {
        if (!confirm(__('Supprimer toutes les couleurs ? Cette action est irréversible.', 'siteforge'))) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await apiFetch({
                path: '/siteforge/v1/design-system/reset-colors',
                method: 'POST',
            });

            if (response.success) {
                setColors({});
                setSuccess(response.message);
                setHasChanges(false);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle color changes
    const handleColorsChange = (newColors) => {
        setColors(newColors);
        setHasChanges(true);
    };

    // Render current page content
    const renderContent = () => {
        if (loading) {
            return (
                <div className="siteforge-loading-container">
                    <Spinner />
                    <p>{__('Chargement...', 'siteforge')}</p>
                </div>
            );
        }

        switch (currentPage) {
            case 'colors':
                return (
                    <ColorEditor
                        colors={colors}
                        onChange={handleColorsChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="siteforge-admin-layout">
            {/* Sidebar */}
            <Sidebar
                pages={PAGES}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />

            {/* Main content */}
            <div className="siteforge-admin-main">
                {/* Header */}
                <header className="siteforge-admin-header">
                    <div className="siteforge-admin-header-left">
                        <h1>{PAGES[currentPage]?.label || __('Design System', 'siteforge')}</h1>
                        {hasChanges && (
                            <span className="siteforge-unsaved-badge">
                                {__('Non sauvegardé', 'siteforge')}
                            </span>
                        )}
                    </div>

                    <div className="siteforge-admin-header-actions">
                        <Button
                            variant="tertiary"
                            onClick={resetColors}
                            disabled={saving || Object.keys(colors).length === 0}
                        >
                            {__('Reset', 'siteforge')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={saveColors}
                            disabled={saving || !hasChanges}
                            isBusy={saving}
                        >
                            {saving ? __('Sauvegarde...', 'siteforge') : __('Sauvegarder', 'siteforge')}
                        </Button>
                    </div>
                </header>

                {/* Notices */}
                {error && (
                    <Notice
                        status="error"
                        onRemove={() => setError(null)}
                        className="siteforge-notice"
                    >
                        {error}
                    </Notice>
                )}

                {success && (
                    <Notice
                        status="success"
                        onRemove={() => setSuccess(null)}
                        className="siteforge-notice"
                    >
                        {success}
                    </Notice>
                )}

                {/* Content */}
                <div className="siteforge-admin-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

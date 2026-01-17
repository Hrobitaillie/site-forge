/**
 * Sidebar Navigation Component
 *
 * FSE-style sidebar with navigation items for different design system sections.
 */

import { __ } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';
import { color, typography, layout } from '@wordpress/icons';
import { svgStringToElement } from '../utils/utils';

// Map page keys to icons
const PAGE_ICONS = {
    colors: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette-icon lucide-palette"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    typography: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-case-sensitive-icon lucide-case-sensitive"><path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"/><path d="M22 9v7"/><path d="M3.304 13h6.392"/><circle cx="18.5" cy="12.5" r="3.5"/></svg>',
    spacing: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-top-bottom-dashed-icon lucide-panel-top-bottom-dashed"><path d="M14 15h1"/><path d="M14 9h1"/><path d="M19 15h2"/><path d="M19 9h2"/><path d="M3 15h2"/><path d="M3 9h2"/><path d="M9 15h1"/><path d="M9 9h1"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
};

export default function Sidebar({ pages, currentPage, onNavigate }) {
    return (
        <aside className="siteforge-admin-sidebar">
            {/* Logo / Title */}
            <div className="siteforge-sidebar-header">
                <div className="siteforge-sidebar-logo">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <circle cx="8" cy="8" r="2" fill="currentColor" />
                        <circle cx="16" cy="8" r="2" fill="currentColor" />
                        <circle cx="8" cy="16" r="2" fill="currentColor" />
                        <circle cx="16" cy="16" r="2" fill="currentColor" />
                    </svg>
                </div>
                <span className="siteforge-sidebar-title">
                    {__('Design System', 'siteforge')}
                </span>
            </div>

            {/* Navigation */}
            <nav className="siteforge-sidebar-nav">
                <ul>
                    {Object.entries(pages).map(([key, page]) => (
                        <li key={key}>
                            <button
                                className={`siteforge-sidebar-item ${currentPage === key ? 'is-active' : ''}`}
                                onClick={() => onNavigate(key)}
                                type="button"
                            >
                                {PAGE_ICONS[key] && (
                                    <Icon icon={ svgStringToElement( PAGE_ICONS[key] ) } size={20} />
                                )}
                                <span>{page.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="siteforge-sidebar-footer">
                <p className="siteforge-sidebar-theme">
                    {window.siteforgeDesignSystem?.themeName || 'Theme'}
                </p>
            </div>
        </aside>
    );
}

/**
 * Design System Admin Entry Point
 *
 * Initializes the React application for the Design System admin page.
 */

import { createRoot } from '@wordpress/element';
import App from './App';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('siteforge-design-system-app');

    if (container) {
        const root = createRoot(container);
        root.render(<App />);
    }
});

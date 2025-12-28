/**
 * Register SiteForge Blocks
 * Enregistre automatiquement tous les blocs découverts avec leurs field controls
 */

import { registerBlockType } from '@wordpress/blocks';
import { createElement, Fragment, useRef, useEffect, useState, createPortal } from '@wordpress/element';
import { createFieldControls } from './field-control-factory';
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';
import { ServerSideRender } from '@wordpress/server-side-render';

/**
 * Composant InnerBlocks qui se monte dans un placeholder du DOM
 */
const InnerBlocksPortal = ({ container, allowedBlocks, template, templateLock }) => {
    if (!container) return null;

    return createPortal(
        createElement(InnerBlocks, {
            allowedBlocks: allowedBlocks,
            template: template,
            templateLock: templateLock,
        }),
        container
    );
};

/**
 * Composant Edit générique pour tous les blocs SiteForge avec ServerSideRender
 */
const SiteForgeBlockEdit = ({ attributes, setAttributes, blockName, clientId }) => {
    const wrapperRef = useRef(null);
    const [innerBlocksContainer, setInnerBlocksContainer] = useState(null);
    const [innerBlocksConfig, setInnerBlocksConfig] = useState(null);

    // Créer les field controls automatiquement pour la sidebar
    const controls = createFieldControls(blockName, attributes, setAttributes);

    // Use block props pour les wrappers Gutenberg
    const blockProps = useBlockProps({
        className: 'siteforge-block-editor-wrapper',
        ref: wrapperRef,
    });

    // Observer le DOM pour détecter les placeholders <div class="sf-inner-blocks">
    useEffect(() => {
        if (!wrapperRef.current) return;

        // Helper pour décoder les entités HTML
        const decodeHtml = (html) => {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        };

        const observer = new MutationObserver(() => {
            const placeholder = wrapperRef.current.querySelector('.sf-inner-blocks');
            if (placeholder && placeholder !== innerBlocksContainer) {
                // Lire la config depuis les data-attributes
                let allowedBlocks, template;
                try {
                    const allowedRaw = placeholder.getAttribute('data-allowed-blocks');
                    const templateRaw = placeholder.getAttribute('data-template');
                    allowedBlocks = allowedRaw ? JSON.parse(decodeHtml(allowedRaw)) : undefined;
                    template = templateRaw ? JSON.parse(decodeHtml(templateRaw)) : undefined;
                } catch (e) {
                    console.error('[SiteForge] Error parsing InnerBlocks config:', e);
                }

                const config = {
                    allowedBlocks,
                    template,
                    templateLock: placeholder.dataset.templateLock === 'false'
                        ? false
                        : placeholder.dataset.templateLock || false,
                };
                // Marquer le placeholder comme traité pour éviter les doublons
                if (!placeholder.dataset.processed) {
                    placeholder.dataset.processed = 'true';
                    setInnerBlocksConfig(config);
                    setInnerBlocksContainer(placeholder);
                }
            }
        });

        observer.observe(wrapperRef.current, {
            childList: true,
            subtree: true,
        });

        // Check immédiat au cas où le SSR est déjà rendu
        const placeholder = wrapperRef.current.querySelector('.sf-inner-blocks');
        if (placeholder) {
            let allowedBlocks, template;
            try {
                const allowedRaw = placeholder.getAttribute('data-allowed-blocks');
                const templateRaw = placeholder.getAttribute('data-template');
                allowedBlocks = allowedRaw ? JSON.parse(decodeHtml(allowedRaw)) : undefined;
                template = templateRaw ? JSON.parse(decodeHtml(templateRaw)) : undefined;
            } catch (e) {
                console.error('[SiteForge] Error parsing initial InnerBlocks config:', e);
            }

            const config = {
                allowedBlocks,
                template,
                templateLock: placeholder.dataset.templateLock === 'false'
                    ? false
                    : placeholder.dataset.templateLock || false,
            };
            if (!placeholder.dataset.processed) {
                placeholder.dataset.processed = 'true';
                setInnerBlocksConfig(config);
                setInnerBlocksContainer(placeholder);
            }
        }

        return () => observer.disconnect();
    }, []);

    return createElement(Fragment, null, [
        // InspectorControls dans la sidebar
        controls,

        // Rendu principal dans l'éditeur
        createElement('div', blockProps, [
            // ServerSideRender affiche le même rendu que le front-end
            createElement(ServerSideRender, {
                key: 'server-side-render',
                block: blockName,
                attributes: attributes,
                httpMethod: 'POST',
                LoadingResponsePlaceholder: () => createElement(Placeholder, {
                    icon: 'block-default',
                    label: __('Chargement...', 'siteforge'),
                }, createElement(Spinner)),
                ErrorResponsePlaceholder: ({ response }) => createElement(Placeholder, {
                    icon: 'warning',
                    label: __('Erreur de rendu', 'siteforge'),
                }, createElement('div', {
                    style: { color: '#d94f4f' }
                }, response?.message || __('Impossible de charger le bloc', 'siteforge'))),
            }),
        ]),

        // Portal pour InnerBlocks - se monte dans le placeholder détecté
        innerBlocksContainer && innerBlocksConfig && createElement(InnerBlocksPortal, {
            key: 'inner-blocks-portal',
            container: innerBlocksContainer,
            allowedBlocks: innerBlocksConfig.allowedBlocks,
            template: innerBlocksConfig.template,
            templateLock: innerBlocksConfig.templateLock,
        }),
    ]);
};

/**
 * Composant Save pour sauvegarder les InnerBlocks
 */
const SiteForgeBlockSave = () => {
    // Sauvegarder le contenu des InnerBlocks pour qu'il soit disponible dans render.php via $content
    return createElement(InnerBlocks.Content);
};

/**
 * Auto-register all SiteForge blocks
 */
export const registerSiteForgeBlocks = () => {
    // Vérifier que les blocs sont disponibles
    if (typeof window.siteforgeBlocks === 'undefined') {
        console.warn('[SiteForge] No blocks to register');
        return;
    }

    const blocks = window.siteforgeBlocks;

    Object.keys(blocks).forEach((blockName) => {
        const blockData = blocks[blockName];

        // Vérifier si le bloc est déjà enregistré côté client
        const existingBlock = wp.blocks.getBlockType(blockName);

        if (existingBlock) {
            console.log(`[SiteForge] Block ${blockName} already registered in JavaScript, skipping`);
            return;
        }

        // Enregistrer le bloc côté client avec notre composant React
        console.log(`[SiteForge] Registering block ${blockName}...`);

        // Préparer les attributs depuis les fields
        const attributes = {};
        if (blockData.fields && Array.isArray(blockData.fields)) {
            blockData.fields.forEach(field => {
                const fieldConfig = field.config || {};

                // Déterminer le type d'attribut selon le type de champ
                let attrType = 'string';

                // Map des types simples
                const typeMap = {
                    text: 'string',
                    textarea: 'string',
                    wysiwyg: 'string',
                    select: 'string',
                    checkbox: 'boolean',
                    number: 'number',
                    range: 'number',
                    url: 'string',
                    email: 'string',
                    color: 'string',
                    icon: 'string',
                    link: 'object',
                    repeater: 'array',
                    group: 'object',
                };

                if (typeMap[field.type]) {
                    attrType = typeMap[field.type];
                }

                // Cas spécial: image avec return_value
                if (field.type === 'image') {
                    const returnValue = fieldConfig.return_value || 'url';
                    if (returnValue === 'id') {
                        attrType = 'number';
                    } else if (returnValue === 'object') {
                        attrType = 'object';
                    } else {
                        attrType = 'string'; // url
                    }
                }

                attributes[field.name] = {
                    type: attrType,
                };

                // Ajouter la valeur par défaut si présente
                if (fieldConfig.default !== undefined) {
                    attributes[field.name].default = fieldConfig.default;
                } else if (attrType === 'object') {
                    // Default empty object for object types
                    attributes[field.name].default = {};
                } else if (attrType === 'array') {
                    // Default empty array for array types
                    attributes[field.name].default = [];
                }
            });
        }

        try {
            registerBlockType(blockName, {
                title: blockData.title || blockName,
                description: blockData.description || '',
                category: 'siteforge',
                icon: blockData.icon || 'block-default',
                supports: blockData.supports || {
                    align: true,
                    anchor: true,
                    spacing: {
                        margin: true,
                        padding: true,
                    },
                },
                attributes: attributes,
                edit: (props) => createElement(SiteForgeBlockEdit, {
                    ...props,
                    blockName: blockName
                }),
                save: SiteForgeBlockSave,
            });

            console.log(`[SiteForge] ✅ Block ${blockName} registered with ${Object.keys(attributes).length} attributes`);
        } catch (error) {
            console.error(`[SiteForge] ❌ Failed to register block ${blockName}:`, error);
        }
    });
};

// Auto-register on load
if (typeof wp !== 'undefined' && typeof wp.blocks !== 'undefined') {
    registerSiteForgeBlocks();
} else {
    console.warn('[SiteForge] WordPress blocks API not available');
}

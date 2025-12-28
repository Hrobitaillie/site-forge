(function() {
    const { registerBlockType } = wp.blocks;
    const { useBlockProps, InnerBlocks } = wp.blockEditor;
    const { createElement: el } = wp.element;

    // Récupérer les blocs depuis PHP
    const blocks = window.sifBlocks || [];

    blocks.forEach(function(blockData) {
        const blockName = blockData.name;

        // Éviter de re-register les blocs core
        if (blockName.startsWith('core/')) {
            return;
        }

        registerBlockType(blockName, {
            edit: function(props) {
                const blockProps = useBlockProps();

                return el('div', blockProps,
                    el('div', { className: 'sif-block-placeholder' },
                        el('strong', null, blockData.title || blockName),
                        el(InnerBlocks)
                    )
                );
            },
            save: function() {
                return el(InnerBlocks.Content);
            }
        });
    });
})();

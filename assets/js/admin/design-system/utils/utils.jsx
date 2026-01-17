export const svgStringToElement = ( svgString ) => {
	const parser = new DOMParser();
	const doc = parser.parseFromString( svgString, 'image/svg+xml' );
	const svg = doc.querySelector( 'svg' );

	if ( ! svg ) {
		return null;
	}

	const attrs = {};
	for ( const { name, value } of svg.attributes ) {
		attrs[ name === 'class' ? 'className' : name ] = value;
	}

	return (
		<svg
			{ ...attrs }
			dangerouslySetInnerHTML={{ __html: svg.innerHTML }}
		/>
	);
};

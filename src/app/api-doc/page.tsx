'use client';

import { useEffect, useRef } from 'react';
import { SwaggerUIBundle } from 'swagger-ui-dist';
import 'swagger-ui-dist/swagger-ui.css';

import { useLogger } from '../../hooks/useLogger';
import './swagger-ui-overrides.css';

// Found in https://github.com/Kaylem20201/frame-game/commit/f8e71bbc26e177c76925b8a66906a5995a53b7ac#diff-dd2369c54f926242a712ec1afb690ae4b3db7d28bb84aacb484f7957a922bde9
//NOTE: As of 5/30/25, next in strict mode will put up an error due to Swagger using a deprecated unsafe component
//May be addressed in PR #10373

export default function PageContent() {
    const logger = useLogger('ApiDocPage');
    const swaggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/public/openapi.json')
            .then((response) => response.json())
            .then((spec) => {
                SwaggerUIBundle({
                    domNode: swaggerRef.current!,
                    spec,
                });
            })
            .catch((error) => {
                logger.error('Failed to load API spec', error);
            });
    }, [logger]);

    return <div className='swagger-ui-wrapper' ref={swaggerRef} />;
}

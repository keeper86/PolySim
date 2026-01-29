'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useLogger } from '../../hooks/useLogger';

// Found in https://github.com/Kaylem20201/frame-game/commit/f8e71bbc26e177c76925b8a66906a5995a53b7ac#diff-dd2369c54f926242a712ec1afb690ae4b3db7d28bb84aacb484f7957a922bde9
// NOTE: As of 5/30/25, next in strict mode will put up an error due to Swagger using a deprecated unsafe component
// May be addressed in PR #10373
// Render Swagger UI inside an iframe to isolate its CSS/JS from the app-wide styles
// (prevents global dark-mode or other stylesheet conflicts).
export default function PageContent() {
    const logger = useLogger('ApiDocPage');
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const specRef = useRef<unknown | null>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        let mounted = true;

        let removeListener: (() => void) | null = null;

        async function renderSpecIntoIframe() {
            try {
                if (!specRef.current) {
                    const res = await fetch('/api/public/openapi.json');
                    specRef.current = await res.json();
                }

                if (!mounted) {
                    return;
                }
                const iframe = iframeRef.current;
                if (!iframe) {
                    logger.error('Iframe not available');
                    return;
                }

                function onMessage(ev: MessageEvent) {
                    try {
                        const win = iframe && iframe.contentWindow;
                        if (!win || ev.source !== win) {
                            return;
                        }
                        const data = ev.data as { type?: string; height?: number } | null;
                        if (!data || data.type !== 'swagger-height' || typeof data.height !== 'number') {
                            return;
                        }
                        iframe!.style.height = data.height + 'px';
                    } catch (_err) {
                        // ignore
                    }
                }

                window.addEventListener('message', onMessage);

                removeListener = () => {
                    window.removeEventListener('message', onMessage);
                };

                const specStr = JSON.stringify(specRef.current).replace(/</g, '\\u003c');

                const htmlOpen = resolvedTheme === 'dark' ? '<html class="dark-mode">' : '<html>';

                const srcDoc = `<!doctype html>
                ${htmlOpen}
                <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui.css" />
          <style>
                    html,body,#swagger-ui { height: auto; margin: 0; }
                    /* make background transparent so the iframe blends with the host app */
                    body { background: transparent; }
                    /* hide internal scrollbar; parent will resize iframe to fit content */
                    html, body { overflow: hidden; }
                    #swagger-ui { box-sizing: border-box; background: transparent; }
                    /* hide swagger's built-in topbar because the app provides its own header */
                    .swagger-ui .topbar { display: none !important; }
                    /* remove any white backgrounds left on main containers */
                    .swagger-ui .info, .swagger-ui .scheme-container, .swagger-ui .opblock, .swagger-ui .responses-wrapper { background: transparent !important; }
          </style>
          </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui-bundle.js"></script>
          <script>
            (function() {
              try {
                const spec = JSON.parse('${specStr}');
                SwaggerUIBundle({
                  domNode: document.getElementById('swagger-ui'),
                  spec: spec,
                  presets: [SwaggerUIBundle.presets.apis],
                });
              } catch (e) {
                document.body.innerText = 'Failed to init Swagger UI: ' + e;
              }

              // report height to parent so the iframe can be resized to avoid internal scrollbars
              function sendHeight() {
                try {
                  const el = document.getElementById('swagger-ui');
                  const h = Math.max(el ? el.scrollHeight : 0, document.documentElement.scrollHeight, document.body.scrollHeight);
                  parent.postMessage({ type: 'swagger-height', height: h }, '*');
                } catch (err) {
                  // ignore
                }
              }

              // initial post and on resize / DOM changes
              window.addEventListener('load', () => setTimeout(sendHeight, 50));
              window.addEventListener('resize', () => setTimeout(sendHeight, 50));

              // observe DOM changes to update height when content expands/collapses
              const mo = new MutationObserver(() => setTimeout(sendHeight, 50));
              mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

              // call once now
              setTimeout(sendHeight, 100);
            })();
          </script>
        </body>
        </html>`;
                iframe.srcdoc = srcDoc;
            } catch (err) {
                logger.error('Failed to load/render API spec', err);
            }
        }

        void renderSpecIntoIframe();

        return () => {
            mounted = false;
            try {
                if (removeListener) {
                    removeListener();
                }
            } catch (_err) {
                /* ignore */
            }
        };
    }, [logger, resolvedTheme]);

    return (
        <div className='swagger-ui-wrapper'>
            <iframe
                ref={iframeRef}
                title='API Docs'
                style={{ width: '100%', height: '80vh', border: '0', background: 'transparent' }}
            />
        </div>
    );
}

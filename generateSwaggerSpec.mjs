import fs from 'fs';
import { createSwaggerSpec } from 'next-swagger-doc';
import path from 'path';

const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PolySim Swagger UI',
            version: '1.0',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [],
    },
});

const outputPath = path.join(process.cwd(), 'public', 'swagger-spec.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log('Swagger spec generated at:', outputPath, '\n');

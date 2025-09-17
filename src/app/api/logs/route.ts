import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../util/logger';

/**
 * @swagger
 * /api/logs:
 *   post:
 *     description: Receives client-side logs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: string
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                     component:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *     responses:
 *       200:
 *         description: Logs received successfully
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
    try {
        const { logs } = await request.json();

        if (!Array.isArray(logs)) {
            return NextResponse.json({ error: 'Invalid logs format' }, { status: 400 });
        }

        for (const entry of logs) {
            const { level, message, data, component, timestamp } = entry;
            const logData = {
                ...data,
                component: component || 'client',
                clientTimestamp: timestamp,
            };

            switch (level) {
                case 'debug':
                    logger.debug(logData, message);
                    break;
                case 'info':
                    logger.info(logData, message);
                    break;
                case 'warn':
                    logger.warn(logData, message);
                    break;
                case 'error':
                    logger.error(logData, message);
                    break;
                case 'fatal':
                    logger.fatal(logData, message);
                    break;
                default:
                    logger.info(logData, message);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(error, 'Failed to process client logs');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

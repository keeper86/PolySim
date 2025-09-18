import { ZodObject, ZodRawShape } from 'zod';

export type TrpcEndpoint<T extends ZodObject<ZodRawShape>, U> = {
    handler: (input: T['_output']) => Promise<U> | U;
    zodType: T;
};

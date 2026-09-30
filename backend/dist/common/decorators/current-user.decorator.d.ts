import { AuthenticatedUser } from '../types/jwt-payload.types.js';
export declare const CurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | import("@nestjs/common").ParameterDecoratorOptions | keyof AuthenticatedUser | undefined)[]) => ParameterDecorator;

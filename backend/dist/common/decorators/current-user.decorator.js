import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator((field, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
});
//# sourceMappingURL=current-user.decorator.js.map
import { MongoAbility } from '@casl/ability';
import { AuthenticatedUser } from '../../../common/types/jwt-payload.types.js';
export type AppAbility = MongoAbility;
export declare class AbilityFactory {
    createForUser(user: AuthenticatedUser): AppAbility;
}

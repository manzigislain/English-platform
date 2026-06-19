import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SubscriptionsService } from "./subscriptions.service";

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLevel = this.reflector.getAllAndOverride<string>("requiredPlanLevel", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredLevel) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return true;

    const hasAccess = await this.subscriptionsService.checkAccess(user.id, requiredLevel);
    if (!hasAccess) {
      throw new ForbiddenException({
        message: `This content requires ${requiredLevel} plan or higher`,
        requiredPlan: requiredLevel,
        code: "UPGRADE_REQUIRED",
      });
    }
    return true;
  }
}

import { SetMetadata } from "@nestjs/common";

export const RequiredPlan = (level: string) => SetMetadata("requiredPlanLevel", level);

import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApplyUser } from './guard/apply-user.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

export const PrivateRoute = () => {
  return applyDecorators(UseGuards(JwtAuthGuard));
};

export const PublicRouteApplyUser = () => {
  return applyDecorators(UseGuards(ApplyUser));
};

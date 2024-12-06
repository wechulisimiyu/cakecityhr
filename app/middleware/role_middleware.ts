// app/middleware/role_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Role } from '#enums/roles'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, ...allowedRoles: string[]) {
    const user = ctx.auth.user

    // Convert string roles to enum values
    const roles = allowedRoles.map((role) => Role[role as keyof typeof Role])

    // Check if user has one of the allowed roles
    if (!user || !roles.includes(user.roleId)) {
      ctx.session.flash('error', 'You do not have permission to access this page')
      return ctx.response.redirect().back()
    }

    return next()
  }
}

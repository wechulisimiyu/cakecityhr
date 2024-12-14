import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Role } from '#enums/roles'

export default class RoleMiddleware {
  /**
   * The URL to redirect to when user doesn't have required role
   */
  redirectTo = '/'

  async handle(ctx: HttpContext, next: NextFn, allowedRoles: Role[]) {
    const user = ctx.auth.user

    if (!user || !allowedRoles.includes(user.roleId)) {
      ctx.session.flash('error', 'You do not have permission to access this page')
      return ctx.response.redirect(this.redirectTo)
    }

    return next()
  }
}

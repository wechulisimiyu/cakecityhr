/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { Role } from '#enums/roles'

const LoginController = () => import('#controllers/auth/login_controller')
const LogoutController = () => import('#controllers/auth/logout_controller')
const RegisterController = () => import('#controllers/auth/register_controller')
const ForgotPasswordController = () => import('#controllers/auth/forgot_password_controller')
const ProfileController = () => import('#controllers/settings/profile_controller')
const AccountController = () => import('#controllers/settings/account_controller')
const IndexLeaveController = () => import('#controllers/leaves/index_controller')
const ApprovalsController = () => import('#controllers/dashboard/leave/approvals_controller')
const LiabilityController = () =>
  import('#controllers/dashboard/liabilities/liabilities_controller')
const PeopleController = () => import('#controllers/dashboard/people/index_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')
const IndexDashboardController = () => import('#controllers/dashboard/index_controller')

router.get('/health', [HealthChecksController])

router.on('/').render('pages/home')

//* AUTH -> LOGIN, REGISTER, LOGOUT
router.get('/login', [LoginController, 'show']).as('auth.login.show').use(middleware.guest())
router.post('/login', [LoginController, 'store']).as('auth.login.store').use([middleware.guest()])
router
  .get('/register', [RegisterController, 'show'])
  .as('auth.register.show')
  .use(middleware.guest())
router
  .post('/register', [RegisterController, 'store'])
  .as('auth.register.store')
  .use([middleware.guest()])
router.post('/logout', [LogoutController, 'handle']).as('auth.logout').use(middleware.auth())

//* AUTH -> FORGOT PASSWORD
router
  .get('/forgot-password', [ForgotPasswordController, 'index'])
  .as('auth.password.index')
  .use([middleware.guest()])
router
  .post('/forgot-password', [ForgotPasswordController, 'send'])
  .as('auth.password.send')
  .use([middleware.guest()])
router
  .get('/forgot-password/reset/:value', [ForgotPasswordController, 'reset'])
  .as('auth.password.reset')
  .use([middleware.guest()])
router
  .post('/forgot-password/reset', [ForgotPasswordController, 'update'])
  .as('auth.password.update')
  .use([middleware.guest()])

//* SETTINGS -> ACCOUNT
router
  .get('/settings/account', [AccountController, 'index'])
  .as('settings.account')
  .use(middleware.auth())
router
  .put('/settings/account/email', [AccountController, 'updateEmail'])
  .as('settings.account.email')
  .use(middleware.auth())
router
  .delete('/settings/account', [AccountController, 'destroy'])
  .as('settings.account.destroy')
  .use(middleware.auth())

//* SETTINGS -> PROFILE
router
  .get('/settings/profile', [ProfileController, 'index'])
  .as('settings.profile')
  .use(middleware.auth())
router
  .put('/settings/profile', [ProfileController, 'update'])
  .as('settings.profile.update')
  .use(middleware.auth())

//* LEAVES
router
  .group(() => {
    // Static routes first
    router.get('/leave', [IndexLeaveController, 'index']).as('leaves.index')
    router.get('/leave/create', [IndexLeaveController, 'create']).as('leaves.create')
    router.post('/leave', [IndexLeaveController, 'store']).as('leaves.store')
    router.get('/leave/:id', [IndexLeaveController, 'show']).as('leaves.show')
  })
  .use(middleware.auth()) // Protect all leave routes with auth

// Approval routes - DEPARTMENT_HEAD only
router
  .group(() => {
    router.get('/approvals', [ApprovalsController, 'index']).as('approvals.index')
    router.get('/approvals/:id', [ApprovalsController, 'show']).as('approvals.show')
    router.post('/approvals/:id/reject', [ApprovalsController, 'reject']).as('approvals.reject')
    router.post('/approvals/:id/accept', [ApprovalsController, 'accept']).as('approvals.accept')
  })
  .use([middleware.auth(), middleware.role([Role.DEPARTMENT_HEAD, Role.HR, Role.CEO])])

// Liability routes - HR and CEO access
router
  .group(() => {
    router
      .get('/dashboard/liability', [LiabilityController, 'index'])
      .as('dashboard.liability.index')
    router
      .get('/dashboard/liability/department/:id', [LiabilityController, 'department'])
      .as('dashboard.liability.department')
    router
      .get('/dashboard/liability/employee/:id', [LiabilityController, 'employee'])
      .as('dashboard.liability.employee')
  })
  .use([middleware.auth(), middleware.role([Role.HR, Role.CEO])])

// People routes - HR and CEO access
router
  .group(() => {
    router.get('/dashboard/people', [PeopleController, 'index']).as('dashboard.people.index')
    router.get('/dashboard/people/:id', [PeopleController, 'show']).as('dashboard.people.show')
  })
  .use([middleware.auth(), middleware.role([Role.HR, Role.CEO])])

router
  .get('/dashboard', [IndexDashboardController, 'handle'])
  .as('dashboard.index')
  .use(middleware.auth())

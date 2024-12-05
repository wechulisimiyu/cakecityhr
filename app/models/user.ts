import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { Authenticator } from '@adonisjs/auth'
import { Authenticators } from '@adonisjs/auth/types'
import { Infer } from '@vinejs/vine/types'
import { loginValidator, registerValidator } from '#validators/auth'
import { updateEmailValidator } from '#validators/settings'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import app from '@adonisjs/core/services/app'
import EmailHistory from '#models/email_history'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Department from './department.js'
import Leave from './leave.js'
import Role from './role.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare roleId: number

  @column()
  declare departmentId: number | null

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @hasMany(() => Leave)
  declare leaves: HasMany<typeof Leave>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static async login(
    auth: Authenticator<Authenticators>,
    { email, password, remember }: Infer<typeof loginValidator>
  ) {
    const user = await this.verifyCredentials(email, password)
    await auth.use('web').login(user, remember)
    return user
  }

  static async register(
    auth: Authenticator<Authenticators>,
    data: Infer<typeof registerValidator>
  ) {
    const user = await this.create(data)
    await auth.use('web').login(user)
    return user
  }

  static async logout(auth: Authenticator<Authenticators>) {
    await auth.use('web').logout()
  }

  async updateEmail(data: Infer<typeof updateEmailValidator>) {
    const emailOld = this.email

    // verify the password is correct for auth user
    await User.verifyCredentials(emailOld, data.password)

    await db.transaction(async (trx) => {
      this.useTransaction(trx)

      await this.merge({ email: data.email }).save()
      await EmailHistory.create(
        {
          userId: this.id,
          emailNew: data.email,
          emailOld,
        },
        { client: trx }
      )
    })

    await mail.sendLater((message) => {
      message
        .to(emailOld)
        .subject(`Your ${app.appName} email has been successfully changed`)
        .htmlView('emails/account/email_changed', { user: this })
    })
  }
}

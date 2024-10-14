import type { ApplicationService } from '@adonisjs/core/types'

import OpenAI from 'openai'

export default class OpenaiProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton(OpenAI, () => {
      return new OpenAI()
    })

    this.app.container.alias('openai', OpenAI)
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}

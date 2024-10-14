/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'

router
  .resource('summarizations', '#controllers/summarizers_controller')
  .apiOnly()
  .only(['store', 'show'])

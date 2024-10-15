/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/summarizers_controller')

router.resource('summarizations', UsersController).apiOnly().only(['store', 'show'])

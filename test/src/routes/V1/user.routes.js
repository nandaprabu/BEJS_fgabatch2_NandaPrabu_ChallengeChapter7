const express = require('express')
const router = express.Router()
const middleware = require('../../middlewares/user.middleware')
const {
    createUser,
    userLogin,
    forgetPassword,
    updatePassword
} = require('../../controllers/user.controller')


router.post('/register', createUser)
router.get('/login', middleware, userLogin)
router.get('/forget', forgetPassword)
router.post('/reset-password', updatePassword);


module.exports = router

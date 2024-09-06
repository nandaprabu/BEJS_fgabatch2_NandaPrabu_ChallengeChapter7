const prisma = require('../config/prisma')
const bycrypt = require('bcrypt')
const transporter = require('../config/nodemailer')
const jwt = require('jsonwebtoken')


const createUser = async (req, res) => {
    try {
        const body = req.body
        const hashpassword = bycrypt.hashSync(body.password, 10)

        const getUser = await prisma.user.findUnique({
            where:{
                email: body.email
            }
        })

        if(getUser){
            res.status(500).json({
                message: "User already exist"
            })
        }

        const result = await prisma.user.create({
            data: {
                username: body.username,
                email: body.email,
                password: hashpassword
            }
        });

        const payload_token = {
            id: result.id,
            username: result.username,
        }

        const token = jwt.sign(payload_token, process.env.JWT_SECRET, {
            expiresIn: '1h'
        })

        res.status(200).json({
            message: "Create user Succes! Data Added Successfully",
            token: token,
            result: {
                username: result.username
            }
        })

    } catch (error) {
        res.status(500).json({
            error: "An error occurred while adding customer data",
            details: error.message
        });
    }
}

const userLogin = async (req, res) => {
    try {
        const body = req.body
        const user = await prisma.user.findUnique({
            where: {
                username: body.username
            }
        })

        if(!user){
            res.status(404).json({
                message: "User not found"
            })
        }

        const openPassword = bycrypt.compareSync(body.password, user.password)

        if(!openPassword){
            res.status(500).json({
                message: "email/password anda salah"
            })
        } else {
            res.status(200).json({
                message: `Welcome ${user.username}! Have a Nice Day`
            })
        }

    } catch (error) {
        res.status(500).json({
            error: "An error occurred while processing data",
            details: error.message
        });
    }
}

const forgetPassword = async (req, res) => {
    try {
        const body = req.body
        const user = await prisma.user.findUnique({
            where: {
                email: body.email
            }
        })
    
        if(!user){
            res.status(404).json({
                message: "User not Found"
            })
        }
    
        const otp = Math.floor(1000 + Math.random() * 9000);
        const resetLink = `${process.env.BACKEND_URL}/reset-password.html`;

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: body.email,
            subject: 'Reset Password Verification',
            html: `<p>Your OTP is ${otp.toString()}. Click on this <a href="${resetLink}">link</a> to reset your password.</p>`
        });
    
        const updateUser = await prisma.user.update({
            where : {
                email: body.email
            },
            data: {
                otp: otp.toString()
            }
        })

        if(updateUser){
            res.status(200).json({
                message: `Please check your inbox! recovery code sent via ${updateUser.email} `
            })
        }
        
    } catch (error) {
        res.status(500).json({
            error: "An error occurred while sending data",
            details: error.message
        });
    }
}

const updatePassword = async (req, res) => {
    try {
        const body = req.body
        const user = await prisma.user.findUnique({
            where: {
                email: body.email
            }
        })

        if(!user){
            res.status(404).json({
                message: "User not Found"
            })
        }

        if(body.password !== body.confirmpassword || body.otp !== user.otp){
            res.status(500).json({
                message: "Please check your input"
            })
        }

        const hashpassword = bycrypt.hashSync(body.password, 10)
        const updateUser = await prisma.user.update({
            where: {
                email: body.email
            },
            data: {
                password: hashpassword
            }
        })

        if(updateUser){
            transporter.sendMail({
                from: process.env.EMAIL,
                to: body.email,
                subject: 'Your Password Has Been Successfully Changed - Account Security Update',
                html: `<p> Hello ${user.username},
                Congratulations! Your password has been successfully updated. Your account's security is our top priority. If you did not make this change, please contact our support team immediately.
                Thank you for keeping your account safe with us! </p>`
            });

            res.status(200).json({
                message: "Update password Successfully!",
                result: {
                    username: updateUser.username
                }
            })
        }

    } catch (error) {
        res.status(500).json({
            error: "An error occurred while updating password",
            details: error.message
        });
    }
}


module.exports = {
    createUser,
    userLogin,
    forgetPassword,
    updatePassword
}
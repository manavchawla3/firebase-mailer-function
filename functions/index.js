const fs = require('fs');
const path = require('path');
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
/**
 * Load And Get Environment Variables
 */
dotenv.config();
const {
    GOOGLE_GMAIL_USER,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN
} = process.env;
/**
 * Create Express App To Run MiddleWares
 */
const app = express();
/**
 * Express Middlewares
 */
/** Enable CORS to allow request from all origins */
app.use(
    cors({
        origin: 'http://localhost:8000'
    })
);
app.use(bodyParser.json());
/**
 *  Read Source HTML and Compile To HandleBar Template
 */
let source = fs.readFileSync(
    path.join(__dirname, 'email-template.hbs'),
    'utf8'
);
const emailTemplate = handlebars.compile(source);
/**
 * Auth Credentials for Node-Mailer to send Mail from GMAIL
 */
const auth = {
    type: 'oauth2',
    user: GOOGLE_GMAIL_USER,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: GOOGLE_REFRESH_TOKEN
};
/**
 * Validation middleware
 */
app.use(
    [
        body('name')
            .isLength({ min: 1 })
            .withMessage('Name should be atleast 1 character long!')
            .isLength({ max: 50 })
            .withMessage('Name should be atmost 50 characters long!')
            .trim()
            .escape(),
        body('email')
            .isEmail()
            .withMessage('Email is not valid.')
            .normalizeEmail(),
        body('subject')
            .isLength({ max: 100 })
            .withMessage('Subject should be atmost 100 characters long!')
            .trim()
            .escape(),
        body('message')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Message should be 1-1000 characters long!')
            .trim()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        next();
    }
);
/**
 * Request Handler for Sending Mail
 */
app.post('/', (request, response) => {
    const { name, email, subject = '', message } = request.body;

    var mailOptions = {
        from: `"${name}" <${email}>`,
        to: 'manavchawla3@gmail.com',
        subject: subject,
        html: emailTemplate({
            name,
            email,
            subject,
            message
        })
    };
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: auth
    });
    // return response.json({
    //     status: 200,
    //     message: 'Mail Sent Successfully'
    // });
    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            response.statusCode = 500;
            response.json({
                status: 500,
                message: 'Error while sending mail',
                error: err
            });
            console.log(err);
        } else {
            response.statusCode = 200;
            response.json({
                status: 200,
                message: 'Mail Sent Successfully'
            });
            console.log(JSON.stringify(res));
        }
    });
});

exports.sendMail = functions.https.onRequest(app);

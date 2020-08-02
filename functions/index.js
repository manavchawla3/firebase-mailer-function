const fs = require('fs');
const path = require('path');
const functions = require('firebase-functions');
const express = require('express');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const dotenv = require('dotenv');
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
 * Request Handler for Sending Mail
 */
app.use((request, response) => {
    const req = {
        body: {
            name: 'Manav Chawla',
            email: 'testemail@gmail.com',
            message:
                'Testing Mail to send mail from Firebase Cloud Functions using Gmail API.'
        }
    };

    var mailOptions = {
        from: '"Contact Me 👻" <contact-me@gmail.com>',
        to: 'manavchawla3@gmail.com',
        subject: 'My site contact from: ' + req.body.name,
        html: emailTemplate({})
    };
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: auth
    });
    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            response.json({
                status: 500,
                message: 'Error while sending mail',
                error: err
            });
            console.log(err);
        } else {
            response.json({
                status: 200,
                message: 'Mail Sent Successfully'
            });
            console.log(JSON.stringify(res));
        }
    });
});

exports.sendMail = functions.https.onRequest(app);

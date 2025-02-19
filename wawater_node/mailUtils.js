const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

class MailUtils {
    static transporter = nodemailer.createTransport({
        host: 'mail.thastertyn.xyz',
        port: 465,
        secure: true,
        auth: {
            user: 'dd@thastertyn.xyz',
            pass: 'abc12345'
        }
    });



    static async sendMail(destinationEmail, subject, text, res) {
        const mailOptions = {
            from: 'dd@thastertyn.xyz',
            to: destinationEmail,
            subject: subject,
            text: text
        };

        try {
            const info = await MailUtils.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            res.status(200).json({
                message: 'Email sent successfully',
                messageId: info.messageId
            });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({
                message: 'Error sending email',
                error: error.message
            });
        }

    }




}

module.exports = MailUtils;
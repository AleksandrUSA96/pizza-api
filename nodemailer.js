const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, //true only for 465 port
    auth: {
        user: 'akrichevcov19@gmail.com',
        pass: '318320USAaleksandr'
    }
}, {from: 'AppTest Notify <akrichevcov19@gmail.com>'}
);

const sentOrderMail = message => {
    transporter.sendMail(message, (err, info) => {
        if (err) return console.log(err);
        console.log(info);
    })
};

module.exports = sentOrderMail;
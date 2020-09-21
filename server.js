const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const configTwilio = require('./configTwilio');
const verifyMiddleware = require('./verify.middleware');
const client = require('twilio')(configTwilio.accountSID, configTwilio.authToken);
const sentOrderMail = require('./nodemailer');
const menuItems = require('./menu')

let app = express();

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'node_pizza',
    password: ''
});

conn.connect(err => {
    if (err) {
        console.log(err);
        return err;
    } else {
        console.log('Database ----> ok? ...ok.');
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();

    app.options('*', (req, res) => {
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.send();
    });
});

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('Чё надо? Чё пришел? Я тут работаю! Закрыл меня карасиком и беса не гони!');
});


app.get('/menu', function (req, res) {
    res.send(menuItems);
});

app.post('/create-order', function (req, res) {

    let user = {
        tel: req.body.tel,
        name: req.body.name,
        sureName: req.body.sureName,
        address: req.body.address,
        email: req.body.email
    }

    conn.query("SELECT tel FROM users", function (err, data) {
        if (data.length === 0) {
            conn.query("INSERT INTO users (tel, name, surname, email, address) VALUES (?,?,?,?,?)",
                [user.tel, user.name, user.sureName, user.email, user.address], function (err, data) {
                    if (err) {
                        return console.log(err);
                    } else {
                        console.log('хожу сюда раз')
                    }
                });
        } else if (data[0].tel !== user.tel) {
            conn.query("INSERT INTO users (tel, name, surname, email, address) VALUES (?,?,?,?,?)",
                [user.tel, user.name, user.sureName, user.email, user.address], function (err, data) {
                    if (err) {
                        return console.log(err);
                    } else {
                        console.log('хожу сюда два')
                    }
                });
        } else {
            conn.query('UPDATE users SET name = ?, surname = ?, email = ?, address = ? WHERE tel = ?',
                [user.name, user.sureName, user.email, user.address, user.tel], function (error, data) {
                    if (error) throw error;
                })
            console.log('хожу сюда три');
        }
    });

    let cartItemArray = req.body.cartItem.length;
    for (let i = 0; i < cartItemArray; i++) {

        let order = {
            id: req.body.cartItem[i].item.id,
            img: req.body.cartItem[i].item.img,
            name: req.body.cartItem[i].item.name,
            desc: req.body.cartItem[i].item.description,
            pe: req.body.totalPriceE,
            pd: req.body.totalPriceD,
            count: req.body.cartItem[i].count,
            tel: req.body.tel,
            numOrder: req.body.numOrder,
        }

        conn.query("INSERT INTO orders (tel, num_order, id, img, name, disc, tpe, tpd, count) VALUES (?,?,?,?,?,?,?,?,?)",
            [order.tel, order.numOrder, order.id, order.img, order.name, order.desc, order.pe, order.pd, order.count], function (err) {
                if (err) {
                    return console.log("[mysql error]", err);
                } else {
                    const message = {
                        to: user.email,
                        subject: 'Info about your order to PizzaApp',
                        html: `<h3>Dear ${user.name}</h3> 

                            <p>Your order № <strong>${order.numOrder}</strong> has begun to be prepared!</p> 
                            <p>The order will be delivered to the address <strong>${user.address}</strong>.</p>`
                    };
                    sentOrderMail(message);
                    return res.json({
                        status: 200,
                        orderResp: {
                            numOrder: order.numOrder,
                            name: user.name
                        }
                    });
                }
            });
    }
});

app.get('/login', (req, res) => {
    client
        .verify
        .services(configTwilio.serviceID)
        .verifications
        .create({
            to: `+${req.query.phonenumber}`,
            channel: 'sms'
        })
        .then((data) => {
            res.status(200).send(data)
        });
});

app.get('/verify', (req, res) => {
    client
        .verify
        .services(configTwilio.serviceID)
        .verificationChecks
        .create({
            to: `+${req.query.phonenumber}`,
            code: req.query.code
        })
        .then((data) => {
            let telDb = req.query.phonenumber
            conn.query("SELECT tel FROM users WHERE tel = ?", [telDb], function (err, data) {
                if (data.length === 0) {
                    conn.query("INSERT INTO users (tel) VALUES (?)", [telDb], function (err, data) {
                        if (err) {
                            return console.log(err);
                        } else {
                            const token = jwt.sign({id: telDb}, configTwilio.authToken, {expiresIn: "1h"});
                            return res.json({
                                token,
                                user: {
                                    tel: telDb,
                                    status: 200
                                }
                            });
                        }
                    });
                } else if (data[0].tel !== telDb) {
                    conn.query("INSERT INTO users (tel) VALUES (?)", [telDb], function (err, data) {
                        if (err) {
                            return console.log(err);
                        } else {
                            const token = jwt.sign({id: telDb}, configTwilio.authToken, {expiresIn: "1h"});
                            return res.json({
                                token,
                                user: {
                                    tel: telDb,
                                    status: 200
                                }
                            });
                        }
                    });
                } else {
                    conn.query("SELECT * FROM users WHERE tel = ?", [telDb], function (err, data) {
                        const token = jwt.sign({id: telDb}, configTwilio.authToken, {expiresIn: "1h"});
                        if (data[0].name === '') {
                            return res.json({
                                token,
                                user: {
                                    tel: telDb,
                                    status: 200
                                }
                            });
                        } else {
                            return res.json({
                                token,
                                user: {
                                    tel: telDb,
                                    name: data[0].name,
                                    status: 200
                                }
                            });
                        }
                    });
                }
                ;
            });
        })
})

app.get('/auth', verifyMiddleware, (req, res) => {
    let telDb = req.user.id;
    conn.query("SELECT tel, name FROM users WHERE tel = ?", [telDb], function (err, data) {
        const token = jwt.sign({id: telDb}, configTwilio.authToken, {expiresIn: "1h"});
        if (data[0].name === '') {
            return res.json({
                token,
                user: {
                    tel: telDb,
                    status: 200
                }
            });
        } else {
            return res.json({
                token,
                user: {
                    tel: telDb,
                    name: data[0].name,
                    status: 200
                }
            });
        }
    });
});

app.get('/profile', verifyMiddleware, (req, res) => {
    let telDb = req.user.id;
    console.log(telDb);
    conn.query("SELECT * FROM orders WHERE tel = ?", [telDb], function (err, data) {
        const token = jwt.sign({id: telDb}, configTwilio.authToken, {expiresIn: "1h"});
        return res.json(data);
    });
});

app.listen(3001, function () {
    console.log('API app started!');
});
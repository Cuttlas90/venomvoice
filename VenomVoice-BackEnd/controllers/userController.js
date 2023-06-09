let uuid = require("uuid");
var ever = require('everscale-inpage-provider');
var ever_standalone = require('everscale-standalone-client/nodejs');
let model = require('../models/index');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");
const dotenv = require('dotenv');
dotenv.config();
const everscale = new ever.ProviderRpcClient({
    forceUseFallback: true,
    fallback: async () =>
        ever_standalone.EverscaleStandaloneClient.create({
            connection: {
                id: 1,
                type: 'jrpc',
                data: {
                    //endpoint: 'https://jrpc.everwallet.net/rpc',
                    endpoint: 'https://jrpc-testnet.venom.foundation/rpc',
                },
            },
        }),
});

module.exports = {
    getNonce: async function (req, res, next) {
        let user = await model.User.findOne({ where: { venomAddress: req.body.venomAddress } });
        var nonce = Buffer.from(uuid.v4()).toString('base64');
        if (user) {
            user.nonce = nonce;
            user.save()
                .then(user => {
                    res.json({ hasError: false, data: { nonce: nonce }, message: 'user created successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
        }
        else {
            let data = req.body;
            data.nonce = nonce;
            model.User.create(data)
                .then(user => {
                    res.json({ hasError: false, data: { nonce: nonce }, message: 'user created successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
        }
    },
    loginWithPublicKey: async function (req, res, next) {
        let user = await model.User.findOne({ where: { venomAddress: req.body.venomAddress } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });

        const isValid = await everscale.verifySignature({
            publicKey: req.body.publicKey,
            signature: req.body.signature,
            dataHash: user.nonce,
            withSignatureId: false
        });

        if (isValid.isValid) {
            let token = jwt.sign({
                data: { venomAddress: user.venomAddress, id: user.id }
            }, process.env.SECRET, { expiresIn: '1d' });
            res.json({ hasError: false, data: { token: token, venomAddress: user.venomAddress, userId: user.id } });
        } else {
            res.json({ hasError: true, data: [], error: { message: 'Invalid signature' } })
        }
    },
    getTransactions: async function (req, res, next) {
        let user = await model.User.findOne({ where: { id: req.userId } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });
        var type = req.query.type;
        var page = req.query.page;
        var pageSize = req.query.pageSize;
        var offset = pageSize * page;
        var venomAddress = user.venomAddress;
        switch (type) {
            case '1'://inbox
                var count = await model.Transactions.count({ where: { to: venomAddress } });
                model.Transactions.findAll({ where: { to: venomAddress }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                    .then(data => {
                        res.json({ hasError: false, data: { owner: venomAddress, count: count, transactions: data }, message: 'Get transactions successfully' })
                    })
                    .catch(error => {
                        res.json({ hasError: true, data: {}, error: error })
                    });
                break;
            case '2'://outbox
                var count = await model.Transactions.count({ where: { from: venomAddress } });
                model.Transactions.findAll({ where: { from: venomAddress }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                    .then(data => {
                        res.json({ hasError: false, data: { owner: venomAddress, count: count, transactions: data }, message: 'Get transactions successfully' })
                    })
                    .catch(error => {
                        res.json({ hasError: true, data: {}, error: error })
                    });
                break;
            case '3'://all
                var count = await model.Transactions.count({ where: { [Op.or]: [{ from: venomAddress }, { to: venomAddress }] } });
                model.Transactions.findAll({ where: { [Op.or]: [{ from: venomAddress }, { to: venomAddress }] }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                    .then(data => {
                        res.json({ hasError: false, data: { owner: venomAddress, count: count, transactions: data }, message: 'Get transactions successfully' })
                    })
                    .catch(error => {
                        res.json({ hasError: true, data: {}, error: error })
                    });
                break;
            default:
                throw error;
        }
    },
    createTransaction: async function (req, res, next) {
        let user = await model.User.findOne({ where: { id: req.userId } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });
        let data = req.body;
        model.Transactions.create(data)
            .then(tr => {
                res.json({ hasError: false, data: {}, message: 'Transaction created successfully' })
            })
            .catch(error => {
                res.json({ hasError: true, data: {}, error: error })
            });
    },
};
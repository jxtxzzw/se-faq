const {Answer, Result, Record} = require('../model');
const geoip = require('geoip-lite');

function validateIP(ip) {
    if (ip == '::1' || ip == '127.0.0.1') {
        return true;
    }
    let data = geoip.lookup(ip);
    if (!data) {
        return true;
    }
    return data.country == 'CN';
}

const answerController = {
    all(req, res) {
        Answer.find({}).exec((err, r) => {
            res.json(Result.ok(r));
        })
    },
    getByQuestion(req, res) {
        Answer.find({question_id: req.params.question_id, downvote: {$lt: 15}}).exec((err, r) => {
            res.json(Result.ok(r));
        });
    },
    getOne(req, res) {
        Answer.findOne({
            _id: req.params.id
        }).exec((err, r) => {
            res.json(Result.ok(r));
        })
    },
    update(req, res) {
        Answer.updateOne({_id: req.params.id}, {...req.body}, (err, updated) => {
            res.json(Result.ok(updated));
        });
    },
    create(req, res) {
        let newAnswer = new Answer(req.body);
        if (!newAnswer.content || !newAnswer.question_id) {
            res.json(Result.error(newAnswer, 'Content & Question ID is required.'));
            return;
        }
        let text = newAnswer.ecnuid;
        if (text.length != 11 || (text.substring(4, 8) != '5101' && text.substring(4, 8) != '5102') || (text.substring(0, 3) != '101' && text.substring(0, 3) != '102')) {
            return '非法的学号。';
        }
        newAnswer.timestamp = new Date().toISOString();
        newAnswer.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        newAnswer.save((err, saved) => {
            res.json(Result.ok(saved));
        })
    },
    remove(req, res) {
        Answer.findOne({_id: req.params.id}).remove((err, removed) => {
            res.json(Result.ok(removed));
        })
    },
    upvote(req, res) {
        Answer.findOne({_id: req.params.id}, (err, oldAnswer) => {
            let newRecord = new Record({
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                operation: 'upvote',
                answer_id: req.params.id
            });
            if (!validateIP(newRecord.get('ip'))) {
                res.json(Result.error('', `Your IP (${newRecord.get('ip')}) is not from China. Maybe turn off your proxy?`));
                return;
            }
            newRecord.save();
            Answer.updateOne({_id: req.params.id}, {upvote: (oldAnswer.upvote || 0) + 1}, (err, updated) => {
                res.json(Result.ok(updated));
            });
        });
    },
    downvote(req, res) {
        Answer.findOne({_id: req.params.id}, (err, oldAnswer) => {
            let newRecord = new Record({
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                operation: 'downvote',
                answer_id: req.params.id
            });
            if (!validateIP(newRecord.get('ip'))) {
                res.json(Result.error('', `Your IP (${newRecord.get('ip')}) is not from China. Maybe turn off your proxy?`));
                return;
            }
            newRecord.save();
            Answer.updateOne({_id: req.params.id}, {downvote: (oldAnswer.downvote || 0) + 1}, (err, updated) => {
                res.json(Result.ok(updated));
            });
        });
    },

    async endorse(req, res) {
        // Verification again. Note manually POST a request will not be accepted, unless it has a correct TOKEN
        if (req.userData) {
            await Answer.findOne({_id: req.params.id}, async (err, oldAnswer) => {
                let newRecord = new Record({
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    operation: 'endorse/unendorse',
                    answer_id: req.params.id
                });
                if (!validateIP(newRecord.get('ip'))) {
                    res.json(Result.error('', `Your IP (${newRecord.get('ip')}) is not from China. Maybe turn off your proxy?`));
                    return;
                }
                await newRecord.save();
                await Answer.updateOne({_id: req.params.id}, {endorsed: !oldAnswer.endorsed}, (err, updated) => {
                    res.json(Result.ok(updated));
                });
            });
        } else {
            // Unauthorized (401), or, Forbidden (403). In this scenario, they are the same.
            res.sendStatus(403);
        }
    },
    async hide(req, res) {
        // Authorization Verification
        if (req.userData) {
            await Answer.findOne({_id: req.params.id}, async (err, oldAnswer) => {
                let newRecord = new Record({
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    operation: 'hide/unhide',
                    answer_id: req.params.id
                });
                if (!validateIP(newRecord.get('ip'))) {
                    res.json(Result.error('', `Your IP (${newRecord.get('ip')}) is not from China. Maybe turn off your proxy?`));
                    return;
                }
                await newRecord.save();
                await Answer.updateOne({_id: req.params.id}, {hide: !oldAnswer.hide}, (err, updated) => {
                    res.json(Result.ok(updated));
                });
            });
        } else {
            // 401 and 403 are the same in this case
            res.sendStatus(403);
        }
    }
}

module.exports = answerController;

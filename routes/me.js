var isAuthenticated = require('./common').isAuthenticated;

var Me = require('../models/me');
var Saller = require('../models/Saller');

var async = require('async');
var path = require('path');
var formidable = require('formidable'); //file upload를 위한 모듈

var express = require('express');
var router = express.Router();

//닉네임 중복확인

//    ~~?nickname=필주
router.get('/', function(req, res, next) {
    if(req.query.nickname) {
        var nickname = req.query.nickname;
        Me.nicknameCheck(nickname, function(err, result) {
            if(err) {
                return next(err);
            }
            res.send({
                result : {
                    message : result
                }
            });
        });
    } else if(req.query.action === 'nickname') {
        var user_idx=req.user.id;
        Me.check(user_idx, function(err, result) {
            if(err) {
                return next(err);
            }
            res.send({
                result : {
                    message : result
                }
            })
        });
    } else{
        next(new Error('404'));
    }
});

//닉네임 저장
router.put('/', function(req, res, next) {
    var user = {};
    user.idx = req.user.id;
    user.nickname = req.body.nickname;

    Me.nickname(user, function(err, result) {
        if(err) {
            return next(err);
        }
        res.send({
            result : {
                message : "Success"
            }
        });
    });
});

//마켓등록!
router.post('/market', function(req, res, next) {
    var market = {};
    market.imgPath = [];
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../uploads/images');
    form.keepExtensions = true;
    form.multiples = true;

    form.parse(req, function (err, fields, files) {

        market.user_idx = req.user.id;
        market.market_name = fields.market_name;
        market.market_address = fields.market_address;
        market.market_host = fields.market_host;
        market.market_contents = fields.market_contents;
        market.market_tag = fields.market_tag;
        market.longitude = fields.market_longitude; //경도
        market.latitude = fields.market_latitude;   //위도
        market.market_tell = fields.market_tell;
        market.market_startdate = fields.market_startdate;
        market.market_enddate = fields.market_enddate;
        market.market_url = fields.market_url;

        market.market_starttime = fields.market_starttime;
        market.market_endtime = fields.market_endtime;

        if (files.image instanceof Array) {  //사진 여러장올릴경우
            async.each(files.image, function(item, done) {
                var filename = path.basename(item.path);
                market.imgPath.push(filename);
            }, function(err) {
                if (err) {
                    next(err);
                }
            });
        } else if (!files['image']) { //사진이 없을경우
            return res.status(404).send({
                error: 'Fail'
            });
        } else { //사진 한장일경우
            var filename = path.basename(files.image.path);
            market.imgPath.push(filename);
        }
        Me.marketUploads(market, function(err, result) {
            if (err) {
                return next(err);
            }
            res.send({
                result : {
                    message : "Success"
                }
            });
        });
    });
});

//마켓삭제
router.delete('/market/:market_id', function(req, res, next) {
    var info = {};
    info.user_idx = req.user.id;
    info.market_idx = req.params.market_id;

    Me.marketDel(info, function(err, result) {
        if (err) {
            return next(err);
        }
        res.send({
            result : {
                message : "Success"
            }
        });
    });
});

//내가등록한마켓
//로그인유저만.
router.get('/market', function(req, res, next) {
    var info ={};
    var currentPage = (10*parseInt(req.query.currentPage)) || 0;
    info.currentPage = currentPage;
    info.user_idx = req.user.id;
    Me.marketEnrollment(info, function(err, result) {
        if (err) {
            return next(err);
        }
        res.send({
                result
        });
    });
});

//내가 좋아요한마켓보기
//로그인유저만
router.get('/market/good', function(req, res, next) {
    var info ={};
    var currentPage = (10*parseInt(req.query.currentPage)) || 0;
    info.currentPage = currentPage;
    info.user_idx = req.user.id;
    Me.goodList(info, function(err, result) {
        if (err) {
            return next(err);
        }
        res.send({
            result
        });
    });
});

//셀러모집 삽입 데이터
router.post('/market/saller', function(req, res, next) {
    var saller_u = {};
    //파일이 존재할 경우
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../uploads/images');
    form.keepExtensions = true; // 업로드할 파일의 확장자를 유지시킬경우 true
    form.multiples = false; // false 옵션을 주었기때문에, 단일 사진만 허용.

    form.parse(req, function (err, fields, files) {
        //fields 는 업로드 파일이 아닌 다른 옵션들
        //files는 파일
        if (err) {
            return next(err);
        }

        saller_u.user_idx = req.user.id;
        saller_u.recruitment_title=fields.recruitment_title;
        saller_u.recruitment_contents=fields.recruitment_contents;

        //에러가 아닐시 saller_u fields 값을 추가


        if (!files['image']) {
            saller_u.recruitment_image = "";
        } else {
            saller_u.recruitment_image = path.basename(files.image.path);
        }

        Saller.saller_1(saller_u, function(err, result) {
            if(err) {
                return next(err);
            }
            res.send({
                result : {
                    message : "Success"
                }
            });
        });
    });
});

//셀러모집 리스트
router.get('/market/saller', function(req, res, next) {
    var currentPage = (10*parseInt(req.query.currentPage)) || 0;
    Saller.saller_2(currentPage, function(err, result) {
        if(err) {
            return next(err);
        }
        res.send({
            result : result
        });
    });
});

//셀러모집 댓글달기
router.post('/market/saller/:id/reply', function(req, res, next) {
    var info = {};
    info.user_id = req.user.id;
    info.Recruitment_recruitment_idx= req.params.id;
    info.reply_contents = req.body.reply_contents;

    Saller.saller_3(info, function(err) {
        if(err) {
            return next(err);
        }
        res.send({
            result : {
                message : "Success"
            }
        });
    });
});

//셀러모집 상세보기
router.get('/market/saller/:id', function(req, res, next) {
    var recruitment_idx = req.params.id;
    Saller.saller_4(recruitment_idx, function(err, results) {
        if(err) {
            return next(err);
        }
        res.send({
            result :  results
        });
    });
});

//내가작성한 물품|셀러 모집리스트
//로그인필요
router.get('/saller', function(req, res, next){
    var info = {};
    info.currentPage = (10*parseInt(req.query.currentPage)) || 0;
    info.user_idx = req.user.id;

    Saller.mySaller(info, function(err, reslut) {
        if (err) {
            return next(err);
        }
        res.send({
            result : reslut
        });
    });
});

//셀러 모집글 삭제
//로그인 필요
router.delete('/market/saller/:id', isAuthenticated,function (req,res, next){
    var info ={};
    info.user_idx = req.user.id;
    info.recruitment_idx = req.params.id;

    Me.del(info, function (err, result) {
        if(err){
            return next(err);
        }
        res.send({
            result : {
                message : "Success"
            }
        });
    })

});

module.exports = router;
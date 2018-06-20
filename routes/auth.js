var express = require('express');
var passport = require('passport');

//kakao로그인관련모듈
var KakaoStrategy = require('passport-kakao').Strategy;
var KaKoTokenStrategy = require('passport-kakao-token');
//facebook로그인관련모듈
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');

var Auth = require('../models/auth');
var router = express.Router();
var myConfig = require('../config/myConfig');

//새션값에 관련된 함수.
passport.serializeUser(function (user, done) {
    console.log(user);
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    Auth.findCustomer(id, function (err, user) {
        if (err) {
            return done(err);
        }
        done(null, user);
    });
});

//kakao passport 셋팅.
passport.use(new KakaoStrategy({
        clientID : myConfig.KAKAO_APP_ID,
        callbackURL : myConfig.KAKAO_CALLBACK_URL,
    },
    function(accessToken, refreshToken, profile, done){
        // 사용자의 정보는 profile에 들어있다.
        Auth.kakaoFindOrCreate(profile, function(err, user) {
            if (err) {
                return done(err);
            }
            return done(null, user);
        });
        //FIXME : 마켓업로드시 토큰값 지워야함!
        console.log('accessToken : ' +accessToken);
    }));
passport.use(new KaKoTokenStrategy({
    clientID: myConfig.KAKAO_APP_ID,
}, function (accessToken, refreshToken, profile, done) {
    Auth.kakaoFindOrCreate(profile, function (err, user) {
        if (err) {
            return done(err);
        }
        return done(null, user);
    });
}));

//facebook passport 셋팅
passport.use(new FacebookStrategy({
        clientID: myConfig.FACEBOOK_APP_ID,
        clientSecret: myConfig.FACEBOOK_APP_SECRET,
        callbackURL: myConfig.FACEBOOK_CALLBACK_URL,
        // profileFields: ['id', 'displayName', 'name', 'gender', 'profileUrl', 'photos', 'emails']
        profileFields: ['id', 'displayName', 'name']
    },
    function (accessToken, refreshToken, profile, done) {
        console.log(accessToken);
        Auth.facebookFindOrCreate(profile, function (err, user) {
            if (err) {
                return done(err);
            }
            return done(null, user);
        });
    }));
passport.use(new FacebookTokenStrategy({
    clientID: myConfig.FACEBOOK_APP_ID,
    clientSecret: myConfig.FACEBOOK_APP_SECRET
}, function (accessToken, refreshToken, profile, done) {
    Auth.facebookFindOrCreate(profile, function (err, user) {
        if (err) {
            return done(err);
        }
        return done(null, user);
    });
}));


//FIXME : reg_Token 받아서 저장하는거 따로 만들어줘야함.(카카오 && 페이스북)

// kakao callback url : 안드로이드가없어서 Token을 받아오기위한 TEST URL
router.get('/kakao/callback', passport.authenticate('kakao'), function (req, res, next) {
    res.send({message: 'kakao callback'});
});

// kakao 로그인시 사용하는 API
// GET /auth/kakao/token?access_token=[ACCESS_TOKEN] 형식으로 넘겨줘야함.
router.get('/kakao/token', passport.authenticate('kakao-token'), function (req, res, next) {
    if (req.user)
        res.send({
            result: {
                message: 'Success'
            }
        });
    else {
        res.send({
            result : {
                message : 'Fail'
            }
        });
    }
});


// facebook callback url : 안드로이드가없어서 Token을 받아오기위한 TEST URL
router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));
router.get('/facebook/callback', passport.authenticate('facebook'), function (req, res, next) {
    res.send({message: 'facebook callback'});
});

// facebook 로그인
// POST /auth/facebook/token 형식으로넘겨줘야함
// body에 실어서 access_token = ?
router.post('/facebook/token', passport.authenticate('facebook-token', {scope: ['email']}), function (req, res, next) {
    if (req.user)
        res.send({
            result: {
                message: 'Success'
            }
        });
    else {
        res.send({
            result : {
                message : 'Fail'
            }
        });
    }
});

//로그아웃
router.get('/logout', function (req, res, next) {
    req.logout();
    res.send({
        result: {
            message: 'Success'
        }
    });
});

module.exports = router;
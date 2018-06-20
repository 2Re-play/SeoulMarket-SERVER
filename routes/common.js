// 로그인이 안되어 있으면 돌려보내는 함수
function isAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).send({
            message: 'login required'
        });
    }
    next();
}


module.exports.isAuthenticated = isAuthenticated;

//사용법
/*
 router.get('/', isAuthenticated, function(req, res, next) {
    .....코드
 });
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');

//사용자가 게시글작성했을때 INSERT 되는 쿼리
function saller_1(saller_u, callback) {
   var sql = 'INSERT INTO Recruitment(User_user_idx, recruitment_title, recruitment_contents, recruitment_image) VALUES(?,?,?,?)';
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query( sql, [saller_u.user_idx, saller_u.recruitment_title, saller_u.recruitment_contents, saller_u.recruitment_image], function(err, result) {
            dbConn.release();
            if(err) {
                return callback(err);
            }
            callback(null, result);
        });
    });
}


//셀러모집화면 최신순으로 목록 업로드
function saller_2(currentPage, callback) {
   var sql = "SELECT R.recruitment_idx, R.recruitment_title, R.recruitment_image, U.user_nickname, "+
             "date_format(convert_tz(R.recruitment_uploadtime, '+00:00', '+00:00'), '%Y-%m-%d %H:%i') recruitment_uploadtime "+
             "FROM Recruitment R "+
             "JOIN User U ON (U.user_idx= R.User_user_idx) "+
             "ORDER BY R.recruitment_idx DESC LIMIT ?, 10";

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        var saller = [];
        dbConn.query(sql, [currentPage], function(err, result) {
            dbConn.release();
            if(err) {
                return callback(err);
            }

            async.each(result, function(item, cb) {
                saller.push({
                    recruitment_idx : item.recruitment_idx,
                    recruitment_title : item.recruitment_title,
                    recruitment_image : item.recruitment_image && ("http://localhost:3000"+item.recruitment_image),
                    user_nickname : item.user_nickname,
                    recruitment_uploadtime : item.recruitment_uploadtime
                });
                cb(null, null);
            }, function(err) {
                if (err) {
                    callback(err);
                }
            });
            callback(null, saller);
        });
    });
}

// 셀러모집 INSERT 댓글달기
function saller_3(info, callback) {
   var sql = 'INSERT INTO Reply(reply_contents, User_user_idx, Recruitment_recruitment_idx) VALUES(?,?,?);';
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query( sql, [info.reply_contents, info.user_id, info.Recruitment_recruitment_idx], function(err, result) {
            dbConn.release();
            if(err) {
                return callback(err);
            }
            callback(null, null);
        });
    });
}


//셀러모집 상세보기 SELECT 업로드
//recruitment_uploadtime
function saller_4(recruitment_idx, callback) {
    var sql_1 = "SELECT R.recruitment_title, R.recruitment_image, date_format(convert_tz(R.recruitment_uploadtime, '+00:00', '+00:00'), '%Y-%m-%d %H:%i') recruitment_uploadtime, R.recruitment_contents,U.user_nickname "+
                "FROM Recruitment R "+
                "JOIN User U ON (U.user_idx= R.User_user_idx) "+
                "WHERE R.recruitment_idx = ? ";

    var sql_2 = "SELECT U.user_nickname, date_format(convert_tz(R.reply_uploadtime, '+00:00', '+00:00'), '%Y-%m-%d %H:%i') reply_uploadtime, R.reply_contents "+
                "FROM Reply R "+
                "JOIN User U ON (U.user_idx=R.user_user_idx) "+
                "WHERE R.recruitment_recruitment_idx = ?";

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
         var result_saller = {};
        async.series([saller_select, reply_select],function(err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
                callback(null, result_saller);
        });

        function saller_select(callback){
            dbConn.query(sql_1, [recruitment_idx], function(err, result) {
                if (err) {
                    return callback(err);
                }
                //FIXME : 수정해야함
                if(!result[0].recruitment_image == "") {
                    result[0].recruitment_image = "http://localhost:3000/images/" + result[0].recruitment_image;
                }
                result_saller = result[0];
                callback(null, result);
            });
        }
        function reply_select(callback){
            result_saller.review ={};
            dbConn.query(sql_2, recruitment_idx, function(err, result) {
                if (err){
                    return callback(err);
                }
                result_saller.review = result;
                callback(null, null);
            })
        }
    });
}

//내가작성한 셀러 모집그보기
function mySaller(info, callback) {
    var sql_select_mySaller = "SELECT R.recruitment_idx, R.recruitment_title, R.recruitment_image, U.user_nickname, a.r_count, "+
    "date_format(convert_tz(R.recruitment_uploadtime, '+00:00', '+00:00'), '%Y-%m-%d %H:%i') recruitment_uploadtime "+
    "FROM Recruitment R "+
    "JOIN User U ON (U.user_idx= R.User_user_idx) "+
    "LEFT JOIN (SELECT Rct.recruitment_idx, COUNT(Rct.recruitment_idx) r_count "+
    "FROM Recruitment Rct JOIN Reply R ON (Rct.recruitment_idx = R.Recruitment_recruitment_idx) "+
    "GROUP BY Rct.recruitment_idx) a ON (a.recruitment_idx = R.recruitment_idx) "+
    "WHERE R.User_user_idx = ? "+
    "ORDER BY recruitment_uploadtime DESC LIMIT ?, 10"

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        var saller = [];
        dbConn.query(sql_select_mySaller, [info.user_idx, info.currentPage], function(err, result) {
            dbConn.release();
            if(err) {
                return callback(err);
            }
            async.each(result, function(item, cb) {
                saller.push({
                    recruitment_idx : item.recruitment_idx,
                    recruitment_title : item.recruitment_title,
                    recruitment_image : item.recruitment_image && ("http://localhost:3000"+item.recruitment_image),
                    user_nickname : item.user_nickname,
                    recruitment_uploadtime : item.recruitment_uploadtime,
                    count : item.r_count || 0
                });
                cb(null, null);
            }, function(err) {
                if (err) {
                    callback(err);
                }
            });
            callback(null, saller);
        });
    });
}



module.exports.saller_1 = saller_1;
module.exports.saller_2 = saller_2;
module.exports.saller_3 = saller_3;
module.exports.saller_4 = saller_4;
module.exports.mySaller = mySaller;

   

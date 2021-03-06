var mysql = require('mysql');
var logger = require('../config/logger');
var dbPoolConfig = require('../config/myConfig').dbPoolConfig;
var dbPool = mysql.createPool(dbPoolConfig);

dbPool.logStatus = function() {
    logger.log('debug', 'dbpool : current free %d conns/ %d conns in a database pool',
        dbPool._freeConnections.length,
        dbPool._allConnections.length
    );
};

dbPool.on('connection', function(connection) {
    logger.log('debug', 'connection event : free %d conns/ %d conns in a database pool',
        dbPool._freeConnections.length,
        dbPool._allConnections.length
    );
});

dbPool.on("enqueue", function() {
    logger.log('debug', 'enque event : total %d waiting conns in a queue',
        dbPool._connectionQueue.length
    );
});

module.exports.dbPool = dbPool;
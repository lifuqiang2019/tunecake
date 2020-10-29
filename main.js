import express from './config/myexpress'
import logger from './app/util/logger'
import config from './config/config'
var server = express()
    // xxx
    // xxx
server.listenAsync(config.port).then(function() {
    logger.info("Server started on port " + config.port);
})
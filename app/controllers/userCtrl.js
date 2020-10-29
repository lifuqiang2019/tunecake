//用户控制器 操作用户的接口
import logger from '../util/logger'

const operations = {
    // 用户登录接口
    login: function(req, res) {
        logger.info("调用用户登录接口开始" + JSON.stringify(req.body))
            //......
        let msg = { msg: "登录成功" }
        res.status(200).json(msg)
        logger.info("调用登录结束")
    },
    // 用户查询列表接口
    list: function(req, res) { //req--request  res-response
        logger.info("调用用户查询接口")
        let users = [{ name: "小张" }, { name: "小王" }]
            //给浏览器返回数据
            // res.status(200).send(users)
        res.status(200).json(users)
        logger.info("调用用户查询接口结束")
    }
}

export default operations
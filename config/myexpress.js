import express from 'express';
import bodyParser from 'body-parser'
import util from 'util'
import jwt from 'jsonwebtoken'
import logger from '../app/util/logger'
import axios from 'axios'
import history from 'connect-history-api-fallback'
import path from 'path'

/*axiosRetry(axios, {
    retries: 1, // 设置自动发送请求次数
    retryDelay: (retryCount) => {
        return retryCount * 1000; // 重复请求延迟
    },
    shouldResetTimeout: true, //  重置超时时间
    retryCondition: (error) => {
        //true为打开自动发送请求，false为关闭自动发送请求
        if (error.message.includes("timeout")) {
            console.log('请求超时，正在重新发送请求');
            return true;
        } else {
            return false;
        };
    }
});*/
export default () => {
    var app = express();
    app.use(history())
    app.use(express.static(path.join(__dirname, '../dist')))
    // 把listen方法封装为promise，在外面调用
    app.listenAsync = util.promisify(app.listen)
        // 解析参数
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))


    var allowCrossDomain = function(req, res, next) {
        //设置允许跨域的域名，*代表允许任意域名跨域
        res.setHeader("Access-Control-Allow-Origin", "*");
        //跨域允许的header类型
        res.setHeader("Access-Control-Allow-Headers", "*");
        //跨域允许的请求方式
        res.setHeader("Access-Control-Allow-Methods", "*");
        next()
    }
    app.use(allowCrossDomain);
    logger.warn('配置跨域')
    axios.defaults.sendSuscced = true
    axios.defaults.timeout = 30000;

    logger.info('已配置axios超时时间20s')
    app.get('/test', function(req, res) {
        res.send('success')
    })

    // github第三方登录接口
    app.post('/auth', (req, res) => {
        var clientID = 'ce277b644432158c9aa3'
        var clientSecret = '36533bcbb094356bad25ca27699b42cf322e855b'
        var { code } = req.body
        if (code) {
            logger.info('获取到用户code，正在发送请求');
            const tokenResponse = axios({
                method: 'post',
                url: 'https://github.com/login/oauth/access_token?' +
                    `client_id=${clientID}&` +
                    `client_secret=${clientSecret}&` +
                    `code=${code}`,
                headers: {
                    accept: 'application/json'
                },
            });
            console.log('第一次请求结果：', tokenResponse);
            tokenResponse.then(response => {
                logger.info('第一次获取access_token请求响应开始');
                if (response.data) {
                    logger.info(response.data.access_token ? '获取到access_token' : 'data数据未发现token');
                } else {
                    logger.warn('未获取到data')
                }
                logger.info('第一次获取access_token请求响应结束');
                if (response === undefined) {
                    logger.warn('请求access_token返回值为undefined')
                    throw '请求access_token返回值为undefined'
                } else if (response.data.error === 'bad_verification_code') {
                    logger.warn('验证码已失效：', response.data.error)
                    throw '验证码已失效'
                } else {
                    let accessToken = response.data.access_token
                    logger.info('已获取获取用户access_token:', JSON.stringify(response.data));
                    logger.info('正在已获取的access_token发送获取用户信息请求')
                    if (accessToken) {
                        return axios({
                            method: 'get',
                            url: `https://api.github.com/user`,
                            headers: {
                                accept: 'application/json',
                                Authorization: `token ${accessToken}`
                            },
                        });
                    }
                }
            }).then(response => {
                if (response.data && response.config) {
                    const userInfo = response.data
                    logger.info('已获取获取用户信息');
                    let username = userInfo.login;
                    let token_id = response.config.headers.Authorization.split(' ')[1]
                    res.send({ message: 'ok', username, token_id, superuser: false })
                    logger.info('已返回token')
                } else {
                    logger.warn('未获取用户信息')
                    res.send('failed')
                    logger.info('已返回未获取用户信息错误')
                }

            }).catch(err => {
                logger.warn('获取用户信息失败');
                logger.info('获取用户失败信息开始');
                if (err.code === 'ECONNABORTED' && err.message.indexOf('timeout') !== -1) {
                    logger.warn('超时', err.message);
                    res.send('The request timeout')
                } else if (err.code === 'ECONNRESET' && err.syscall === 'read') {
                    console.log('未知错误');
                    console.log(err);
                    console.log(err.message)
                    res.send('unknow error')
                } else {
                    console.log('不是超时错误', err);
                    res.send('bad_verification_code')
                }

                logger.info('获取用户失败错误信息结束');
                logger.warn('已返回客户端错误信息');
            })
            tokenResponse.catch(err => {
                logger.warn('获取用户access_token失败');
                logger.info('获取用户access_token错误信息开始');
                if (err.code === 'ECONNABORTED' && err.message.indexOf('timeout') !== -1) {
                    console.log('超时', err.message);
                    res.send('The request timeout')
                } else {
                    console.log('不是超时错误', err);
                    res.send('bad_verification_code')
                }
                logger.info('获取用户access_token错误信息结束');
                res.send('failed')
                logger.warn('已返回客户端错误信息');
            })
        } else {
            logger.info('未获取到用户code，未发送请求');
        }
    })
    app.post('/login', function(req, res) {
        logger.info('调用用户登陆接口')
        let { username, password } = req.body
        username == 'TUNECAKEMANAGEMENT' ? logger.info('账号存在') : logger.warn('账号错误')
        password == 'TUNECAKESTUDIO' ? logger.info('密码正确') : logger.warn('密码错误')
        if (username == 'TUNECAKEMANAGEMENT' && password == 'TUNECAKESTUDIO') {
            console.log('response:successful validation');
            let payload = { username: username, password: password }; // 
            let secret = 'CAKE'; // 加盐
            let token = jwt.sign(payload, secret, {
                expiresIn: '60000'
            });
            res.send({ ok: true, token, superuser: true, })
        } else {
            console.log('response:Wrong username and password');
            res.send({ ok: 'false', message: "Wrong username and password" })
        }

        logger.info('调用用户登陆接口结束')
    })
    require(process.cwd() + '/app/routes/myRoute.js')(app)
    logger.warn('配置路由')
        //app.listen(5555, function() {
        // console.log('服务器已运行,端口5555');
        //})
    return app
}
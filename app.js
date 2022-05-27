import React from "react";
import {renderToString} from 'react-dom/server'
const http = require("http");
const fs = require('fs');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const CMR_render = () => {
    /**
     * 路径匹配规则
     * home.js     -> /home
     * /home/index -> /home
     * @param pageUrl
     * @param dirUrl
     * @returns {string}
     */
    function queryComponentPath (pageUrl, dirUrl) {
        const match = (pageUrl.split('/').pop() === dirUrl.split('/').pop().split('.')[0]) || dirUrl.split('/').pop().split('.')[0] === 'index';
        if (match) {
            return '/' + pageUrl.split('/').slice(2).join("/");
        }
        return '/' + dirUrl.split('.')[0].split('/').slice(2).join("/");
    }

    /**
     * 拼接路由表 tree
     * @param pageUrl
     * @returns {*[]}
     */
    function getRouterList (pageUrl) {
        const file = fs.readdirSync(pageUrl);
        let arr = [];
        for (let i = 0; i < file.length; i++) {
            let dirUrl = `${pageUrl}/${file[i]}`;
            let fe = fs.lstatSync(dirUrl);
            let routerObj = {
                path: './'+dirUrl,
                componentPath: queryComponentPath(pageUrl, dirUrl),
                children: []
            };
            arr.push(routerObj);
            // 文件夹
            if (fe.isDirectory()) {
                const {path} = routerObj;
                let data = getRouterList(dirUrl);
                const isIndex = data.find(res => res.path === path + '/index.js');
                if (isIndex) {
                    routerObj.path = path + '/index.js';
                    routerObj.children = [...data.filter(res => res.path !== path + '/index.js')];
                }
                else {
                    routerObj.children = [...data];
                }
                continue;
            }
        }
        return arr;
    }

    /**
     * 设置路由资源
     * @param list
     * @param parent
     * @returns {Promise<null>}
     */
    async function routerInitResources (list, parent) {
        let Com;
        for (let i = 0; i < list.length; i++) {
            let com = await import(list[i].path);
            let {componentPath, children} = list[i];
            let template = com.default() || null;
            Com = template;
            if (parent) {
                Com = parent.default({children: Com});
            }
            if (children.length) {
                let parentCom = parent || com;
                if (parent && com) {
                    parentCom = {default: (props) => parent.default({children: com.default(props)})};
                }
                await routerInitResources(children, parentCom);
            }
            setRouter({componentPath, template: Com});
        }
        return Com;
    }

    /**
     * 设置路由
     * @param componentPath
     * @param template
     */
    function setRouter ({componentPath, template}) {
        eventEmitter.on(componentPath, async function(method, response) {
            const html = renderToString(template);
            response.end(html);
        });
    }

    function init (option = {}) {
        const {pageUrl, port, template404 = <div>404</div>} = option;
        return {
            pageUrl,
            port,
            template404,
            run: function () {
                try {
                    const routerList = getRouterList(this.pageUrl);
                    routerInitResources(routerList);
                    http.createServer( (request, response) => {
                        if (eventEmitter.listenerCount(request.url)) {
                            eventEmitter.emit(request.url, request.method, response);
                        }
                        else {
                            response.end(renderToString(this.template404));
                        }
                    }).listen(this.port);
                }
                catch (e) {
                    console.log('启动失败！！！！');
                }
            }
        }
    }

    return {
        init
    };
}

const {init} = CMR_render();
init({
    pageUrl: 'src/page',
    port: '43998',
    template404: <div>页面丢失。。。</div>
}).run();
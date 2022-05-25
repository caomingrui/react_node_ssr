import React from "react";
import {renderToString} from 'react-dom/server'
const http = require("http");
const fs = require('fs');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const pageUrl = 'src/page';

function readDirFn (pageUrl) {
     const file = fs.readdirSync(pageUrl);
     let arr = []
     for (let i = 0; i < file.length; i++) {
         let dirUrl = `${pageUrl}/${file[i]}`;
         const fe = fs.lstatSync(dirUrl);
         let o = {
             old: pageUrl,
             path: './'+dirUrl,
             componentPath: queryComponentPath(pageUrl, dirUrl),
             children: []
         }
         if (fe.isDirectory()) {
             let d = readDirFn(dirUrl);
             // console.log(o, d)
             o.children.push(d);
             // (arr[arr.length - 1] || (arr[arr.length - 1]?.children = [])).concat();
             // arr = arr.concat(readDirFn(dirUrl));
             // continue;
         }
         arr.push(o);
     }
     return arr;
}

let urlArr = readDirFn(pageUrl).concat({path: './src/page/app', componentPath: '/'});
console.log(urlArr);

function queryComponentPath (pageUrl, dirUrl) {
    const match = (pageUrl.split('/').pop() === dirUrl.split('/').pop().split('.')[0]) || dirUrl.split('/').pop().split('.')[0] === 'index';
    if (match) {
        return '/' + pageUrl.split('/').slice(2).join("/");
    }
    return '/' + dirUrl.split('.')[0].split('/').slice(2).join("/")
}

function setRouter ({componentPath, path}) {
    eventEmitter.on(componentPath, async function(method, response) {
        const Com = await import(path);
        const html = renderToString(Com.default())
        response.end(html);
    });
}

async function Init () {
    await urlArr.forEach(res => setRouter(res));
    // server start
    http.createServer(function (request, response) {
        eventEmitter.emit(request.url, request.method, response);
    }).listen(43998);
}

Init();

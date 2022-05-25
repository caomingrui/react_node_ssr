
function Dep () {
    const dep = [];

    const push = (data) => {
        dep.push(data);
    }

    const run = () => {
        dep.forEach(res => {
            res.update();
        })
    }

    return {
        push,
        run
    };
}

let dep = new Dep();
function Observer (value) {
    this.value = value;
    this.type = Object.prototype.toString.call(value);

    switch (this.type) {
        case "[object Object]": {
            const keys = Object.keys(this.value);
            for (let i = 0; i < keys.length; i++) {
                this.objectDefineReactive(this.value, keys[i], this.value[keys[i]]);
            }
            break;
        }
        case "[object Array]": {
            this.value.__proto__ = this.arrayDefineReactive();
            for (let i = 0; i < this.value.length; i++) {
                new Observer(this.value[this.value[i]])
            }
            break;
        }
    }
}

Observer.prototype = {
    objectDefineReactive: function (data, key, val) {
        let type = Object.prototype.toString.call(val);

        if ((type === "[object Object]") || (type === "[object Array]")) {
            new Observer(val);
            return;
        }

        Object.defineProperty(data, key, {
            get: function () {
                console.log('get', key);
                Observer.data && dep.push(Observer.data);
                return val;
            },
            set: function (newVal) {
                if (newVal === val) {
                    return;
                }
                dep.run();
                return newVal;
            }
        });
    },
    arrayDefineReactive: function () {
        let arrayProto = Array.prototype;
        let arrayFn = Object.create(arrayProto);
        const fnList = ['push', 'pop', 'splice', 'reverse', 'unshift', 'shift', 'sort'];

        fnList.forEach(item => {
            let fn = arrayFn[item];
            arrayFn[item] = function (...arg) {
                console.log('arr');
                dep.run();
                return fn.call(this, ...arg);
            }
        });

        return arrayFn;
    }
}

let obj = {
    name: 'cc',
    da: {
        a: 1
    },
    arr: [1]
}




let t = new Observer(obj);
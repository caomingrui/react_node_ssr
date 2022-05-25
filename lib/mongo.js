const mongodb = require('mongodb');

const url = "mongodb://localhost:27017";

const dbName = "itTest";

mongodb.MongoClient.connect(
    url,
    {
        useUnifiedTopology: true
    },
    (err, client) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('链接成功');
        const db = client.db(dbName);

        // 查找数据
        db.collection('test')
            .find({"name":"cmr"})
            .toArray((err,data) => {
            console.log(data)

            // 操作完数据库后，一定要记得关闭
            client.close();
        })
    }
)
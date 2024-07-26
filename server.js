const express = require('express');
const bodyParser = require('body-parser');
const r = require('rethinkdb');
const path = require('path');
const app = express();
const PORT = 3000;

let conn;

r.connect({ host: 'localhost', port: 28015 }, (err, connection) => {
    if (err) throw err;
    conn = connection;
    console.log('RethinkDB connected');

    r.dbList().contains('test')
        .do(dbExists => {
            return r.branch(
                dbExists,
                {dbs_created: 0},
                r.dbCreate('test')
            );
        }).run(conn, (err, result) => {
            if(err) throw err;
            console.log('Database setup.', result);
            r.db('test').tableList().contains('todo')
                .do(tableExists => {
                    return r.branch(
                        tableExists,
                        {table_created: 0},
                        r.db('test').tableCreate('todo')
                    );
                }).run(conn, (err, result) =>{
                    if(err) throw err;
                    console.log('Table setup:', result);
                });
        });

});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/read', (req, res) => {
    r.db('test').table('todo').run(conn, (err, cursor) => {
        if (err) return res.status(500).send({ error: err.message });
        cursor.toArray((err, result) => {
            if (err) return res.status(500).send({ error: err.message });
            console.log(result);
            res.json(result);
        });
    });
});

app.post('/add-task', (req, res) => {
    const newTask = req.body;
    r.db('test').table('todo').insert(newTask).run(conn, (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.delete('/delete-task/:id', (req, res) => {
    const taskId = req.params.id;
    console.log('delete id:',taskId);
    if(!taskId) return res.status(400).send({error: 'invalid id'});
    r.db('test').table('todo').get(taskId).delete().run(conn, (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        if (result.deleted === 0) {
            return res.status(404).send({ error: 'Task not found' });
        }
        res.status(204).send();
    });
});
app.put('/update-task/:id', (req, res) => {
    const taskId = req.params.id;
    const updatedTask = req.body.task;

    if (!updatedTask) return res.status(400).send({ error: 'Task content is required' });

    r.db('test').table('todo').get(taskId).update({ task: updatedTask }).run(conn, (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        if (result.replaced === 0) {
            return res.status(404).send({ error: 'Task not found' });
        }
        res.json(result);
    });
});

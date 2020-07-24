require('module-alias/register');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('~/api/routes/routes'); //importing route
routes(app); //register the route

app.listen(port, () =>
    console.log('todo list RESTful API server started on: ' + port),
);
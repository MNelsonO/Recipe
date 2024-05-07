var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cons = require('consolidate'),
    dust = require('dustjs-helpers'),
    pg = require('pg'),
    app = express();

// Create a pool for connecting to PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recipebook',
    password: '1242002',
    port: 5432, // default PostgreSQL port
});


// Assign Dust Engine to Dust Files
app.engine("dust", cons.dust); 

// Set default extension to Dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

// Bodyparser Middleware
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

// Define route handler for '/'
app.get('/', function(req, res) { 
    // Get a client from the pool
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        // Use the client for database operations
        client.query('SELECT * FROM recipe', function(err, result) {
            done(); // Release client back to the pool
            if (err) {
                return console.error('error running query', err);
            }
            console.log(result.rows);
            res.render('index', { recipes: result.rows }); // Render the index page with recipes data
        });
    });
});

// Define route handler for '/add'
app.post('/add', function(req, res){
    // Get a client from the pool
    pool.connect(function(err, client, done){
        if(err){
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO recipe(title, ingredients, directions) VALUES ($1, $2, $3)",
            [req.body.title, req.body.ingredients, req.body.directions], function(err, result) {
                done(); // Release client back to the pool
                if(err){
                    return console.error('error running query', err);
                }
                res.redirect('/');
            });
    });
});

// Define route handler for '/delete/:id'
app.delete('/delete/:id', function(req, res){
    // Get a client from the pool
    pool.connect(function(err, client, done){
        if(err){
            return console.error('error fetching client from pool', err);
        }
        client.query('DELETE FROM recipe WHERE id = $1', [req.params.id], function(err, result) {
            done(); // Release client back to the pool
            if(err){
                return console.error('error running query', err);
            }
            res.sendStatus(200); // Send success status
        });
    });
});

// Define route handler for '/edit'
app.post('/edit', function(req, res){
    // Get a client from the pool
    pool.connect(function(err, client, done){
        if(err){
            return console.error('error fetching client from pool', err);
        }
        client.query('UPDATE recipe SET title=$1, ingredients=$2, directions=$3 WHERE id= $4',
            [req.body.title, req.body.ingredients, req.body.directions, req.body.id], function(err, result) {
                done(); // Release client back to the pool
                if(err){
                    return console.error('error running query', err);
                }
                res.redirect('/');
            });
    });
});

//server
var server = app.listen(3000, function(){
    console.log('Server started On port 3000');
});

// Close the database connection pool when the server is stopped
process.on('SIGINT', function() {
    server.close(function() {
        pool.end(); // Close the PostgreSQL pool
        console.log('Server stopped');
        process.exit(0);
    });
});

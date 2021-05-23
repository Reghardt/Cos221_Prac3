
// comment here
var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');



var connection = mysql.createConnection({
	host     : 'aws-cos221.c5zbzrr9w4bb.us-east-2.rds.amazonaws.com',
	user     : 'admin',
	password : 'cos221_prac3_pw',
	database : 'elections'
});
// This is test comment
//this is my comment
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


// index page
app.get('/', function(req, res) {
	var mascots = [
		{ name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
		{ name: 'Tux', organization: "Linux", birth_year: 1996},
		{ name: 'Moby Dock', organization: "Docker", birth_year: 2013}
	  ];
	  var tagline = "No programming concept is complete without a cute animal mascot.";

	  res.render('pages/login', {
		mascots: mascots,
		tagline: tagline
	  });
  });
  
  // about page
  app.get('/about', function(req, res) {
    res.render('pages/about');
  });


app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM voter WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});


 // voterMain page
 app.get('/voterMain', function(req, res) {
    res.render('pages/voterMain');
  });

   // register staff page
 app.get('/registerStaff', function(req, res) {
    res.render('pages/registerStaff');
  });

     // register candidate page
 app.get('/registerCandidate', function(req, res) {
    res.render('pages/registerCandidate');
  });

    // register party page
 app.get('/registerParty', function(req, res) {
    res.render('pages/registerParty');
  });

      // update voting district page
 app.get('/updateDistrict', function(req, res) {
    res.render('pages/updateDistrict');
  });

  // login page
  app.get('/login', function(req, res) {
    res.render('pages/login');
  });

  // ballot page
  app.get('/ballot', function(req, res) {
    res.render('pages/ballot');
  });

app.get('/register', function (req, res) {
    res.render('pages/register');
    console.log('pages/register');
});

app.listen(3000);
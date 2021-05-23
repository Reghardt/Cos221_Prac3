
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
	secret: 'super secret secret key for hash',
	resave: false,
	saveUninitialized: false
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


// index page
app.get('/', function(req, res) {
	  res.render('pages/login');
  });
  
  // about page
  app.get('/about', function(req, res) {
    res.render('pages/about');
  });


app.post('/auth', function(request, response) {
	var firstname = request.body.firstname;
	var surname = request.body.surname;
	var idNumber = request.body.idnumber;
	var password = request.body.password;
	
	if (firstname && password) {
		connection.query('SELECT * FROM voter WHERE id = ? AND firstname = ? AND surname = ? AND password = ?', [idNumber, firstname, surname, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.userID = idNumber;
				response.redirect('/voterMain');
			} else {
				response.send('Incorrect firstname and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter firstname and Password!');
		response.end();
	}
});


// generate munParty Table -- helper
app.get('/generateMidTables', function(req, res) {

	
    connection.query('SELECT * FROM municipality', function(error, munResults, fields) {
		if (munResults.length > 0) {

			let allMunicipalities;
			let allParties;

			allMunicipalities = munResults;

			connection.query('SELECT * FROM politicalParty', function(error, parResults, fields) {
				allParties = parResults;
				
				for(mun in allMunicipalities)
				{
					for(par in allParties)
					{
						connection.query('INSERT INTO elections.munParty (munNameFK, polPartyNameFK, votes) VALUES (?, ?, ?);', [allMunicipalities[mun].municipalityName, allParties[par].PartyName, 0 ], function(error, results) {
							if (error) {
								console.log("Error creating munParty: Exists");

							}
							else
							{
								console.log("Success inserting mun");

							}
						});
					}
				}

			});
		} else {
			response.send('an error occurred in reteving the municipalities');
		}			

	});
	//for dist parties table
	connection.query('SELECT * FROM District', function(error, distResults, fields) {
		if (distResults.length > 0) {
			
			let allDistMunicipalities;
			let allParties;

			allDistMunicipalities = distResults;

			connection.query('SELECT * FROM politicalParty', function(error, parResults, fields) {
				allParties = parResults;
				
				for(dist in allDistMunicipalities)
				{
					for(par in allParties)
					{
						connection.query('INSERT INTO elections.distParty (munNameFK, distPartyNameFK, votes) VALUES (?, ?, ?);', [allDistMunicipalities[dist].municipalityNameFK, allParties[par].PartyName, 0 ], function(error, results) {
							if (error) {
								console.log("Error creating distParty: Exists");

							}
							else
							{
								console.log("Success inserting dist");

							}
						});
					}
				}

			});
		} else {
			response.send('an error occurred in reteving the district municipalities');
		}			

	});
  });

 // voterMain page
 app.get('/voterMain', function(req, res) {
	if(req.session.loggedin && req.session.userID)
	{
		connection.query('select *	from elections.voter where id = ?',[req.session.userID], function(error, results, fields) {
			if (results.length > 0) 
			{
				console.log(results[0].firstname);
				res.render('pages/voterMain', {
					name: results[0].firstname,
					surname: results[0].surname,
					voted: results[0].hasVoted
				});

			}
		});
	}
	else
	{
		res.end("Please log in");
	}
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

  // logout and show login page
  app.get('/logout', function(req, res) {
	req.session.destroy(); //session killed, cant access pages without logging in
    res.render('pages/login');
  });

  // ballot page
  app.get('/ballot', function(req, res) {
	if(req.session.loggedin && req.session.userID)
	{
		console.log("has session");
		let munIDofVoter;
		connection.query('select MunicipalityId	from elections.voter where id = ?',[req.session.userID], function(error, results, fields) {
			if (results.length > 0) {
				munIDofVoter = results[0].MunicipalityId;
				console.log(munIDofVoter);
				connection.query('SELECT polPartyNameFK FROM elections.voter as vot JOIN elections.munParty as mp ON  vot.municipalityID = mp.munNameFK where municipalityID = ? ;',[munIDofVoter], function(error, munPartyPairResults, fields) {
					if (munPartyPairResults.length > 0) {

						console.log(munPartyPairResults);
						
						connection.query('SELECT munNameFK FROM elections.municipality as mun left JOIN elections.distParty as dp ON  mun.municipalityName = dp.munNameFK where municipalityName = ? ;',[munIDofVoter], function(error, distPartyPairResults, fields) {
							if (distPartyPairResults.length > 0 ) {

								console.log(distPartyPairResults);
								console.log(distPartyPairResults[0].munNameFK);
								if(distPartyPairResults[0].munNameFK != null)
								{
									res.render('pages/ballot', {
										vote2Parties: munPartyPairResults,
										vote3Parties: munPartyPairResults
									});
								}
								else
								{
									res.render('pages/ballot', {
										vote2Parties: munPartyPairResults,
										vote3Parties: null
									});
								}
								

							}
						});
						// res.render('pages/ballot', {
						// 	vote2Parties: munPartyPairResults
						// });
					}
				});
				
			}
		});



		
	}
	else
	{
		console.log("no session");
		res.end("Please log in");
	}
  });

  app.post('/voterCastAllVotes', function(req, response) {
	if(req.session.loggedin && req.session.userID)
	{
		var V2 = req.body.vote2;
		var V3 = req.body.vote3;
		console.log("vote 2 received " + V2);
		console.log("vote 3 received " + V3);

		connection.query('update elections.voter SET hasVoted = 1 Where voter.id = ?;', [req.session.userID], function(error, results) {
			if (error) {
				console.log("Error updated hasVoted");
			}
			else
			{
				console.log("Success updating hasVoted");
			}
		});
	}
	


  });


app.get('/register', function (req, res) {

	connection.query('SELECT * FROM municipality', function(error, results, fields) {
		if (results.length > 0) {
			console.log(results);

			for( row in results){
				console.log(results[row].municipalityName);
			}

			res.render('pages/register', {
				zones: results
			});
			console.log('pages/register');
		}
	});


	    
});

app.post('/voterRegRequest', function(request, response) {
	var firstname = request.body.fname;
	var surname = request.body.surname;
	var idNumber = request.body.idnumber;
	var password = request.body.password;
	var munic = request.body.municipalitySelect;
	var age = request.body.age;
	
	var city = request.body.city;
	var street = request.body.stname;
	var pcode = request.body.pcode;

	console.log(firstname);
	console.log(surname);
	console.log(idNumber);
	console.log(password);
	console.log(munic);
	console.log(age);

	console.log(city);
	console.log(street);
	console.log(pcode);

	connection.query('INSERT INTO elections.voter (id, firstname, surname, password, municipalityID, age, city, street, pcode)  VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?);', [idNumber, firstname, surname, password, munic, age, city, street, pcode], function(error, results) {
		if (error) {
			console.log("Error inserting");
		}
		else
		{
			console.log("Success inserting");
			response.redirect('/login');
		}
	});

	
	
	
});

app.listen(3000);
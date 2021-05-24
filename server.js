
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
app.get('/generateMidTables', function(req, response) {
	if(req.session.staff && req.session.staffID)
	{
	
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
				response.end('an error occurred in reteving the municipalities');
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
				response.end('an error occurred in reteving the district municipalities');
			}			

		});
		response.end('Table generation in progress..');
}});

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
	if(req.session.staff && req.session.staffID)
	{
		res.render('pages/registerStaff');
	}
	else
	{
		res.end("not logged in as staff");
	}
    
  });

     // register candidate page
 app.get('/registerCandidate', function(req, res) {
	if(req.session.staff && req.session.staffID)
	{
		connection.query('SELECT * FROM elections.municipality;', function(error, munResults, fields) {
			if (munResults.length > 0 ) 
			{
				connection.query('SELECT * FROM elections.politicalParty;', function(error, polPartyResults, fields) {
					if (polPartyResults.length > 0 ) 
					{
						res.render('pages/registerCandidate', {
							municipalities: munResults,
							polParties: polPartyResults
						});
					}
				});
			}
		});
		
	}
	else
	{
		res.end("not logged in as staff");
	}

    
  });

  app.post('/registerCandidateAuth', function(req, res) {
	if(req.session.staff && req.session.staffID)
	{
		var fname = req.body.fname;
		var lname = req.body.lname;
		var partyName = req.body.partyName;
		var idNumber = req.body.idNumber;
		var municName = req.body.municName;
		var role = req.body.role;

		console.log(fname);
		console.log(lname);
		console.log(partyName);
		console.log(idNumber);
		console.log(municName);
		connection.query('SELECT * FROM elections.voter where id = ? ;', [idNumber], function(error, voterRes, fields) 
		{
			if(voterRes.length > 0)
			{
				connection.query('INSERT INTO elections.runningCandidate (runningCandidateID, nrOfVotes, runningIn, role, partyName) VALUES (?, ?, ?, ?, ?);',[idNumber,0,municName,role, partyName], function(inError, insertCandidateRes, fields) 
				{
					if(inError)
					{
						res.end("Could not register candidate");
					}
					else
					{
						res.end("Successfully registered candidate");
					}
					
					
				});
				
			}
			else
			{
				res.end("error: not registered as voter");
			}
		});


	}
	else
	{
		res.end("not logged in as staff");
	}

    
  });

    // register party page
 app.get('/registerParty', function(req, res) {
	if(req.session.staff && req.session.staffID)
	{
		res.render('pages/registerParty');
	}
	else
	{
		res.end("not logged in as admin");
	}
  });

app.post('/registerPartyAuth', function(req, res) {
	if(req.session.staff && req.session.staffID)
	{
		var partyName = req.body.partyName;
		console.log(partyName);
		connection.query('INSERT INTO elections.politicalParty (PartyName) VALUES (?);',[partyName], function(inError, insertPartyRes, fields) 
		{
			if(inError)
			{
				res.end("Could not create party");
			}
			else
			{
				//res.end("Successfully created party \n Generating tables...");
				res.redirect('/generateMidTables');
			}
			
			
		});
	}
	else
	{
		res.end("not logged in as admin");
	}
  });

      // update voting district page
 app.get('/updateDistrict', function(req, res) {
    res.render('pages/updateDistrict');
  });

  // login page
  app.get('/login', function(req, res) {
    res.render('pages/login');
  });

  // login page staff members
  app.get('/loginStaffMember', function(req, res) {
    res.render('pages/loginStaffMember');
  });

  

  // login page staff members
  app.post('/authStaffMember', function(req, res) {
	var firstname = req.body.firstname;
	var surname = req.body.surname;
	var idNumber = req.body.idnumber;
	var password = req.body.password;

	console.log(firstname);
	console.log(surname);
	console.log(idNumber);
	console.log(password);

	connection.query('SELECT * FROM elections.staff where id = ? AND fname = ? AND surname = ? AND password = ? ;',[idNumber,firstname, surname, password], function(error, results, fields) {
		if (results.length > 0) 
		{
			req.session.staff = true;
			req.session.staffID = idNumber;
			res.redirect('/registerStaff');
		}
		else
		{
			res.end("You are not a staff member");
		}
	});


    
  });

  

  app.post('/registerStaffAuth', function(req, res)
  {
	if(req.session.staff && req.session.staffID)
	{
		var fname = req.body.fname;
		var lname = req.body.lname;
		var role = req.body.role;
		var idNumber = req.body.idNumber;
		var password = req.body.password;

		console.log(fname);
		console.log(lname);
		console.log(idNumber);
		console.log(password);
		console.log(role);

		connection.query('SELECT * FROM elections.voter where id = ? ;',[idNumber], function(error, results, fields) {
			if(!results.length > 0)
			{
				
				connection.query('INSERT INTO elections.staff (id, fname, surname, password, role) VALUES (?, ?, ?, ?, ?);',[idNumber,fname,lname,password,role], function(inError, insertRes, fields) {
					if (inError) {
						console.log("Error inserting Staff member");
						res.end("Error inserting Staff member");

					}
					else
					{
						console.log("Success inserting Staff Member");
						res.end("success inserting Staff member");
					}
				
				});
			}
			else
			{
				console.log("Already registered as a voter");
				res.end("Already registered as a voter");
			}
		
		});
	}
	else
	{
		res.end("not logged in as admin");
	}
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
		connection.query('select MunicipalityId, hasVoted from elections.voter where id = ?',[req.session.userID], function(error, results, fields) {
			if (results.length > 0) 
			{
				if(results[0].hasVoted)
				{
					res.redirect('/voterMain');
				}
				else
				{

				
				munIDofVoter = results[0].MunicipalityId;
				console.log(munIDofVoter);
				connection.query('SELECT polPartyNameFK FROM elections.voter as vot JOIN elections.munParty as mp ON  vot.municipalityID = mp.munNameFK where municipalityID = ? AND id = ? ;',[munIDofVoter, req.session.userID], function(error, munPartyPairResults, fields) {
					if (munPartyPairResults.length > 0) {

						console.log(munPartyPairResults);
						
						connection.query('SELECT munNameFK FROM elections.municipality as mun left JOIN elections.distParty as dp ON  mun.municipalityName = dp.munNameFK where municipalityName = ? ;',[munIDofVoter], function(error, distPartyPairResults, fields) {
							if (distPartyPairResults.length > 0 ) 
							{
								//get candidates that can be voted for in the voters municipality
								connection.query('SELECT firstname, surname, role, partyName, runningCandidateID FROM elections.voter as vot JOIN elections.runningCandidate as rc on vot.municipalityID = rc.runningIn and vot.id = rc.runningCandidateID where runningIn = ? ;',[munIDofVoter], function(canVoteErr, candidatesInMyMunicRes, fields) 
								{
									if(candidatesInMyMunicRes.length > 0)
									{
										console.log(candidatesInMyMunicRes); //candidates I can vote for in my munic
										console.log(distPartyPairResults);	//parties I can vote for in my minic
										console.log(distPartyPairResults[0].munNameFK); //am I in a metropolitan area
										if(distPartyPairResults[0].munNameFK != null)
										{
											res.render('pages/ballot', {
												vote1Candidates: candidatesInMyMunicRes,
												vote2Parties: munPartyPairResults,
												vote3Parties: munPartyPairResults
											});
										}
										else
										{
											res.render('pages/ballot', {
												vote1Candidates: candidatesInMyMunicRes,
												vote2Parties: munPartyPairResults,
												vote3Parties: null
											});
										}
										
									}
									else
									{	
										console.log(candidatesInMyMunicRes); //candidates I can vote for in my munic
										console.log(distPartyPairResults);	//parties I can vote for in my minic
										console.log(distPartyPairResults[0].munNameFK); //am I in a metropolitan area
										if(distPartyPairResults[0].munNameFK != null)
										{
											res.render('pages/ballot', {
												vote1Candidates: candidatesInMyMunicRes,
												vote2Parties: munPartyPairResults,
												vote3Parties: munPartyPairResults
											});
										}
										else
										{
											res.render('pages/ballot', {
												vote1Candidates: candidatesInMyMunicRes,
												vote2Parties: munPartyPairResults,
												vote3Parties: null
											});
										}
									}
									
								});
								
								

							}
						});
						// res.render('pages/ballot', {
						// 	vote2Parties: munPartyPairResults
						// });
					}
				});
				
			}
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
		var V1 = req.body.vote1;
		var V2 = req.body.vote2;
		var V3 = req.body.vote3;
		console.log("vote 1 received " + V1);
		console.log("vote 2 received " + V2);
		console.log("vote 3 received " + V3);
		//TODO: update nr of votes for canidate, 
		connection.query('update elections.voter SET hasVoted = 1 Where voter.id = ?;', [req.session.userID], function(error, results) {
			if (error) {
				console.log("Error updated hasVoted");
			}
			else
			{
				console.log("Success updating hasVoted");
				response.redirect('/voterMain');
			}
		});

		connection.query('SELECT municipalityID FROM voter where id = ? ;', [req.session.userID], function(error, munNameRes, fields)
		{
			if (munNameRes.length > 0) 
			{
				console.log(munNameRes);
				if(V1)
				{
					console.log("V1 Defined");
					connection.query('UPDATE elections.runningCandidate SET nrOfVotes = nrOfVotes + 1 where runningCandidateID = ? ;', [V1], function(updateError, updateRes, fields)
					{

					});
				}
				else
				{
					console.log("V1 not Defined");
				}

				if(V2)
				{
					console.log("V2 Defined");
					connection.query('UPDATE elections.munParty SET votes = votes + 1 where munNameFK = ? AND polPartyNameFK = ?;', [munNameRes[0].municipalityID,V2], function(updateError, updateRes, fields)
					{

					});
				}
				else
				{
					console.log("V2 not Defined");
				}

				if(V3)
				{
					console.log("V3 Defined");
					connection.query('UPDATE elections.distParty SET votes = votes + 1 where munNameFK = ? AND distPartyNameFK = ?;', [munNameRes[0].municipalityID,V3], function(updateError, updateRes, fields)
					{

					});
				}
				else
				{
					console.log("V3 not Defined");
				}
				
			}
		});
	}
	else
	{
		res.end("please log in");
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
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const sha256 = require("crypto-js/sha256");
const crypto = require("crypto");
const ejs = require('ejs');
const cookieParser = require("cookie-parser");
const multer = require('multer');


const app = express();
const port = 3000;

// Configurer la connexion MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'LOF'
});

// Connexion à la base de données MySQL
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données MySQL : ' + err.stack);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.urlencoded({ extended: true }));

//Middleware qui regarde les cookies
app.use(cookieParser());

// Configuration de la vue EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static('public'));

const dataFrance = ejs.fileLoader('./src/departements-version-simplifiee.geojson');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + '/public/images/user'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        const query = `SELECT name_user FROM user WHERE token_user = "${req.cookies.sessionIdCookie}"`;
        var username;
        console.log("QYERY", query)
        db.query(query, (err, results) => {
            username = results[0]["name_user"];
            console.log("USER", username);  
            cb(null, username + "." + file.originalname.split(".")[1]);
            fileUpload(username, file, req)
        });
        
    },
  });

  const upload = multer({ storage: storage });

function fileUpload(username, file, req) {
    const query = `UPDATE user SET image_path_user = "${username + "." + file.originalname.split(".")[1]}" WHERE token_user = "${req.cookies.sessionIdCookie}"`;
    db.query(query);
}

// Route pour la page de login
app.get('/', (req, res) => {
    if (req.cookies.sessionIdCookie) {
        // Rediriger vers la page si le client possède un cookie
        res.render('map', { getDataFrance: dataFrance,  userLoggedIn: true});
} else {
        //Sinon renvoie sur register avec une erreur
        res.render('login', {
            userLoggedIn: false,
            fontColor: 'red',
            errorMessage: 'Veuillez vous connecter pour continuer'
        });
    }
});

app.get("/clan", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    let query = `SELECT token_user FROM user WHERE token_user = "${token}"`
    db.query(query, [token], (err, results) => {})

         query = `SELECT name_clan FROM clan`
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
                res.status(500).send('Erreur serveur');
                return;
            }
            else {
                let clans = [];
                for (let i = 0; i < 3; i++) {
                    clans.push(results[i]["name_clan"])
                }
                res.render("clan", {
                    userLoggedIn: true,
                    clan: clans,
                });
            }
        }); 
    });


app.post("/clan1", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const query = `UPDATE user SET id_clan = 1 WHERE token_user = "${token}"`

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
        else {
            res.redirect('/');
        }
    });
});

app.post("/clan2", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const query = `UPDATE user SET id_clan = 2 WHERE token_user = "${token}"`

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
        else {
            res.redirect('/');
        }
    });
});

app.post("/clan3", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const query = `UPDATE user SET id_clan = 3 WHERE token_user = "${token}"`

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
        else {
            res.redirect('/');
        }
    });
});

app.get("/login", (req, res) => {
    res.render('login', {
        userLoggedIn: false,
        errorMessage: "",
        fontColor: ""
    });
});

// Route pour gérer la soumission du formulaire de login
app.post('/login-data', (req, res) => {
    const token = crypto.randomBytes(64).toString('hex')
    const username = req.body.username;
    const password = sha256(req.body.password);

    // Vérification des informations de connexion dans la base de données
    const query = `SELECT * FROM User WHERE name_user = "${username}" AND password_user = "${password}"`;

    //Requête SQL du pseudo et mdp
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }

        if (results.length > 0) {
            const query = `UPDATE user SET token_user = "${token}" WHERE name_user = "${username}"`
            db.query(query, [username, token], (err, results) => {
                if (err) {
                    console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
                    res.status(500).send('Erreur serveur');
                    return;
                }
            });
            res.cookie("sessionIdCookie", token, { httpOnly: true }, { expires: new Date(0) });
            res.redirect('/');

        } 

        else {
            res.render('login', {
                userLoggedIn: false,
                errorMessage: "Votre mot de passe ou votre nom d'utilisateur ne sont pas correct",
                fontColor: 'red'
                // Ajoutez d'autres données nécessaires pour la page d'inscription
              });
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register', {
      userLoggedIn: false,
      pageTitle: 'Register Page',
      errorMessage: "",
      backgroundColor: '#f0f0f0',
      fontColor: 'green'
      // Ajoutez d'autres données nécessaires pour la page d'inscription
    });
});

app.post('/register-data', (req, res) => {
    const token = crypto.randomBytes(64).toString('hex')
    let { username, password, confirmPassword, email } = req.body;
    if (password === confirmPassword) {
        password = sha256(password);
        const query = `INSERT INTO User (name_user, password_user, email_user, id_clan, token_user) VALUES ("${username}", "${password}", "${email}", 1, "${token}")`;

        db.query(query, [username, password, email], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
                res.status(500).send('Erreur serveur');
                return;
            }

            // Succès de l'inscription, rediriger vers la page de connexion
            res.cookie("sessionIdCookie", token, { httpOnly: true }, { expires: new Date(0) });
            res.redirect('/clan');
        });
    } else {
        // Les mots de passe ne correspondent pas, afficher un message d'erreur
        res.render('register', {
            userLoggedIn: false,
            pageTitle: 'Register Page',
            backgroundColor: '#f0f0f0',
            fontColor: 'red',
            errorMessage: 'Les mots de passe ne correspondent pas.'
        });
    }
});
app.get('/mon-compte', (req, res) => {
    const token = req.cookies.sessionIdCookie;
    
    // Utiliser la fonction userLoggedIn avec une promesse
    userLoggedIn(token, res)
        .then((test) => {
            if (test) {
                const query = `SELECT * FROM user WHERE token_user = "${token}"`
                db.query(query, [token], (err, results) => {
                    if (err) {
                        console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
                        res.status(500).send('Erreur serveur');
                        return;
                    } else {
                        const emails = results[0]["email_user"];
                        const usernames = results[0]["name_user"];
                        const imagePaths =  results[0]["image_path_user"];
                        const userStat = {"ma région": "100", "ma deuxieme": "10", }
                        res.render('mon-compte', {
                            userLoggedIn: true,
                            username: usernames,
                            email: emails,
                            imagePath: imagePaths,
                            userStats: userStat
                            // Ajoutez d'autres données nécessaires pour la page d'inscription
                        });
                    }
                })
            } else {
                res.redirect('/logoff');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Erreur serveur');
        });
});

// Fonction pour vérifier si l'utilisateur est connecté (retourne une promesse)
function userLoggedIn(token, res) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM user where token_user = "${token}"`;
        db.query(query, [token], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
                reject(err);
            } else if (results.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

app.get("/logoff", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const query = `UPDATE user SET token_user = NULL WHERE token_user = "${token}"`
    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
    });

    res.clearCookie("sessionIdCookie");

    res.redirect('/');
});

app.post("/modify-image", upload.single("pfp"), (req, res) => {
    console.log("FILE", req.file);
    res.redirect("/mon-compte")
});

app.post("/modify-name", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const username = req.body.username;
    const query = `UPDATE user SET name_user = "${username}" WHERE token_user = "${token}"`
    db.query(query, [token, username], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données: ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
    });
    res.redirect("/mon-compte")
});

app.post("/modify-email", (req, res) => {
    const token = req.cookies.sessionIdCookie;
    const email = req.body.email;
    const query = `UPDATE user SET email_user = "${email}" WHERE token_user = "${token}"`
    db.query(query, [token, email], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
    });
    res.redirect("/mon-compte")
});

app.route('/')
    .get((req, res) => {
        const token = req.cookies.sessionIdCookie;
        if (userLoggedIn(token, res)) { //Uses the userLoggedIn function to test if the user has a valid token
            res.render('map', { getDataFrance: dataFrance,  userLoggedIn: true});
        } else {
            res.render('login', {
                userLoggedIn: false,
                fontColor: 'red',
                errorMessage: 'Veuillez vous connecter pour continuer'
            } );
        }
    }
);

app.route('/:dep')
    .get((req, res) => {
        const token = req.cookies.sessionIdCookie;
        if (userLoggedIn(token, res)) { 
            res.render('./departement', { dep: req.params.dep, getDataFrance: dataFrance, userLoggedIn: true }, function (err, data) {
                if (err){
                    console.log(err);
                }

                else {
                    res.send(data);
                }
        })
    } else {
        //Takes you to the login page if your token is invalid or expired
        res.render('login', {
            userLoggedIn: false,
            fontColor: 'red',
            errorMessage: 'Veuillez vous connecter pour continuer'
        }
    )};
});

//Starts the server
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});


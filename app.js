const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const sha256 = require("crypto-js/sha256");
const ejs = require('ejs');
const cookieParser = require("cookie-parser");

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

// Route pour la page de login
app.get('/', (req, res) => {
    res.render('login',{
        userLoggedIn: false
    });
});


// Route pour gérer la soumission du formulaire de login
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = sha256(req.body.password);

    // Vérification des informations de connexion dans la base de données
    const query = `SELECT * FROM User WHERE name_user = "${username}" AND password_user = "${password}"`;
    console.log('Query:', query, [username, password]); // Log de la requête SQL
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des informations de connexion : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }

        if (results.length > 0) {
            console.log('Utilisateur connecté avec succès');
            res.cookie("sessionIdCookie", username, { httpOnly: true });
            res.redirect('/dashboard');

        } else {
            console.log('Échec de la connexion');
            res.status(401).send('Échec de la connexion');
        }
    });
});
app.post('/register', (req, res) => {
    console.log('Appuie du bouton');
    res.redirect('/register');
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
    let { username, password, confirmPassword, email } = req.body;
    if (password === confirmPassword) {
        password = sha256(password);
        const query = `INSERT INTO User (name_user, password_user, email_user, id_clan) VALUES ("${username}", "${password}", "${email}", 1)`;
        console.log('Query:', query, [username, password]); // Log de la requête SQL

        db.query(query, [username, password, email], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
                res.status(500).send('Erreur serveur');
                return;
            }

            // Succès de l'inscription, rediriger vers la page de connexion
            res.redirect('/');
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
    usernames = req.cookies.sessionIdCookie
    console.log("Nom d'utilisateur: ", usernames)
    const query = `SELECT * FROM user WHERE name_user = "${usernames}"`
    db.query(query, [usernames], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données d\'inscription : ' + err.stack);
            res.status(500).send('Erreur serveur');
            return;
        }
        else {
            console.log(results[0]["email_user"]);
            const emails = results[0]["email_user"];
            res.render('mon-compte', {
                userLoggedIn: true,
                username: usernames,
                email: emails
                // Ajoutez d'autres données nécessaires pour la page d'inscription
                });
        }
    })
    
});

app.route('/dashboard')
    .get((req, res) => {
        if (req.cookies.sessionIdCookie) {
            // Rediriger vers la page si le client possède un cookie
            res.render('map', { getDataFrance: dataFrance,  userLoggedIn: true});
        } else {
            //Sinon renvoie sur register avec une erreur
            res.render('register', {
                userLoggedIn: false,
                pageTitle: 'Register Page',
                backgroundColor: '#f0f0f0',
                fontColor: 'red',
                errorMessage: 'Veuillez vous connecter pour continuer'
            });
        }
    });

app.route('/:dep')
    .get((req, res) => {
        console.log(req.params);
        res.render('./departement', { dep: req.params.dep, getDataFrance: dataFrance, userLoggedIn: true }, function (err, data) {
            console.log(err);
            res.send(data);
        })
    });

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
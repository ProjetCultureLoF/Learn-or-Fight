function checkLogin() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var loginStatus = document.getElementById('login-status');

    if (username === 'admin' && password === '123') {
        loginStatus.textContent = 'Connexion réussie!';
        loginStatus.style.color = '#4CAF50';
    } else {
        loginStatus.textContent = 'Nom d\'utilisateur ou mot de passe incorrect.';
        loginStatus.style.color = '#FF0000';
    }
}

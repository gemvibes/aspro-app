const PIN_BENAR = "1234";

function login() {
    const pin = document.getElementById("pinInput").value;

    if (pin === PIN_BENAR) {
        sessionStorage.setItem("login", "true");
        tampilkanApp();
    } else {
        alert("PIN salah");
    }
}

function logout() {
    sessionStorage.removeItem("login");
    location.reload();
}

function tampilkanApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("appPage").style.display = "block";
}

window.onload = function () {
    if (sessionStorage.getItem("login") === "true") {
        tampilkanApp();
    }
};

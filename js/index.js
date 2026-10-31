


let loginBtn = document.querySelector("#login");
let priceBtn = document.querySelector("#price");
let locationBtn = document.querySelector("#location");

function toggle(name) {
    if (name === "login") {
        loginBtn.style.display = "block";
        priceBtn.style.display = 'none';
        locationBtn.style.display = 'none';
    } else if (name === 'price') {
        loginBtn.style.display = "none";
        priceBtn.style.display = 'block';
        locationBtn.style.display = 'none';
    } else {
        loginBtn.style.display = "none";
        priceBtn.style.display = 'none';
        locationBtn.style.display = 'block';
    }
}

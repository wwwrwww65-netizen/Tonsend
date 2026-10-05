document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("loyaltySystemBtnLogin");

    if (btn) {
        btn.addEventListener("click", function (e) {
            e.preventDefault();

            if (
                window.LoyaltyManager &&
                typeof window.LoyaltyManager.openPointsPage === "function"
            ) {
                if(window.LoyaltyManager.isLoggedIn()){
                window.LoyaltyManager.openPointsPage();


                }else{
                     window.location.href = window.LoyaltyConfig.api.baseURL;
                }
            } else {
                console.error("LoyaltyManager.openPointsPage is not defined");
            }
        });
    }
});

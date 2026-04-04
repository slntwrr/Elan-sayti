document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("adForm");
    const adsList = document.getElementById("adsList");

    // elan elave et
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const price = document.getElementById("price").value;

        const response = await fetch("http://localhost:3000/ads", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description,
                price,
                user_id: 1
            })
        });

        const data = await response.json();
        alert(data.message);

        loadAds();
    });

    // 🔹 Elanları yüklə
    async function loadAds() {
        const response = await fetch("http://localhost:3000/ads");
        const ads = await response.json();

        adsList.innerHTML = "";

        ads.forEach(ad => {
            const div = document.createElement("div");
            div.className = "ad-card";

            div.innerHTML = `
                <h4>${ad.title}</h4>
                <p>${ad.description}</p>
                <strong>${ad.price} AZN</strong>
            `;

            adsList.appendChild(div);
        });
    }

    // İlk acilisda yukle
    loadAds();
});

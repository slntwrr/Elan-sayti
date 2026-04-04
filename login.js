document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = "cfr_home.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.log(error);
        alert("Serverə qoşulmaq mümkün olmadı");
    }
});

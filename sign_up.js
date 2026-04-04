document.getElementById("signupForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullname, email, password })
    });

    const data = await response.json();
    alert(data.message);
});

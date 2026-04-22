fetch("http://localhost:3000/users")
  .then((response) => response.json())
  .then((data) => {
    console.log("Users:", data);
  })
  .catch((error) => {
    console.error("Error fetching users:", error);
  });

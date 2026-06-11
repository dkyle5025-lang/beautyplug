import { useState, useEffect } from "react";

function Users() {
  const [users, setUsers] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  }, [users]);

  function handleSubmit(e) {
    e.preventDefault();
    fetch("http://localhost:3000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        phone: email,
        first_name: firstName,
        last_name: lastName,
        user_type: "client",
        password_hash: "hgfgvjbknl;jlhgfgjklkjbhgvjbkkhgfgjbkhvc",
      }),
    })
      .then((res) => res.json())
      .then((newUser) => {
        setUsers((prev) => [...prev, newUser]);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
      })
      .catch((err) => console.error(err));
  }

  return (
    <div>
      <h1>Users</h1>
      <h2>Add users</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="first_name"> First Name </label>
        <input
          type="text"
          name="first_name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <br />
        <label htmlFor="last_name"> Last Name </label>
        <input
          type="text"
          name="last_name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <br />
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="phone">Phone</label>
        <input
          type="text"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <br />
        <button type="submit"> Submit</button>
      </form>
      <h2>Users List</h2>
      <ul>
        {users.length > 0 ? (
          users.map((user) => (
            <li key={user.id ?? user.email}>
              <h3>
                {user.first_name} {user.last_name}
              </h3>
              <p>Email: {user.email} </p>
              <p>Phone: {user.phone} </p>
              <p>UserType: {user.user_type}</p>
            </li>
          ))
        ) : (
          <p>No users Found</p>
        )}
      </ul>
    </div>
  );
}

export default Users;

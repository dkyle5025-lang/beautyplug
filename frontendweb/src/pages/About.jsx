// hook - a function that allows you to use state and other React features without writing a class component
// useState - a hook that allows you to add state to functional components - track data that changes over time and affects what is rendered on the screen
// useEffect - a hook that allows you to perform side effects in functional components - data fetching, subscriptions, or manually changing the DOM in React components

import { useState,useEffect } from "react"; 

function About() {
  const [likes, setLikes] = useState(0);
  // https://jsonplaceholder.typicode.com/users
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => response.json())
      .then((data) => {
        setUsers(data); // update the users state with the fetched data
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });    
  }, []);

  return (
    <div>
      <h1>About Us</h1>
      <h2>Likes: {likes}</h2>
      <button onClick={() => setLikes(likes + 1)}>Increase</button>
      <button onClick={() => setLikes(likes - 1)}>Decrease</button>
      <p>
        Welcome to our company! We are a team of dedicated professionals
        committed to providing the best service possible.
      </p>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <h3>Full Name: {user.name} </h3>
            <p> Username: {user.username} </p>
            <p> Email: {user.email} </p>
            <p>Website: {user.website} </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default About;

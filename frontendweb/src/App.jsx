import { useState } from "react";

import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const isLoggedIn = false;

  // fetch service prodviders from the backend API

  return (
    <>
      <h1>Hello world. Count {count}</h1>
      {isLoggedIn ? <p>Welcome back!</p> : <p>Please log in.</p>}
    </>
  );
}

export default App;

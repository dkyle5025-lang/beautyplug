import "./App.css";
import Hero from "./Hero.jsx";
import Service from "./Service.jsx";

function App() {
  const services = [
    { title: "manicure", desc: "best manicure in town" },
    { title: "pedicure", desc: "best pedicure in town" },
    { title: "facial", desc: "best facial in town" },
    { title: "salon", desc: "best salon in town" },
    { title: "makeup", desc: "best makeup in town" },
    { title: "haircut", desc: "best haircut in town" },
  ];
  return (
    <div className="App">
      <h1>Frontend Web </h1>
      <Hero />
      <ul>
        {services.map((service, index) => (
          <Service key={index} title={service.title} desc={service.desc} />
        ))}
      </ul>
    </div>
  );
}

export default App;

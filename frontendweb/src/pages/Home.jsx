import Hero from "../Hero.jsx";
import Service from "../Service.jsx";
import ServiceProvider from "../ServiceProvider.jsx";
import { useEffect, useState } from "react";

function Home() {
  // http://localhost:3000/service-providers
  const [serviceProviders, setServiceProviders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/service-providers")
      .then((response) => response.json())
      .then((data) => {
        setServiceProviders(data); // set providers to the list in the db
      })
      .catch((error) => {
        console.error("Error fetching service providers:", error);
      });
  }, []);

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
      <h2>Our Services</h2>
      <ul>
        {services.map((service, index) => (
          <Service key={index} title={service.title} desc={service.desc} />
        ))}
      </ul>
      <h2> Service Providers </h2>
      {serviceProviders.length > 0 ? (
        serviceProviders.map((provider, index) => (
          <ServiceProvider
            key={index}
            businessName={provider.business_name}
            bio={provider.bio}
            category={provider.primary_category}
            location={provider.home_location_address}
          />
        ))
      ) : (
        <p>No Service Providers Found</p>
      )}
    </div>
  );
}

export default Home;

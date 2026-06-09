import Hero from "../Hero.jsx";
import Service from "../Service.jsx";
import ServiceProvider from "../ServiceProvider.jsx"; 
import {useEffect, useState} from "react";

function Home() {
  // http://localhost:3000/service-providers
  const [serviceProviders, setServiceProviders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/service-providers")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setServiceProviders(data);
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
      <h2> Service Providers  </h2>
      {/* each service provider - business_name, bio , primary_category, home_location_address" */}
      {
        serviceProviders.map((provider, index) => (
          <ServiceProvider 
            key={index}
            businessName={provider.business_name}
            bio={provider.bio}
            category={provider.primary_category}
            location={provider.home_location_address}
          />
        ))
      }    </div>
  );
}

export default Home;

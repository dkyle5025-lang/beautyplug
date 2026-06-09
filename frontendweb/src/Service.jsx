function Service( properties ) {
  return (
    <li>
      <h3>{properties.title}</h3>
      <p> {properties.desc} </p>
    </li>
  );
}

export default Service;

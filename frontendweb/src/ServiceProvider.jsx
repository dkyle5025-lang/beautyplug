 function ServiceProvider(props) {
  return (
    <div>
      <h3>{props.businessName}</h3>
      <p>{props.bio}</p>
      <p>Category: {props.category}</p>
      <p>Location: {props.location}</p>
    </div>
  );
}

export default ServiceProvider;
function Studentdetails1(props) {
  return (
    <div>
      <h2>Student Information</h2>

      <p>Name: {props.Name}</p>
      <p>Roll Number: {props.RollNumber}</p>
      <p>Email: {props.Email}</p>
      <p>Age: {props.Age}</p>
      <p>Mobile No: {props.MobileNo}</p>
      <p>Date of Birth: {props.Dateofbirth}</p>
      <p>Gender: {props.Gender}</p>
      <p>Course: {props.Course}</p>
    </div>
  );
}

export default Studentdetails1;

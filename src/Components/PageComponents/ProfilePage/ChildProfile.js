import React from "react";
import "./ProfilePage.css";
import * as FB from "../../Firebase/FirebaseFunctions";

const ProfilePage = (props) => {
  const userid = localStorage.getItem("authToken");
  const [formError, updateFormError] = React.useState({});
  const [userData, updateUserData] = React.useState(props.data.child);
  const updateFormData = (e) => {
    updateUserData((prevVal) => {
      return { ...prevVal, [e.target.id]: e.target.value };
    });
  };
  const submitData = (e) => {
    e.preventDefault();
    if (userData && !Object.values(userData).includes("")) {
      const coll = "child";
      const doc = userid && JSON.parse(userid).uid;
      const childData = {
        id: userid && JSON.parse(userid).uid,
        firstname: userData.childFirstName,
        lastname: userData.childLastName,
        dob: new Date(userData.chlldDob),
        class: parseInt(userData.childClassName),
        school: userData.childSchool,
      };
      FB.sendData(coll, doc, childData)
        .then(() => {
          console.log("data sent");
        })
        .catch(() => {});
    } else {
      return console.log("blank");
    }
  };
  React.useEffect(() => {
    const uid = localStorage.getItem("authToken");
    const id = JSON.parse(uid).uid;
    FB.getData("child", id).then((data) => {
      if (data && data !== "") {
        updateUserData({
          firstName: data.firstname,
          lastName: data.lastname,
          chlldDob: data.dob.seconds,
          childClassName: data.class,
          childSchool: data.school,
          city: data.city,
          favBook: data.favBook,
          childBio: data.childBio,
        });
      }
    });
  }, []);
  return (
    <div className="profile-PageMain">
      <div className="profilePage-inner">
        <div className="pageTitle">Register for your 1st tournament</div>
        <div
          className="pageTitle"
          style={{ textAlign: "left", padding: "0 calc(0.5vw + 13px)" }}
        >
          Step 2/3- Intoduce your star to the competition
        </div>
        <div className="pageSubtitle">
          Matches are won before they even start! Create a short intro of your
          child for their competitiors
        </div>
        <div>
          <form onSubmit={submitData}>
            <div className="inputContainer">
              <label className="inputBoxlabel">Child's name..</label>
              <input
                type="text"
                className="inputBoxProfile"
                id="firstName"
                value={userData.firstName}
                onChange={updateFormData}
              />
              <input
                type="text"
                className="inputBoxProfile"
                id="lastName"
                value={userData.lastName}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">Date of Birth..</label>
              <input
                type="date"
                className="inputBoxProfile"
                id="chlldDob"
                value={userData.chlldDob}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">Class..</label>
              <input
                type="number"
                className="inputBoxProfile"
                min="1"
                max="12"
                id="childClassName"
                value={userData.childClassName}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">School..</label>
              <input
                type="text"
                className="inputBoxProfile"
                id="childSchool"
                value={userData.childSchool}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">City..</label>
              <input
                type="number"
                className="inputBoxProfile"
                id="city"
                value={userData.city}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">
                Your child’s favourite book..
              </label>
              <input
                type="text"
                className="inputBoxProfile"
                id="favBook"
                value={userData.favBook}
                onChange={updateFormData}
              />
            </div>
            <div className="inputContainer">
              <label className="inputBoxlabel">
                One thing that makes your child jump up with joy..
              </label>
              <textarea
                type="text"
                className="inputBoxProfile"
                id="childBio"
                value={userData.childBio}
                onChange={updateFormData}
                style={{ height: "100px" }}
              ></textarea>
            </div>
            <div>
              <input type="submit" className="submit-btn" value="Next" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

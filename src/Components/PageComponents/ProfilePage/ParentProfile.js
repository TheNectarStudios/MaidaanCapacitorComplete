import React from 'react';
import './ProfilePage.css';
import * as FB from '../../Firebase/FirebaseFunctions';

const ProfilePage = (props) => {
    const userid = localStorage.getItem("authToken");
    const [formError, updateFormError] = React.useState({});
    const [userData, updateUserData] = React.useState(props.data.parent);
    const updateFormData = (e) => {
        updateUserData((prevVal) => {
            return { ...prevVal, [e.target.id]: e.target.value }
        })
    }
    const submitData = (e) => {
        e.preventDefault();
        if (userData && !Object.values(userData).includes('')) {
            const coll = 'parents';
            const doc = userid && JSON.parse(userid).uid;
            const parentData = {
                id: userid && JSON.parse(userid).uid,
                firstname: userData.parentFirstName,
                lastname: userData.parentLastName,
                phonenumber: parseInt(userData.parentPhoneNumber)
            }
            FB.sendData(coll, doc, parentData).then((output) => {
                console.log("sent data")
            }).catch((err) => {

            })
        } else {
            return console.log("blank")
        }
    }
    return <div className="profile-PageMain">
        <div className="profilePage-inner">
            <div className="pageTitle">Welcome to <span style={{ fontStyle: 'italic' }}>Maidaan</span></div>
            <div className="pageTitle" style={{ width: '50%', margin: 'auto', fontSize: '16px' }}>Register for your 1st tournament</div>
            <div className="pageTitle" style={{ textAlign: 'left', padding: '0 calc(0.5vw + 13px)' }}>Step 1/3 -Quick details about you</div>
            <div className="pageSubtitle">
                And your contact info for sharing updates on tournaments and rewards, no spam!
            </div>
            <div>
                <form onSubmit={submitData}>
                    <div className="inputContainer">
                        <label className="inputBoxlabel">Your phone number..</label>
                        <input type="text" placeholder="Enter your 10 digit mobile number" className="inputBoxProfile" id="parentFirstName" value={userData.parentPhoneNumber} onChange={updateFormData} />
                    </div>
                    <div className="inputContainer">
                        <div className="inputBoxlabel">We'll email you on your gmail ID - </div>
                        <div className="inputBoxlabel" style={{fontStyle: 'italic bold'}}>{userid ? JSON.parse(userid).email : ''}</div>
                    </div>
                    <div className="inputContainer">
                        <label className="inputBoxlabel">Your name..</label>
                        <input type="text" placeholder="Name.." className="inputBoxProfile" id="childSchool" value={userData.displayName} onChange={updateFormData} />
                    </div>
                    <div>
                        <input type="submit" className="submit-btn" value="Submit" />
                    </div>
                </form>
            </div>
        </div>
    </div>
}

export default ProfilePage;
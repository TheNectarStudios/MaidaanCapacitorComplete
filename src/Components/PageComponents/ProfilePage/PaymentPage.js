import React from 'react';
import './ProfilePage.css';
import * as FB from '../../Firebase/FirebaseFunctions';

const ProfilePage = () => {
    const userid = localStorage.getItem("authToken");
    const [formError, updateFormError] = React.useState({});
    const [userData, updateUserData] = React.useState({
        firstName: '',
        lastName: '',
        chlldDob: '',
        childClassName: '',
        childSchool: '',
        city: '',
        favBook: '',
        childBio: ''
    });
    const updateFormData = (e) => {
        updateUserData((prevVal) => {
            return { ...prevVal, [e.target.id]: e.target.value }
        })
    }
    const submitData = (e) => {
        e.preventDefault();
        if (userData && !Object.values(userData).includes('')) {
            
        } else {
            return console.log("blank")
        }
    }
    return <div className="profile-PageMain">
        <div className="profilePage-inner">
            <div className="pageTitle">Register for your 1st tournament</div>
            <div className="pageTitle" style={{ textAlign: 'left', padding: '0 calc(0.5vw + 13px)' }}>Step 3/3 - Pay and confirm</div>
            <div>
                <form onSubmit={submitData}>
                    <div style={{height: '67vh'}}></div>
                    <div>
                        <input type="submit" className="submit-btn" value="Register" />
                    </div>
                </form>
            </div>
        </div>
    </div>
}

export default ProfilePage;
import { useEffect } from "react";
import { useAuth } from "../../../providers/auth-provider";
import { useNavigate } from "react-router-dom";
import CryptoJS from 'crypto-js';
import { secretKey, initializationVector } from "../../../firebase-config";
import mixpanel from 'mixpanel-browser';

export default function UserProfileSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
useEffect(() => {
    if(user?.createdAt && user?.id){
        //encode user.id and navigate to /profile/encodedUserId?setup=true
        const userId = user.id;
            //encrypt the user id and navigate to the profile page
            const key = CryptoJS.enc.Hex.parse(secretKey);
            const iv = CryptoJS.enc.Hex.parse(initializationVector);
        
            const encryptedUserId = CryptoJS.AES.encrypt(userId, key, { iv: iv }).toString();
            let urlSafeEncryptedUserId = encryptedUserId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
            //const encryptedUserId = CryptoJS.AES.encrypt(userId, secretKey).toString();
            console.log(urlSafeEncryptedUserId, "encryptedUserId");
            console.log(`/profile/${urlSafeEncryptedUserId}?mode=edit`, "url");
            window.location.href = `/profile/${urlSafeEncryptedUserId}?mode=edit&invite=yes`;
        } 
        navigate('/profile');
    }, [user]);
    return (
        <div>
        </div>
    )
}

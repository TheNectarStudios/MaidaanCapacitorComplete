import { ExposureRounded } from "@mui/icons-material";
import React from "react";


const calculateFinalScore = (correct, scoreType, accuracy=0) => { 
    
    let finalScore = correct;

    if((scoreType ?? '').includes('AccuracyBoost')){
        if (accuracy >= 80){
            finalScore += 5;
        }
        else if(accuracy >= 70 && accuracy < 80){
            finalScore += 3;
        }
        else if(accuracy >= 50 && accuracy < 70){
            finalScore += 1;
        }
    }
    
    return finalScore;
}

export {calculateFinalScore}
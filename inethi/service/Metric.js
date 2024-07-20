import React, { useEffect } from 'react';
import axios from 'axios';


export default function Metric({ feature }) {
    const recordFeatureUsage = async (feature) => {
        try {
            const response = await axios.post('http://10.0.2.2:3001/use-feature', { feature });
            console.log('Feature usage recorded:', response.data);
        } catch (error) {
            console.error('Error recording feature usage:', error);
        }
    };

    useEffect(() => {
        console.log("Insde Metric component")
        if (feature) {
            console.log("metric feature ...", feature)
            recordFeatureUsage(feature);
        }
    }, [feature]);


    return null; // This component does not render anything
}



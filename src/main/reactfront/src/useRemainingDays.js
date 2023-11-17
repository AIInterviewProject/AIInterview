import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { useCookies } from "react-cookie";

export const useRemainingDays = () => {
    const [userEmail, setUserEmail] = useState('');
    const [cookies] = useCookies(['token']);
    const [remainingDays, setRemainingDays] = useState(0);
    const [endDate, setEndDate] = useState(new Date());

    const updateRemainingDays = () => {
        if (!userEmail) return;
        axios.get(`/api/get-days?userEmail=${userEmail}`)
            .then(response => {
                setRemainingDays(response.data);

                const end = new Date();
                end.setDate(end.getDate() + response.data);
                setEndDate(end);
            })
            .catch(error => {
                console.error("Error fetching remaining days:", error);
            });
    };

    useEffect(() => {
        const fetchUserEmail = async () => {
            const token = cookies.token;

            if (token) {
                try {
                    const userDetails = await axios.get('/api/auth/currentUser', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const fetchedUserEmail = userDetails.data.userEmail;
                    setUserEmail(fetchedUserEmail);

                    // 여기서 직접 가져온 email 값을 사용합니다.
                    updateRemainingDays(fetchedUserEmail);
                } catch (error) {
                    console.error("Error fetching user email:", error);
                }
            }
        };

        fetchUserEmail();
    }, [cookies.token, updateRemainingDays]);

    return { remainingDays, endDate, updateRemainingDays };
};

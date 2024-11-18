import React, { useEffect, useState } from 'react';

function Profile() {
    const [profileData, setProfileData] = useState(null);

    const fetchProtectedData = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('You are not logged in!');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/players/profile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            } else {
                console.error('Failed to fetch protected data');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchProtectedData();
    }, []);

    return (
        <div>
            <h1>Profile</h1>
            {profileData ? (
                <div>
                    <p>Username: {profileData.username}</p>
                    <p>Level: {profileData.level}</p>
                    <p>Experience: {profileData.experience}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default Profile;

import React, { useEffect, useState } from 'react';
import './Inventory.css';

function Inventory({ onSave, onBack }) {
    const [skills, setSkills] = useState([]);
    const [skins, setSkins] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState(['Holy Circle', 'Saint Aura', 'Saint Hammer']); // 기본 장착 스킬
    const [selectedSkin, setSelectedSkin] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [activeTab, setActiveTab] = useState('SKILL'); // SKILL 또는 SKIN

    useEffect(() => {
        const fetchInventory = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:8080/api/players/load', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setPlayerData(data);
                    setSkills(data.ownedSkills || []);
                    setSkins(data.ownedSkins || []);
                } else {
                    console.error('Failed to fetch inventory data');
                }
            } catch (error) {
                console.error('Error fetching inventory:', error.message || JSON.stringify(error));
            }
        };

        fetchInventory();
    }, []);

    const handleSkillSelect = (skillName) => {
        if (skillName === 'Holy Circle') return; // Holy Circle은 변경 불가
        const updatedSkills = [...selectedSkills];
        const index = updatedSkills.indexOf(skillName);

        if (index > -1) {
            updatedSkills.splice(index, 1);
        } else if (updatedSkills.length < 3) {
            const replaceIndex = updatedSkills.findIndex((skill) => skill !== 'Holy Circle' && skill !== skillName);
            if (replaceIndex !== -1) updatedSkills[replaceIndex] = skillName;
            else updatedSkills.push(skillName);
        }

        setSelectedSkills(updatedSkills);
    };

    const handleSkinSelect = (skinName) => {
        setSelectedSkin(skinName);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8080/api/players/save-skins', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    skills: selectedSkills,
                    skin: selectedSkin,
                }),
            });
            if (response.ok) {
                alert('Inventory saved successfully!');
                onSave();
            } else {
                console.error('Failed to save inventory');
            }
        } catch (error) {
            console.error('Error saving inventory:', error.message || JSON.stringify(error));
        }
    };

    if (!playerData) return <div>Loading...</div>;

    return (
        <div className="inventory-container">
            <div className="inventory-tabs">
                <button onClick={() => setActiveTab('SKILL')} className={activeTab === 'SKILL' ? 'active' : ''}>
                    Skills
                </button>
                <button onClick={() => setActiveTab('SKIN')} className={activeTab === 'SKIN' ? 'active' : ''}>
                    Skins
                </button>
                <button onClick={onBack}>Back</button>
            </div>
            {activeTab === 'SKILL' ? (
                <div className="inventory-skill-tab">
                    <h2>Skills</h2>
                    <div className="inventory-skills">
                        {skills.map((skill) => (
                            <div
                                key={skill.id}
                                className={`skill-item ${selectedSkills.includes(skill.name) ? 'selected' : ''}`}
                                onClick={() => handleSkillSelect(skill.name)}
                            >
                                <h3>{skill.name}</h3>
                                <p>Level: {skill.level}</p>
                            </div>
                        ))}
                    </div>
                    <h3>Equipped Skills:</h3>
                    <div className="equipped-skills">
                        {selectedSkills.map((skill, index) => (
                            <div key={index} className="equipped-skill">
                                {skill}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="inventory-skin-tab">
                    <h2>Skins</h2>
                    <div className="inventory-skins">
                        {skins.map((skin) => (
                            <div
                                key={skin.id}
                                className={`skin-item ${selectedSkin === skin.name ? 'selected' : ''}`}
                                onClick={() => handleSkinSelect(skin.name)}
                            >
                                <h3>{skin.name}</h3>
                            </div>
                        ))}
                    </div>
                    <h3>Equipped Skin:</h3>
                    <div className="equipped-skin">{selectedSkin ? selectedSkin : 'No Skin Selected'}</div>
                </div>
            )}
            <button onClick={handleSave}>Save</button>
        </div>
    );
}

export default Inventory;

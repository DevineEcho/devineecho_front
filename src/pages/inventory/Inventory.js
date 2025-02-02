import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory({ onBack }) {
    const [ownedSkills, setOwnedSkills] = useState([]);
    const [equippedSkills, setEquippedSkills] = useState({
        skill1: { id: 'holy-circle', name: 'Holy Circle' },
        skill2: null,
        skill3: null,
    });

    useEffect(() => {
        const loadSkills = async () => {
            try {
                const token = localStorage.getItem('token');

                const equippedResponse = await fetch('http://localhost:8080/api/skills/equipped-skills', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const ownedResponse = await fetch('http://localhost:8080/api/skills', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (equippedResponse.ok && ownedResponse.ok) {
                    const equipped = await equippedResponse.json();
                    const owned = await ownedResponse.json();

                    console.log('Equipped Skills:', equipped);
                    console.log('Owned Skills:', owned);

                    setEquippedSkills({
                        skill1: equipped[0] || { id: 'holy-circle', name: 'Holy Circle' },
                        skill2: equipped[1] || null,
                        skill3: equipped[2] || null,
                    });

                    const equippedIds = equipped.map((skill) => skill.id);
                    const filteredOwned = owned.filter(
                        (skill) => !equippedIds.includes(skill.id) && skill.skillType !== 'ENEMY'
                    );

                    setOwnedSkills(filteredOwned);
                } else {
                    console.error('Failed to fetch skills:', equippedResponse.status, ownedResponse.status);
                }
            } catch (error) {
                console.error('Error loading skills:', error);
            }
        };

        loadSkills();
    }, []);

    const handleEquipSkill = (skill, slot) => {
        setEquippedSkills((prev) => {
            const updated = { ...prev, [slot]: skill };
            updateAvailableSkills(updated);
            return updated;
        });
    };

    const handleRemoveSkill = (slot) => {
        setEquippedSkills((prev) => {
            const updated = { ...prev, [slot]: null };
            updateAvailableSkills(updated);
            return updated;
        });
    };

    const updateAvailableSkills = (equipped) => {
        setOwnedSkills((prevOwned) => {
            const equippedIds = Object.values(equipped)
                .filter((skill) => skill)
                .map((skill) => skill.id);
            return prevOwned.filter((skill) => !equippedIds.includes(skill.id));
        });
    };

    const handleSave = async () => {
        try {
            const equippedSkillsPayload = {
                skill1: equippedSkills.skill1?.id || 'holy-circle',
                skill2: equippedSkills.skill2?.id || null,
                skill3: equippedSkills.skill3?.id || null,
            };

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/skills/equip-skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(equippedSkillsPayload),
            });

            if (response.ok) {
                alert('Skills saved successfully!');
            } else {
                alert('Failed to save skills.');
            }
        } catch (error) {
            console.error('Error saving skills:', error);
            alert('Failed to save skills.');
        }
    };

    return (
        <div className="inventory-container">
            <header className="inventory-header">
                <h1>Inventory - Skills</h1>
                <button className="back-button" onClick={onBack}>
                    Back
                </button>
            </header>

            <div className="skill-slots-container">
                <div className="skill-slots">
                    <div className="slot fixed-slot">
                        <h3>Skill 1 (Fixed)</h3>
                        <p>{equippedSkills.skill1.name}</p>
                    </div>
                    <div className="slot" onClick={() => handleRemoveSkill('skill2')}>
                        <h3>Skill 2</h3>
                        <p>{equippedSkills.skill2?.name || 'None equipped'}</p>
                    </div>
                    <div className="slot" onClick={() => handleRemoveSkill('skill3')}>
                        <h3>Skill 3</h3>
                        <p>{equippedSkills.skill3?.name || 'None equipped'}</p>
                    </div>
                </div>

                <div className="owned-skills">
                    <h2>Available Skills</h2>
                    {ownedSkills.map((skill) => (
                        <div
                            key={skill.id}
                            className="skill-item"
                            onClick={() => {
                                !equippedSkills.skill2
                                    ? handleEquipSkill(skill, 'skill2')
                                    : handleEquipSkill(skill, 'skill3');
                            }}
                        >
                            <p>{skill.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button className="save-button" onClick={handleSave}>
                Save
            </button>
        </div>
    );
}

export default Inventory;

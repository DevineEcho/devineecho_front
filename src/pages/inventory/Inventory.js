import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory({ onBack, fetchPlayerSkills, saveEquippedSkills }) {
    const [ownedSkills, setOwnedSkills] = useState([]);
    const [equippedSkills, setEquippedSkills] = useState({
        skill1: { id: 'holy-circle', name: 'Holy Circle' },
        skill2: null,
        skill3: null,
    });

    useEffect(() => {
        const loadPlayerSkills = async () => {
            try {
                const skills = await fetchPlayerSkills();
                setOwnedSkills(skills.filter((skill) => skill.name !== 'Holy Circle'));
            } catch (error) {
                console.error('Error loading player skills:', error);
            }
        };
        loadPlayerSkills();
    }, [fetchPlayerSkills]);

    const handleEquipSkill = (skill, slot) => {
        setEquippedSkills((prev) => ({ ...prev, [slot]: skill }));
    };

    const handleSave = async () => {
        try {
            const equippedSkillsPayload = {
                skill1: equippedSkills.skill1?.id || null,
                skill2: equippedSkills.skill2?.id || null,
                skill3: equippedSkills.skill3?.id || null,
            };

            const token = localStorage.getItem('token');
            await fetch('http://localhost:8080/api/players/equip-skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(equippedSkillsPayload),
            });
            alert('Skills saved successfully!');
        } catch (error) {
            console.error('Error saving skills:', error);
            alert('Failed to save skills. Please try again.');
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
            <div className="inventory-content">
                <div className="skill-slots">
                    <h2>Equipped Skills</h2>
                    <div className="slot fixed-slot">
                        <h3>Skill 1</h3>
                        <p>{equippedSkills.skill1.name}</p>
                    </div>
                    <div className="slot">
                        <h3>Skill 2</h3>
                        <p>{equippedSkills.skill2?.name || 'None equipped'}</p>
                        <button
                            onClick={() => setEquippedSkills((prev) => ({ ...prev, skill2: null }))}
                            disabled={!equippedSkills.skill2}
                        >
                            Remove
                        </button>
                    </div>
                    <div className="slot">
                        <h3>Skill 3</h3>
                        <p>{equippedSkills.skill3?.name || 'None equipped'}</p>
                        <button
                            onClick={() => setEquippedSkills((prev) => ({ ...prev, skill3: null }))}
                            disabled={!equippedSkills.skill3}
                        >
                            Remove
                        </button>
                    </div>
                    <button className="save-button" onClick={handleSave}>
                        Save
                    </button>
                </div>
                <div className="owned-skills">
                    <h2>Available Skills</h2>
                    {ownedSkills.map((skill) => (
                        <div key={skill.id} className="skill-item">
                            <p>{skill.name}</p>
                            <button
                                onClick={() =>
                                    !equippedSkills.skill2
                                        ? handleEquipSkill(skill, 'skill2')
                                        : handleEquipSkill(skill, 'skill3')
                                }
                                disabled={
                                    equippedSkills.skill1?.id === skill.id ||
                                    equippedSkills.skill2?.id === skill.id ||
                                    equippedSkills.skill3?.id === skill.id
                                }
                            >
                                Equip
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Inventory;

import React, { useState, useEffect } from 'react';
import './Inventory.css';

function Inventory({ onBack }) {
    const [activeTab, setActiveTab] = useState('Skill');
    const [ownedSkills, setOwnedSkills] = useState([]);
    const [ownedEquipment, setOwnedEquipment] = useState([]);
    const [ownedSkins, setOwnedSkins] = useState([]);

    const [equippedSkills, setEquippedSkills] = useState({
        skill1: null,
        skill2: null,
        skill3: null,
    });

    const [equippedItem, setEquippedItem] = useState(null);
    const [equippedSkin, setEquippedSkin] = useState(null);
    const [canSave, setCanSave] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');

                const [skillRes, equippedRes, equipRes, skinRes] = await Promise.all([
                    fetch('http://localhost:8080/api/skills', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    }),
                    fetch('http://localhost:8080/api/skills/equipped-skills', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    }),
                    fetch('http://localhost:8080/api/items/equipment', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    }),
                    fetch('http://localhost:8080/api/items/skins', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (skillRes.ok && equippedRes.ok && equipRes.ok && skinRes.ok) {
                    const [skills, equippedSkills, equipment, skins] = await Promise.all([
                        skillRes.json(),
                        equippedRes.json(),
                        equipRes.json(),
                        skinRes.json(),
                    ]);

                   const holyCircleExists = equippedSkills.some(skill => skill.id === 'holy-circle');
                    
                   setEquippedSkills({
                       skill1: holyCircleExists
                           ? equippedSkills.find(skill => skill.id === 'holy-circle')
                           : { id: 'holy-circle', name: 'Holy Circle' },
                       skill2: equippedSkills.length > 1 ? equippedSkills[1] : null,
                       skill3: equippedSkills.length > 2 ? equippedSkills[2] : null,
                   });

                   const filteredSkills = skills
                       .filter(skill => skill.id !== 'holy-circle' && !equippedSkills.some(eq => eq.id === skill.id));
                   
                   setOwnedSkills(filteredSkills);
                   setOwnedEquipment(equipment.filter(item => !item.isEquipped));
                   setOwnedSkins(skins.filter(skin => !skin.isEquipped));

                   setEquippedItem(equipment.find(item => item.isEquipped) || null);
                   setEquippedSkin(skins.find(skin => skin.isEquipped) || null);
               }
           } catch (error) {
               console.error('인벤토리 불러오기 실패', error);
           }
       };

       loadData();
   }, []);

    useEffect(() => {
        if (activeTab === 'Skill') {
            setCanSave(!!equippedSkills.skill1 || !!equippedSkills.skill2 || !!equippedSkills.skill3);
        } else {
            setCanSave(true);
        }
    }, [equippedSkills, equippedItem, equippedSkin, activeTab]);

    const unequipSkill = (slot) => {
        if (!equippedSkills[slot] || slot === 'skill1') return;
        setOwnedSkills(prev => [...prev, equippedSkills[slot]]);
        setEquippedSkills(prev => ({ ...prev, [slot]: null }));
    };

    const unequipEquipment = () => {
        if (!equippedItem) return;
        setOwnedEquipment(prev => [...prev, equippedItem]);
        setEquippedItem(null);
    };

    const unequipSkin = () => {
        if (!equippedSkin) return;
        setOwnedSkins(prev => [...prev, equippedSkin]);
        setEquippedSkin(null);
    };

    const equipSkill = (skill) => {
        if (!equippedSkills.skill2) {
            setEquippedSkills(prev => ({ ...prev, skill2: skill }));
        } else if (!equippedSkills.skill3) {
            setEquippedSkills(prev => ({ ...prev, skill3: skill }));
        }
        setOwnedSkills(prev => prev.filter(s => s.id !== skill.id));
    };

    const equipEquipment = (item) => {
        if (equippedItem) {
            setOwnedEquipment(prev => [...prev, equippedItem]);
        }
        setEquippedItem(item);
        setOwnedEquipment(prev => prev.filter(i => i.id !== item.id));
    };

    const equipSkin = (skin) => {
        if (equippedSkin) {
            setOwnedSkins(prev => [...prev, equippedSkin]);
        }
        setEquippedSkin(skin);
        setOwnedSkins(prev => prev.filter(s => s.id !== skin.id));
    };

    const handleSave = async () => {
        if (!canSave) return;

        const token = localStorage.getItem('token');
        const equippedData = {
            skill1: equippedSkills.skill1?.id || null,
            skill2: equippedSkills.skill2?.id || null,
            skill3: equippedSkills.skill3?.id || null,
            equipment: equippedItem?.id || null,
            skin: equippedSkin?.id || null,
        };

        try {
            await fetch('http://localhost:8080/api/players/equip-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(equippedData),
            });

            console.log("저장 성공");
        } catch (error) {
            console.error("장착 저장 실패", error);
        }
    };

    return (
        <div className="inventory-container">
            <header className="inventory-header">
                <h1>Inventory</h1>
                <div className="inventory-tabs">
                    <button className={activeTab === 'Skill' ? 'active' : ''} onClick={() => setActiveTab('Skill')}>Skills</button>
                    <button className={activeTab === 'Equipment' ? 'active' : ''} onClick={() => setActiveTab('Equipment')}>Equipment</button>
                    <button className={activeTab === 'Skin' ? 'active' : ''} onClick={() => setActiveTab('Skin')}>Skins</button>
                </div>
                <button className="back-button" onClick={onBack}>Back</button>
            </header>

            <div className="inventory-content">
                <div className="left-section">
                    <h2>Equipped {activeTab}</h2>
                    {activeTab === 'Skill' && Object.keys(equippedSkills).map(slot => (
                        <button key={slot} className="skill-item" onClick={() => slot !== 'skill1' && unequipSkill(slot)}>
                            {equippedSkills[slot]?.name || 'None'}
                        </button>
                    ))}
                    {activeTab === 'Equipment' && equippedItem && (
                        <button className="skill-item" onClick={unequipEquipment}>{equippedItem.displayName}</button>
                    )}
                    {activeTab === 'Skin' && equippedSkin && (
                        <button className="skill-item" onClick={unequipSkin}>{equippedSkin.displayName}</button>
                    )}
                </div>

                <div className="right-section">
                    <h2>Available {activeTab}</h2>
                    {(activeTab === 'Skill' ? ownedSkills : activeTab === 'Equipment' ? ownedEquipment : ownedSkins).map(item => (
                        <button key={item.id} className="skill-item" onClick={() => activeTab === 'Skill' ? equipSkill(item) : activeTab === 'Equipment' ? equipEquipment(item) : equipSkin(item)}>
                            {item.name || item.displayName}
                        </button>
                    ))}
                </div>
            </div>

            <button className="save-button" disabled={!canSave} onClick={handleSave}>Save</button>
        </div>
    );
}

export default Inventory;

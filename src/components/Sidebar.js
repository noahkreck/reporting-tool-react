import React from 'react';

const Sidebar = ({ isSidebarVisible, createNewScenario, savedScenarios, handleSelectScenario }) => (
    isSidebarVisible && (
        <section className="side-bar">
            <button className="new-chat-btn" onClick={createNewScenario}>+  New Scenario</button>
            <div className="chat-history">
                <div className="history-header">Saved Scenarios</div>
                <ul className="history-items">
                    {savedScenarios.map((scenario, index) => (
                        <li key={index} className="history-item" onClick={() => handleSelectScenario(index)}>
                            {scenario.scenarioName}
                        </li>
                    ))}
                </ul>
            </div>
            <nav>
                <p>Settings</p>
            </nav>
        </section>
    )
);

export default Sidebar;
import React from 'react';

const TopBar = () => (
    <div className="top-bar">
        <div className="left-container">
            <img src="/demo-company.png" alt="Company Logo" className="app-icon"/>
            <div className="app-title">Intelligent Reporting and Insight Assistant</div>
        </div>
        <p className="info">
            [Model Version] Responses provided may be inaccurate or irrelevant.
        </p>
    </div>
);

export default TopBar;
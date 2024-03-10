import React from 'react';
import FeedItem from './FeedItem';

const Feed = ({
    responsePrintList,
    toggleQueryVisibility,
    processReward,
    rewardRating,
    feedRef,
    finishedFailedScenario,
    errorMessage,
    scenarioStatusMessage,
    finishedSuccessfulScenario,
    savedScenarioFlag,
    savedScenarioName,
    setSavedScenarioName,
    saveResponse,
    downloadedReportFlag,
    downloadReport,
    reportArray,
    setDownloadedReportFlag,
    inputText // Ensure all these variables are passed as props or defined within the component
  }) => {
    return (
        <ul className="feed" ref={feedRef}>
            {responsePrintList.map((item, index) => (
                <FeedItem key={index} item={item} index={index} toggleQueryVisibility={toggleQueryVisibility} processReward={processReward} rewardRating={rewardRating} finishedFailedScenario={finishedFailedScenario}/>
            ))}
            {!errorMessage && scenarioStatusMessage && (
                <div className='message-container'>
                    <div className='response-followup-message'>{scenarioStatusMessage}</div>
                </div>
            )}
            {finishedSuccessfulScenario && (
                <div className="response-actions-container"> 
                    {!savedScenarioFlag ? (
                        <div className="save-response-container">
                            <input 
                                placeholder="Enter Scenario Name" 
                                className="response-name-input"
                                value={savedScenarioName}
                                onChange={(e) => setSavedScenarioName(e.target.value)}/>
                            <button 
                                id="save-response-btn" 
                                className={savedScenarioName.trim() === "" ? "disabled" : ""} 
                                onClick={saveResponse}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                        ) : (
                        <div className='scenario-saved-label'> 
                            <label>Scenario Saved</label>
                        </div>
                    )}
                    {!downloadedReportFlag ? (
                        <div className='download-report-btn'> 
                            <button 
                                id="download-btn"
                                onClick={() => downloadReport(reportArray, savedScenarioName, setDownloadedReportFlag)}
                                className={!savedScenarioFlag ? "disabled" : ""}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && inputText.trim() !== "") {
                                        document.getElementById('download-btn').click();
                                    }
                                }}
                                disabled={!savedScenarioFlag}>
                                Download Report
                            </button>
                                </div>
                        ) : (
                        <div className='report-downloaded-label'> 
                            <label>Report Downloaded</label>
                        </div>
                    )}
                </div>
            )}
        </ul>
    );
};

export default Feed;
import { useState, useEffect, useRef, React} from 'react'
import { querySystemPrompts, explanationSystemPrompt } from './constants/Prompts';

import { OvalLoader, CommentLoader, ThreeDotsLoader} from './components/Loaders';
// import { queryModel, explanationModel } from './constants/Models';
// import { reportingFunctions} from './constants/Functions';

import { irrelevantResponse, relevantResponse, followUpResponse } from './constants/StatusMessages';

import { GridComponent, highlightSyntax, downloadReport } from './utils/Utils';

import SidebarToggle from './components/ToggleSideBar';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';

import hljs from 'highlight.js/lib/core';
import http from 'highlight.js/lib/languages/http';
import sql from 'highlight.js/lib/languages/sql';

// Register the languages you need
hljs.registerLanguage('http', http);
hljs.registerLanguage('sql', sql);

const App = () => {
    //Resetable variables
    const [inputText, setInputText] = useState("")
    const [errorMessage, setErrorMessage] = useState(null)

    //Starts at 1 and increments every follow up 
    const [responseCount, setResponseCount] = useState(1)

    //For setting rating dropdown value
    const [rewardRating, setRewardRating] = useState(null)

    //Flag to prevent scrolling to bottom of feed when side bar scenario is selected
    const [shouldScroll, setShouldScroll] = useState(true)

    //change to awaiting input and configure function for dynamically setting response state
    const [appFunction, setAppFunction] = useState("Report Generation")

    //Set query visibility based on user preferences
    const [queryVisibleFlag, setQueryVisibleFlag] = useState(false)
    const [responsePrintList, setResponsePrintList] = useState([
        {   
            scenarioName: '',
            title: '',
            report: '',
            explanation: '',
            query: '',
            reward: '',
            feedback: '',
            isQueryVisible: queryVisibleFlag
        }
    ])

    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    //Set report array with data retrieved from report request
    const [reportArray, setReportArray] = useState([])

    //Record of all the responses generated for each scenario (for scenarios where no errors occured). Used to train BA model to provide use case examples
    const [allScenarios, setAllScenarios] = useState([])

    //Record of the final response (usable response) generated for saved scenarios
    const [savedScenarios, setSavedScenarios] = useState([])

    //Used to set the saved scenario name in the input field
    const [savedScenarioName, setSavedScenarioName] = useState("")

    //Hide input field when a response is being generated/processed to prevent input duplications
    const [hideInputFlag, setHideInputFlag] = useState(false)

    //Flag to indicate scenario has been saved
    const [savedScenarioFlag, setSavedScenarioFlag] = useState(false);

    //Flag to indicate report has been downloaded
    const [downloadedReportFlag, setDownloadedReportFlag] = useState(false)

    //Used to flag scenario outcomes
    const [finishedFailedScenario, setFinishedFailedScenario] = useState(false)
    const [finishedSuccessfulScenario, setFinishedSuccessfulScenario] = useState(false)
    const [awaitingFeedback, setAwaitingFeedback] = useState(false)
    const [awaitingFollowUp, setAwaitingFollowUp] = useState(false)

    //Scenario status message to indicate state to user - message only shown when not null
    const [scenarioStatusMessage, setScenarioStatusMessage] = useState(null);

    //scenario conversation chain contains all messages (user and assistant) including errors and is used for query model prompting
    const [scenarioConversationChain, setScenarioConversationChain] = useState([])
    //scenario conversation chain is used for report generation training data
    const [reportGenerationTrainingData, setReportGenerationTrainingData] = useState([])

    //For feed scrolling
    const feedRef = useRef(null);

    const [maxResponseCount] = useState(3)

    //should be dynamically set through settings
    const [reportingEndpointType, setReportingEndpointType] = useState("Odata")

    const [extractor, setExtractor] = useState(null);

    const gridRef = useRef(null); // Create a ref

    //Trigger to load relevant extractor when reporting end type is changed
    useEffect(() => {
        const loadExtractor = async () => {
            try {
                const module = await import(`./query_extractors/${reportingEndpointType}Extractor`);
                setExtractor(module);
            } catch (error) {
                console.error("Failed to load the extractor module:", error);
                setErrorMessage("Failed to load the extractor module: Your session has been terminated. Please configure your reporting endpoint in settings")
                setExtractor(null);
            }
        };

        loadExtractor();
    }, [reportingEndpointType]);

    // Function to extract the query using the dynamically loaded extractor
    const handleExtractQuery = async (queryResponse) => {
        if (!extractor) {
            throw new Error("Extractor module not loaded");
        }

        try {
            const query = extractor.extractQuery(queryResponse);
            console.log("Extracted query:", query);
            return query; // Directly return the query string
        } catch (error) {
            console.error(error.message)
            throw new Error(error.message);
        }
    };

    // Function to post the query using the dynamically loaded extractor
    const handlePostQueryRequest = async (query) => {
        if (!extractor) {
            throw new Error("Extractor module not loaded");
        }

        try {
            const data = await extractor.postQueryRequest(query);
            
            console.log("Data fetched:", data);
            return data; // Directly return the fetched data
        } catch (error) {
            console.error(error.message)
            throw new Error(error.message);
        }
    };

    useEffect(() => {
        if (shouldScroll && feedRef.current) {
            const feedElement = feedRef.current;
            feedElement.scrollTop = feedElement.scrollHeight;
        }
    }, [responsePrintList, shouldScroll]); 

    //Reset states
    const resetStates = () => {
        setInputText("")
        setErrorMessage(null)
        setScenarioConversationChain([])
        setResponseCount(1)
        setHideInputFlag(false)
        setRewardRating(null)
        setShouldScroll(true)
        setSavedScenarioName("")
        setHideInputFlag(false)
        setFinishedFailedScenario(false)
        setFinishedSuccessfulScenario(false)
        setAwaitingFeedback(false)
        setScenarioStatusMessage(false)
        setSavedScenarioFlag(false)
        setDownloadedReportFlag(false)
    }

    //Clear all input / create new scenario
    const createNewScenario = () => {
        //Change
        setAppFunction("Report Generation")
        setResponsePrintList([
            {   
                scenarioName: '',
                title: '',
                report: '',
                explanation: '',
                query: '',
                reward: '',
                feedback: '',
                isQueryVisible: queryVisibleFlag
            }
        ])
        resetStates()
    }

    // Watch for changes in errorMessage to terminate scenario 
    useEffect(() => {
        // Check if errorMessage is !null and contains termination key
        if (errorMessage && errorMessage.includes("Session has been terminated")) {
            setAppFunction("Scenario Terminated")
            setFinishedFailedScenario(true)
        }
    }, [errorMessage]); 

    const addNewFeedListItem = () => {
        const newItem = {
            scenarioName: '',
            title: '',
            report: '',
            explanation: '',
            query: '',
            reward: '',
            feedback: '',
            isQueryVisible: queryVisibleFlag 
        };
        setResponsePrintList(prevItems => [...prevItems, newItem]);
    };

    const addFeedListSubitem = (index, key, content) => {
        setResponsePrintList(prevItems => {
            const updatedItems = prevItems.map((item, idx) => {
                if (idx === index) {
                    const updatedItem = { ...item, [key]: content };
                    return updatedItem;
                }
                return item;
            });
            return updatedItems;
        });
    };

    //Toggle query visibility
    const toggleQueryVisibility = (index) => {
        setResponsePrintList(prevItems => prevItems.map((item, idx) => {
            if (idx === index) {
                return { ...item, isQueryVisible: !item.isQueryVisible };
            }
            return item;
        }));
    };

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    const handleRatingChange = (e) => {
        setRewardRating(parseInt(e.target.value, 10));
    };

    const executeAppFunction = async () => {
        if(!hideInputFlag) setHideInputFlag(true)
        if(!shouldScroll) setShouldScroll(true)

        switch (appFunction) {
            case "Report Generation":
                await generateReportResponse();
                break;
            case "generalAssistance":
                // Call general assistance function here
                break;
            case "dataVisualisation":
                // Call data visualisation function here
                break;
            default:
                // Handle unknown responseState
                break;
        }
    }

    //Function for defining the flow to generate a report
    const generateReportResponse = async () => {
        //Response count for scenario are iterated and loop is broken if count exceeds max
        if (responseCount > maxResponseCount) {
            setErrorMessage("Maximum response iterations reached. Your session has been terminated. You can review your responses, but further input and saving your scenario is disabled.")
        }
        else {
            //Add title to feed item if it is the first iteration
            if(responseCount == 1) addFeedListSubitem((responseCount - 1), 'title', inputText)

            //Function to retrieve metadata (RAG?)

            //Generate valid query from inputted scenario & append to current scenario
            const {query, queryModelResponse, dataArray, sucessfulQueryProcess} = await getValidQuery()

            //Convert query generated array to html table
            // const tableHtml = generateHtmlTable(dataArray)
            // addFeedListSubitem((responseCount - 1), 'report', tableHtml)

            // const reportGrid = generateReportGrid(dataArray)
            addFeedListSubitem((responseCount - 1), 'report', dataArray)

            if(sucessfulQueryProcess){
                addFeedListSubitem((responseCount - 1), 'query', query)
                //Generate explanation response from query model response & append to current scenario
                const {explanationModelResponse} = await getExplanationResponse(queryModelResponse)
                addFeedListSubitem((responseCount - 1), 'explanation', explanationModelResponse)
                setReportArray(dataArray)
            }
        }
    }

    const getValidQuery = async () => {
        let sucessfulQueryProcess = false
        let retryCount = 0
        let maxRetryCount = 3
        let queryModelResponse, query, dataArray

        if (responseCount == 1){
            scenarioConversationChain.push({ role: "system", content: querySystemPrompts[`${appFunction} - ${reportingEndpointType}`] })
            scenarioConversationChain.push({ role: "user", content: inputText })
        }

        while (!sucessfulQueryProcess && retryCount < maxRetryCount) {
            const modelPrompt = JSON.stringify(scenarioConversationChain)

            console.log(modelPrompt)

            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: modelPrompt,
                    model: "codellama:7b",
                })
            };

            try {
                const request = await fetch(`http://localhost:8000/ollama`, options);
                const requestData = await request.json();
                console.log(requestData)

                queryModelResponse = requestData.response
                console.log(queryModelResponse)

                query = await handleExtractQuery(queryModelResponse)
                const dataObject = await handlePostQueryRequest(query)
                dataArray = dataObject;

                sucessfulQueryProcess = true

                scenarioConversationChain.push({ role: "assistant", content: query });

            } catch (error) {
                if(error.message.includes("Valid query not found in the response")){
                    //Add assistant response
                    scenarioConversationChain.push({ role: "assistant", content: `${queryModelResponse}`});
                    //Add user request to address erroneous query in response
                    scenarioConversationChain.push({ role: "user", content: `Your response resulted in the following error: ${error.message}. Address this issue in your next response`});
                    retryCount++

                }
                else if ("Query failed to produce a report"){
                    //Add assistant response
                    scenarioConversationChain.push({ role: "assistant", content: `${query}`});
                    //Add user request to address erroneous query in response
                    scenarioConversationChain.push({ role: "user", content: `Your response resulted in the following error: ${error.message}. Address this issue in your next response`});
                    retryCount++
                }
                else {
                    //Add assistant response
                    scenarioConversationChain.push({ role: "assistant", content: `${queryModelResponse}`});
                    //Add user request to address erroneous query in response
                    scenarioConversationChain.push({ role: "user", content: `Your response resulted in the following error: ${error.message}`})
                    retryCount++
                }
            }

        }

        //If report was not processed after 3 query generation attempts, kill session
        if (!sucessfulQueryProcess) {
            setErrorMessage("Query could not be generated. Your Session has been terminated. Please create a new scenario")
        }
        return {query, queryModelResponse, dataArray, sucessfulQueryProcess}
    };

    const getExplanationResponse = async (queryModelResponse) => {
        let explanationModelResponse
        let explanationPromptChain = []

        explanationPromptChain.push({ role: "system", content: explanationSystemPrompt })
        explanationPromptChain.push({ role: "user", content: inputText })
        explanationPromptChain.push({ role: "user", content: queryModelResponse })

        const modelPrompt = JSON.stringify(explanationPromptChain)

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: modelPrompt,
                model: "mistral",
            })
        };

        try {
            const request = await fetch(`http://localhost:8000/ollama`, options);
            const requestData = await request.json();

            explanationModelResponse = requestData.response

        } catch (error) {
            setErrorMessage("Error providing an explanation to the report generated. Your Session has been terminated")
            addFeedListSubitem((responseCount - 1), 'explanation', "No data to display");
        }

        return {explanationModelResponse}
    }

    const processReward = (rating) => {
        addFeedListSubitem((responseCount - 1), 'reward', rating);
        scenarioConversationChain.push({ role: "user", content: `Your query recieved a relevance reward of ${rating}`});
        setInputText("")

        if (rating < 5) {
            setScenarioStatusMessage(irrelevantResponse + maxResponseCount);
            setHideInputFlag(false)
            setAwaitingFeedback(true)
        } else {
            setScenarioStatusMessage(relevantResponse);
            setFinishedSuccessfulScenario(true)

            setAllScenarios(prevData => [...prevData, responsePrintList]);

            if(appFunction == "Report Generation"){
                setReportGenerationTrainingData(prevData => [...prevData, scenarioConversationChain]);
            }
        }
    }

    //Log changes to responsePrintList
    // useEffect(() => {
    //     console.log('responsePrintList has changed:', responsePrintList);
    // }, [responsePrintList]);

    // //Log changes to savedScenarios
    // useEffect(() => {
    //     console.log('savedScenarios has changed:', savedScenarios);
    // }, [savedScenarios]);

    useEffect(() => {
        // Ensure this doesn't run on the initial render
        // and only when responseCount is greater than 1 to avoid unintended triggers
        if (responseCount > 1) {
            
            // Get the title from the previous feed item
            const previousTitle = responsePrintList[responseCount - 2].title;
            // Append the new input text as a bullet point to the title
            const updatedTitle = `${previousTitle}<span class='subsequent-request'><br>Feedback: ${inputText}</span>`;

            addFeedListSubitem(responseCount - 1 , 'title', updatedTitle);
            executeAppFunction()
        }
    }, [responseCount]);

    const processFollowUp = () => {
        setAwaitingFeedback(false)
        setHideInputFlag(true)
        setScenarioStatusMessage(null)
        addFeedListSubitem((responseCount - 1), 'feedback', inputText)
        
        scenarioConversationChain.push({ role: "user", content: `Address the following feedback in your next response: ${inputText} `});

        //Increment response count and create new feedlist item
        setResponseCount(prevCount => prevCount + 1);

        addNewFeedListItem()

    }

    const handleSelectScenario = (index) => {
        setShouldScroll(false); // Prevent scrolling
        const selectedScenario = structuredClone(savedScenarios[index]);
        setResponsePrintList([selectedScenario]);

        //Set to downstream use description
        resetStates()
        setAwaitingFollowUp(true)
    };

    const saveResponse = () => {
        addFeedListSubitem((responseCount - 1), 'scenarioName', savedScenarioName)
        setSavedScenarioFlag(true)
    }

    useEffect(()=>{
        if(savedScenarioFlag){
            console.log('A scenario has been saved');
            setSavedScenarios(prevScenarios => [...prevScenarios, responsePrintList[responsePrintList.length - 1]])
        }
    }, [savedScenarioFlag])

    return (
        <div className='app'>
            <SidebarToggle isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar}/>
            <TopBar/>
            <Sidebar 
                isSidebarVisible={isSidebarVisible} 
                createNewScenario={createNewScenario} 
                savedScenarios={savedScenarios} 
                handleSelectScenario={handleSelectScenario} />
            <section className="main">
            <Feed 
                responsePrintList={responsePrintList} 
                toggleQueryVisibility={toggleQueryVisibility} 
                processReward={processReward} 
                rewardRating={rewardRating} 
                feedRef={feedRef} 
                finishedFailedScenario={finishedFailedScenario}
                errorMessage={errorMessage}
                scenarioStatusMessage={scenarioStatusMessage}
                finishedSuccessfulScenario={finishedSuccessfulScenario}
                savedScenarioFlag={savedScenarioFlag}
                savedScenarioName={savedScenarioName}
                setSavedScenarioName={setSavedScenarioName}
                saveResponse={saveResponse}
                downloadedReportFlag={downloadedReportFlag}
                downloadReport={downloadReport}
                reportArray={reportArray}
                setDownloadedReportFlag={setDownloadedReportFlag}
                inputText={inputText}
            />
            <div className="bottom-section">
                    {errorMessage && !scenarioStatusMessage && (
                        <div className="error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                            {errorMessage}
                        </div>
                    )}
                    {!hideInputFlag && (
                        <div className="input-container">
                            <input
                                placeholder="Type your message here..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && inputText.trim() !== "") {
                                        document.getElementById('submit').click();
                                    }
                                }}
                            />
                            <button 
                                id="submit" 
                                className={inputText.trim() === "" ? "disabled" : ""} 
                                onClick={awaitingFeedback ? processFollowUp : executeAppFunction}
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                    <div className='app-function'><b>Function:</b> {appFunction}</div>
                </div>
            </section>
        </div>

    );


    //Old
    return (
        <div className="app">
            <button className={`sidebar-toggle ${isSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`} onClick={toggleSidebar} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    {isSidebarVisible ? (
                        <path d="M15 19l-8-7 8-7v14z"/> // Left-facing arrow
                    ) : (
                        <path d="M9 5l8 7-8 7V5z"/> // Right-facing arrow
                    )}
                </svg>
            </button>
            <div className="top-bar">
                <div className="left-container">
                    <img src="/demo-company.png" alt="Company Logo" className="app-icon"/>
                    <div className="app-title">Intelligent Reporting and Insight Assistant</div>
                </div>
                <p className="info">
                    [Model Version] Responses provided may be inaccurate or irrelevant.
                </p>
            </div>

            {isSidebarVisible && (
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
            )}
            <section className="main">
                <ul className="feed" ref={feedRef}>
                    {responsePrintList.map((item, index) => (
                        <li key={index} className={`feed-item ${item.title ? "with-title" : ""}`}>
                            {item.title && (
                                <div className="feed-section">
                                    <div className="request-title" dangerouslySetInnerHTML={{ __html: 'Request: ' + item.title }}></div>
                                </div>
                            )}
                            {item.title && (
                            <div className="feed-section">
                                <div className="report-title"><img src="/table.png" alt="report-icon" className="icon-small"/>Full Report</div>
                                {item.report ? ( 
                                    <div className="report-table-container">
                                        <GridComponent dataArray={item.report}/>
                                    </div>
                                    ) : (
                                        !finishedFailedScenario && (
                                            <div className="loading-icon-container">
                                                <OvalLoader/>
                                            </div>
                                        )
                                )}
                            </div>
                            )
                            }
                            {item.report && item.report !== '<div>No data to display</div>' && (
                                <div className="feed-section">
                                    <div className="explanation-title"><img src="/menu.png" alt="explanation-icon" className="icon-small"/>Explanation</div>
                                    {item.explanation ? (
                                        <div className="explanation-container">{item.explanation}</div>
                                        ) : (
                                            !finishedFailedScenario && (
                                                <div className="loading-icon-container">
                                                    <CommentLoader/>
                                                </div>
                                            )
                                        )}
                                </div>
                            )}
                            {item.query && item.explanation && item.report && (
                                <div className="feed-section">
                                    <div className="query-title"><img src="/code.png" alt="query-icon" className="icon-small"/>
                                        <span className="query-text">Query</span>
                                        <button className="toggle-query tooltip" onClick={() => toggleQueryVisibility(index)} title="Toggle Query Visibility">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M12 21l-8-8h16z"/>
                                        </svg>
                                        <span className="tooltiptext">Toggle Query</span>
                                        </button>
                                    </div>
                                    {item.isQueryVisible && (
                                        <div>
                                            <pre className="query-container">
                                                <code
                                                    dangerouslySetInnerHTML={highlightSyntax(item.query)}>
                                                </code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                            {item.explanation && item.report && (
                                <div className="feed-section reward-section">
                                    <hr className="divider" />
                                    <div className="rating-container">
                                    <label htmlFor="rating">Rate the relevance of the provided report on a scale of 1-5:</label>
                                    {item.reward ? (
                                        <>
                                            <div className='item-rating'>{item.reward}</div>
                                            <div className="finished-response-label">Finished Response</div>
                                        </>
                                    ) : (
                                        <>
                                            <select id="rating" name="rating" onChange={handleRatingChange}>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                            </select>
                                            <button type="submit" className="submit-rating tooltip" onClick={() => processReward(rewardRating)} title="Submit Rating">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                                                <path d="M9 16.172l-3.586-3.586-1.414 1.414 5 5 12-12-1.414-1.414z"/>
                                            </svg>
                                            <span className="tooltiptext">Submit Rating</span>
                                            </button>
                                        </>
                                    )}
                                    </div>
                                </div>
                            )}
                        </li>
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
                                        onClick={saveResponse}
                                        >
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
                <div className="bottom-section">
                    {errorMessage && !scenarioStatusMessage && (
                        <div className="error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                            {errorMessage}
                        </div>
                    )}
                    {!hideInputFlag && (
                        <div className="input-container">
                            <input
                                placeholder="Type your message here..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && inputText.trim() !== "") {
                                        document.getElementById('submit').click();
                                    }
                                }}
                            />
                            <button 
                                id="submit" 
                                className={inputText.trim() === "" ? "disabled" : ""} 
                                onClick={awaitingFeedback ? processFollowUp : executeAppFunction}
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                    <div className='app-function'><b>Function:</b> {appFunction}</div>
                </div>
               </section>
           </div>
    );

}

export default App;



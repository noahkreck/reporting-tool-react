import React from 'react';
import { highlightSyntax, GridComponent } from '../utils/Utils'; 
import { OvalLoader, CommentLoader, ThreeDotsLoader} from './Loaders';

const FeedItem = ({ item, index, toggleQueryVisibility, processReward, rewardRating, finishedFailedScenario}) => (
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
                        <select id="rating" name="rating" onChange={(e) => processReward(parseInt(e.target.value, 10))}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </>
                )}
                </div>
            </div>
        )}
    </li>
);

export default FeedItem;
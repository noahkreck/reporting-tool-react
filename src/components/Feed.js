import React from 'react';

const Feed = ({ responsePrintList, toggleQueryVisibility, highlightSyntax, processReward, handleRatingChange, rewardRating, feedRef }) => {
    return (
        <ul className="feed" ref={feedRef}>
            {responsePrintList.map((item, index) => (
                <li key={index} className="feed-item">
                    {item.title && (
                        <div className="feed-section">
                            <div className="request-title" dangerouslySetInnerHTML={{ __html: 'Request: ' + item.title }}></div>
                        </div>
                    )}
                    {item.report && (
                        <div className="feed-section">
                            <div className="report-title">
                                <img src="/table.png" alt="report-icon" className="icon-small"/>Full Report
                            </div>
                            <div className="report-table-container" dangerouslySetInnerHTML={{ __html: item.report}} />
                        </div>
                    )}
                    {item.explanation && (
                        <div className="feed-section">
                            <div className="explanation-title">
                                <img src="/menu.png" alt="explanation-icon" className="icon-small"/>Explanation
                            </div>
                            <div className="explanation-container">{item.explanation}</div>
                        </div>
                    )}
                    {item.query && (
                        <div className="feed-section">
                            <div className="query-title">
                                <img src="/code.png" alt="query-icon" className="icon-small"/>
                                <span className="query-text">Query</span>
                                <button className="toggle-query" onClick={() => toggleQueryVisibility(index)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path d="M12 21l-8-8h16z"/>
                                    </svg>
                                </button>
                            </div>
                            {item.isQueryVisible && (
                                <div>
                                    <pre className="query-container">
                                        <code dangerouslySetInnerHTML={highlightSyntax(item.query)}></code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                    {item.query && (
                        <div className="feed-section reward-section">
                            <div className="rating-container">
                                <label htmlFor="rating">Rate the relevance of the provided report on a scale of 1-5:</label>
                                {item.reward ? (
                                    <>
                                        <div className='item-rating'>{item.reward}</div>
                                        <div className="finished-response-label"><b>Finished Response</b></div>
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
                                        <button type="submit" className="submit-rating" onClick={() => processReward(rewardRating)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                                                <path d="M9 16.172l-3.586-3.586-1.414 1.414 5 5 12-12-1.414-1.414z"/>
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                            <hr className="divider" />
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default Feed;
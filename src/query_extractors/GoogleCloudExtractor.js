export const extractQueryGoogleCloud = (queryResponse) => {
    try {

        //extarct and process query
        return { query: queryResponse.query, error: null};
    } catch (error) {

        //If extraction or processing fails
        return { query: queryResponse.query, error: error.message}
    }
};
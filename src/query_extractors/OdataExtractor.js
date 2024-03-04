import {reportingEndpointUrl} from '../constants/Prompts';

// Extracts the OData query from the response
export const extractQuery = (queryResponse) => {
    const regex = /https:.*\n/;
    const matches = queryResponse.match(regex);
    if (matches && matches[0]) {
        return matches[0].trim(); // Remove the line break at the end
    } else {
        throw new Error("Valid query not found in the response. The query either doesn't contain the entire endpoint url, or it is not wrapped in a code block");
    }
};

const fetchAllData = async (relativeUrl, aggregatedData = []) => {
    let nextUrl = relativeUrl;

    while (nextUrl) {
        // Construct the full URL by appending the relative URL or nextLink to the base URL
        const fullUrl = new URL(nextUrl, reportingEndpointUrl).href;
        const response = await fetch(fullUrl, { headers: { 'Accept': 'application/json' } });
        const data = await response.json();

        if (!response.ok) {
            // throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            throw new Error(data)
        }
        aggregatedData = aggregatedData.concat(data.value);

        if (data['@odata.nextLink']) {
            // Update nextUrl with the nextLink for the next iteration
            nextUrl = data['@odata.nextLink'];
        } else {
            // No more data to fetch, exit the loop
            nextUrl = null;
        }
    }

    return aggregatedData;
};

export const postQueryRequest = async (initialQuery) => {
    try {
        const data = await fetchAllData(initialQuery);
        return data;
    } catch (error) {
        console.log(error)
        let errorMessage = `Error fetching data: ${error}`;
        throw new Error(errorMessage); // Propagate the enhanced error message to be handled by the caller
    }
};
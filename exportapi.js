const AWS = require('aws-sdk');

// Configure AWS SDK - Make sure your credentials are set properly
// Set your AWS credentials (replace with your own)
AWS.config.update({
  accessKeyId: '*****',
  secretAccessKey: '*******',
  region: '*******', 
});

// Create API Gateway service object
const apiGateway = new AWS.APIGateway();

async function getAPIKeys() {
  try {
    const response = await apiGateway.getApiKeys().promise();
    return response.items; // Returns an array of API keys
  } catch (error) {
    console.error('Error retrieving API keys:', error);
    throw error;
  }
}

async function getAPIExports(restApiId) {
  try {
    const response = await apiGateway.getExport({
      restApiId: restApiId,
      stageName: 'Prod',
      exportType: 'swagger', // or 'oas30' for OpenAPI 3.0
      parameters: {
        extensions: 'integrations', // additional information to include in the export
      },
    }).promise();
    return response.body.toString('utf-8'); // Returns the API export
  } catch (error) {
    console.error('Error exporting API:', error);
    throw error;
  }
}

async function getRestApiIds() {
  try {
    const response = await apiGateway.getRestApis().promise();
    if (response.items.length > 0) {
      // Return an array of API IDs
      return response.items.map(api => api.id);
    } else {
      throw new Error('No APIs found.');
    }
  } catch (error) {
    console.error('Error retrieving REST API IDs:', error);
    throw error;
  }
}


async function matchKeysWithExports() {
  try {
    const apiKeys = await getAPIKeys();
    const restApiIds = await getRestApiIds(); // Dynamically get the REST API IDs

    for (const restApiId of restApiIds) {
      const apiExport = await getAPIExports(restApiId);

      // Parse API export to extract title from the info object
      const apiExportParsed = JSON.parse(apiExport);
      const apiTitle = apiExportParsed.info.title;
       
      const basePath = apiExportParsed.basePath;
      const paths = apiExportParsed.paths;
      // Variable to store the matched API keys for each API ID
      const matchedKeys = [];

      // Logic to match API keys with API export title
      for (const apiKey of apiKeys) {
        console.log(`Matching API Key: ${apiKey.name}`);
        if (apiKey.name === apiTitle) {
            const matchedKey = {
                apiKey: apiKey.name,
                matchResult: 'Matched', // or 'Not Matched' depending on your logic
                basePath: basePath,
                paths: paths
                // Add more parameters as needed
              };
          matchedKeys.push(matchedKey);
        }
      }

      // Now you have the matched keys in the `matchedKeys` array for each API ID
      console.log(`Matched API Keys for API ID ${restApiId}:`, matchedKeys);
    }
  } catch (error) {
    console.error('Error matching API keys with exports:', error);
    throw error;
  }
}


// Call the function to start the process
matchKeysWithExports();

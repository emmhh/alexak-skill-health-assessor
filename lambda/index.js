/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const helper = require('./helper')
const assessmentInfo = require('./assessment.json')

// ASK Sound LIBs
const thirtySec = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_waiting_loop_30s_01"/>'; // 32 secs intotal
const beepSound = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_01"/>';
const bellSound = '<audio src="soundbank://soundlibrary/musical/amzn_sfx_bell_timer_01"/>';
const sixtySec = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_countdown_loop_64s_minimal_01"/>'; //64 second intotal
// const tenSec = 'Starting the countdown: <break time="1s"/> 10 <break time="1s"/> 9 <break time="1s"/> 8 <break time="1s"/> 7 <break time="1s"/> 6 <break time="1s"/> 5 <break time="1s"/> 4 <break time="1s"/> 3 <break time="1s"/> 2 <break time="1s"/> 1 <break time="1s"/> 0';
const tenSec = '<break time="10s"/>';

/**
 * alexa hosted DynamoDB
**/
// const AWS = require("aws-sdk");
// const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
// function getPersistenceAdapter() {
//     return new DynamoDbPersistenceAdapter({
//             // tableName: tableName || process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
//             tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
//             createTable: false,
//             dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION})
//     });
// }
// const persistenceAdapter = getPersistenceAdapter();

/**
For my own DynamoDB
 **/ 
const AWS = require("aws-sdk");
const STS = new AWS.STS({ apiVersion: 'latest' });
const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
const table_name = 'alexa-ddb-testing';

async function getPersistenceAdapter(table_name) {
    // Assuming the role here
    const credentials = await STS.assumeRole({
        RoleArn: 'arn:aws:iam::541020517509:role/alexa-hosted-skill',
        RoleSessionName: 'ExampleSkillRoleSession' // You can rename with any name
    }, (err, res) => {
        if (err) {
            console.log('AssumeRole FAILED: ', err);
            throw new Error('Error while assuming role');
        }
        return res;
    }).promise();

    // Using the obtained credentials to instantiate the DynamoDB client
    const dynamoDBClient = new AWS.DynamoDB({
        apiVersion: 'latest',
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken,
        region: 'us-east-1'
    });

    // Scan the table to get the data
    const tableData = await dynamoDBClient.scan({ TableName: table_name }, (err, data) => {
        if (err) {
            console.log('Scan FAILED', err);
            throw new Error('Error while scanning table');
        }
        return data;
    }).promise();
    // ... Use table data as required ...
    console.log('### Table Data: ', tableData);

    return new DynamoDbPersistenceAdapter({
        tableName: table_name,
        createTable: true,
        dynamoDBClient: dynamoDBClient
    });
}

// v2 - wait persistent adapter to be ready
let persistenceAdapter;
async function initialize() {
    // Initialize your resources here.
    try {
        persistenceAdapter = await getPersistenceAdapter(table_name);
        console.log('### Initialisation successful: getPersistenceAdapter succeeded')
    } catch (err) {
        console.error('### Initialisation ERROR: getPersistenceAdapter failed: ' + err);
    }
}
// Call the initialize function immediately, and keep the promise reference.
const initializationPromise = initialize();

// TODO: Customize welcome message based on user information, e.g. if task completed today/ this week, provide a different prompt.
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    // TODO: fetch the node from django backend about the specific information of the assessment
    // TODO: fetch how the user performed in the last assessment, and provide a different welcome message based on the performance.
    // TODO: fetch the user's name from django backend, and use it in the welcome message.
    handle(handlerInput) {
        const speakOutput = 'Welcome to health assessment. I offer upper body, lower body, mobility, and balance assessments. Which one would you like to try?';
        console.log('## skill started');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'I provide instructions to assist you in assessing your upper body and lower body strength, or balance and mobility. For each assessments, i will let you know the equipments required to perform the assessment, you will need to let me know when you are ready. After the assessment, i would like to know your performance, and this will be sent to your care-giver.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

// custom get assessment intent handler; gets the assessment type the user wanted, and return the required equipments based on data.json. 
// Trigger the following instruciton step once the user is ready.

const GetAssessmentIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAssessmentIntent';
    },
    async handle(handlerInput) {
        // var speakOutput = "GetAssessmentIntentHandler triggered! ";
        var assessment;
        var assessmentSlot;
        var resolvedAssessment;
        var speakOutput = "";
        var chosenAssessment;
        var equipments;
        var equipStr;
        
        assessmentSlot = Alexa.getSlot(handlerInput.requestEnvelope, "Assessment");
        assessment = assessmentSlot.value;
        // speakOutput += `assessment: ${assessment}` //debugger
        
        resolvedAssessment = helper.getResolvedWords(handlerInput, "Assessment");
        // speakOutput += `matching resolvedAssessment: ${JSON.stringify(resolvedAssessment)}`; //debugger
        if (resolvedAssessment){
            //todo: 
            // 1. retreive the equipments rquired for the assessment that the user want to preform
            // 2. save the session atrribute, then ask the user to say "i'm ready" when the equipments are acquired. Problem: skills can't wait longer than 8 seconds.
            // 3. following steps (instrucitons, count down, timers) will be handled by "StartAssessmentIntent", which is triggered by "I'm ready"
            const assessmentInfo = require('./assessment.json')
            // speakOutput += `Finding from: ${JSON.stringify(assessmentInfo)}`; //debugger
            chosenAssessment = assessmentInfo.assessments.filter(assessment => assessment.assessment === resolvedAssessment[0].value.name);
            if (chosenAssessment){
                equipments = chosenAssessment[0].equipments;
                equipStr = JSON.stringify(equipments)
                var instructionMsg = chosenAssessment[0].instruction;
                speakOutput += `I heard you want ${resolvedAssessment[0].value.name}. You will need following equipments: ${equipStr}. ${instructionMsg}. Let me know when you are ready.`;
                // store in sessionAttributes
                const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
                console.log(`### GetAssessmentIntentHandler - fetched sessionAttributes: ${JSON.stringify(sessionAttributes)}`);
                sessionAttributes.chosenAssessment = chosenAssessment;
                // save sessionAttributes
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                console.log(`### GetAssessmentIntentHandler - saved sessionAttributes: ${JSON.stringify(sessionAttributes)}`);
            }
        } else {
            speakOutput = `I heard you say ${assessment}. I don't offer this assessment. Choose from upper body, lower body, balance, or mobility.`;
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse()
    }
}

// *GetInstructionsIntentHandler*
// get sessionAttributes; 
// if not exist, check if assessment is mentioned in user input, return exceptionhandler if not slot not valid.
// else, retrieve the instruction information from json file.
// Actions:
// - retrieve instructions, announce it to user;
// - guide what user could seapk: 1. number of reps completed in the given time, 2. say "stop" to stop timer, 3. number of sets completed
const GetInstructionsIntentHandler={
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetInstructionsIntent';
    },
    handle(handlerInput){
        
        var speakOutput = "";
        
        // fetch the sessionAttributes
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var chosenAssessment = sessionAttributes.chosenAssessment;
        
        var assessmentName = chosenAssessment[0].assessment;
        // var instructionMsg = chosenAssessment[0].instruction;
        var assessmentType = chosenAssessment[0].assessmentType;
        // speakOutput += `DEBUG assessmentType: ${JSON.stringify(assessmentType)} `;
        
        // speakOutput += `${instructionMsg}`;
        if (assessmentType.length>1){
            for(let i=1; i<assessmentType.length+1;i++){
                speakOutput += `<say-as interpret-as="ordinal">${i}</say-as> session. Ready, 3, 2, 1, Go!`;
                if (assessmentType[0] === "30"){
                    speakOutput += `${thirtySec}`;
                } else if (assessmentType[0] === "10") {
                    speakOutput += `${tenSec}`;
                } else if (assessmentType[0] === "timer") {
                    // speakOutput = `TODO: instructions for duration ${assessmentType[0]} is not yet implemented.`;
                    speakOutput += helper.startStopWatch(handlerInput, sixtySec);
                }
                if (i!==assessmentType.length-1){
                    speakOutput += `${bellSound} You've completed this session. There are ${assessmentType.length - i} sessions to go!`;
                }
            }
        } else{
            speakOutput += "Ready...3, 2, 1...Go! ";
            // speakOutput += `DEBUG: ${JSON.stringify(chosenAssessment)}`; //debug
            // speakOutput += 'instruction starts now: <audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_waiting_loop_30s_01"/>';
            if (assessmentType[0] === "30"){
                speakOutput += `${thirtySec}`;
            } else if (assessmentType[0] === "10") {
                speakOutput += `${tenSec}`;
            } else if (assessmentType[0] === "timer") {
                // speakOutput = `TODO: instructions for duration ${assessmentType[0]} is not yet implemented.`;
                speakOutput += helper.startStopWatch(handlerInput, sixtySec);
            }
        }
        // TODO: assessment.json ++ brief ask_for_feedback text;
        speakOutput += `${beepSound}`;
        speakOutput += "Good job! You have completed your assessment! Please tell me how your assessment went, I'll let your care-giver know. ";
        console.log('## skill ended');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse()
    }
}

const StartTimerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartTimerIntent';
    },
    handle(handlerInput) {
        const speakOutput = helper.startStopWatch(handlerInput, sixtySec);
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse()
    }
};

const StopTimerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StopTimerIntent';
    },
    handle(handlerInput) {
        const currTime = new Date().getTime();
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const startTime = sessionAttributes.startTime;

        if (!startTime) {
            return handlerInput.responseBuilder
                .speak('The timer has not started yet. Say start timer when you are ready to start')
                .getResponse();
        }

        // Calculate the elapsed time, FIXME: Manually subtracted 8630 milisec from the elapased time to remove the time alexa speaks.
        const elapsedTime = (currTime - startTime - 8630) / 1000;
        const speakOutput = `The timer has stopped. The elapsed time is ${elapsedTime} seconds. Is there other things that i can help with?`;
        // Reset the timer
        sessionAttributes.startTime = undefined;
        sessionAttributes.elapsedTime = elapsedTime;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        console.log(`## skill ended, elapsedTime is stored in sessionAttributes: ${sessionAttributes}.`);
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse()
    }
};

const FeedbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FeedbackIntent';
    },
    handle(handlerInput) {
        const feedbackValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'reps');
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        // Add the feedback value to the session attributes
        sessionAttributes['feedbackValue'] = parseInt(feedbackValue, 10); // Assuming the feedback value is an integer
        
        // Save the updated session attributes
        attributesManager.setSessionAttributes(sessionAttributes);

        const speakOutput = `Your feedback value of ${feedbackValue} has been received. Thank you!`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
//  Add new handlers above.

/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/* *
 * Below we use async and await ( more info: javascript.info/async-await )
 * It's a way to wrap promises and waait for the result of an external async operation
 * Like getting and saving the persistent attributes
 * */
const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
            try {
                const persistentAttributes = await attributesManager.getPersistentAttributes() || {}; 
                console.log('### Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
                //copy persistent attribute to session attributes
                try {
                    attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
                    console.log('### setSessionAttributes successful');
                } catch (error) {
                    console.error('### error on .setSessionAttributes(); ' + error);
                }
            } catch (error) {
                console.error('### error on .getPersistentAttributes(); ' + JSON.stringify(error));
                return handlerInput.responseBuilder
                    .speak('I encountered an issue retrieving your data. Please try again later.')
                    .getResponse();
            }
        }
        console.log('### LoadAttributesRequestInterceptor - requestEnvelope: ' + JSON.stringify(requestEnvelope));
    }
};

// If you disable the skill and reenable it the userId might change and you loose the persistent attributes saved below as userId is the primary key
const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
            // we increment a persistent session counter here
            sessionAttributes.sessionCounter = sessionAttributes.sessionCounter ? sessionAttributes.sessionCounter + 1 : 1;
            // we make ALL session attributes persistent
            console.log('Saving to persistent storage:' + JSON.stringify(sessionAttributes));
            try {
                attributesManager.setPersistentAttributes(sessionAttributes);
                console.log('### setPersistentAttributes successful');
            } catch (error) {
                console.error('### error on .setPersistentAttributes(); ' + error);
            }
            try{
                await attributesManager.savePersistentAttributes();
                console.log('### savePersistentAttributes successful');
            } catch (error) {
                console.log('### Error on: .savePersistentAttributes() -' + error);
                return handlerInput.responseBuilder
                    .speak('I encountered an issue saving your data. Some changes might not be saved.')
                    .getResponse();
            }
        }
        console.log('### SaveAttributesResponseInterceptor - requestEnvelope: ' + JSON.stringify(requestEnvelope));
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
// v2 - Add async initialization, wait persistent adapter initialization.
exports.handler = async function(event, context) {
    // Wait for the initialization to complete.
    try{
        await initializationPromise;
        console.log('### initializationPromise succeeded');
    } catch(err){
        console.log('### ERROR: initializationPromise failed: ' + err);
    }

    // Then run the Alexa handler.
    const skill = Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            LaunchRequestHandler,
            HelpIntentHandler,
            CancelAndStopIntentHandler,
            FallbackIntentHandler,
            SessionEndedRequestHandler,
            GetAssessmentIntentHandler,
            GetInstructionsIntentHandler,
            StartTimerIntentHandler,
            StopTimerIntentHandler,
            FeedbackIntentHandler,
            IntentReflectorHandler)
        .addErrorHandlers(ErrorHandler)
        .addRequestInterceptors(LoadAttributesRequestInterceptor)
        .addResponseInterceptors(SaveAttributesResponseInterceptor)
        .withPersistenceAdapter(persistenceAdapter)
        .withCustomUserAgent('sample/hello-world/v1.2')
        .create();
        // .lambda()(event, context); // Note the extra call here, because .lambda() returns the actual function.
    const response = await skill.invoke(event, context);
    return response;
};

//  v1
// exports.handler = Alexa.SkillBuilders.custom()
//     .addRequestHandlers(
//         LaunchRequestHandler,
//         HelpIntentHandler,
//         CancelAndStopIntentHandler,
//         FallbackIntentHandler,
//         SessionEndedRequestHandler,
//         GetAssessmentIntentHandler,
//         GetInstructionsIntentHandler,
//         StartTimerIntentHandler,
//         StopTimerIntentHandler,
//         FeedbackIntentHandler,
//         IntentReflectorHandler)
//     .addErrorHandlers(ErrorHandler)
//     .addRequestInterceptors(LoadAttributesRequestInterceptor)
//     .addResponseInterceptors(SaveAttributesResponseInterceptor)
//     .withPersistenceAdapter(persistenceAdapter)
//     .withCustomUserAgent('sample/hello-world/v1.2')
//     .lambda();

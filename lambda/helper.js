function getSpokenWords(handlerInput, slot) {
    if (
        handlerInput.requestEnvelope &&
        handlerInput.requestEnvelope.request &&
        handlerInput.requestEnvelope.request.intent &&
        handlerInput.requestEnvelope.request.intent.slots &&
        handlerInput.requestEnvelope.request.intent.slots[slot] &&
        handlerInput.requestEnvelope.request.intent.slots[slot].value) {
            return handlerInput.requestEnvelope.request.intent.slots[slot].value;    
        }
    else return undefined;
}

function getResolvedWords(handlerInput, slot) {
    if (  handlerInput.requestEnvelope &&
        handlerInput.requestEnvelope.request &&
        handlerInput.requestEnvelope.request.intent &&
        handlerInput.requestEnvelope.request.intent.slots &&
        handlerInput.requestEnvelope.request.intent.slots[slot] &&
        handlerInput.requestEnvelope.request.intent.slots[slot].resolutions &&
        handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority) {
            for (var i = 0;i < handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority.length;i++) {
                if (handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[i] &&
                    handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[i].values &&
                    handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[i].values[0])
                    return handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[i].values;
                }
            } 
    else return undefined;
}

function startStopWatch(handlerInput, soundLib){
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // Save the start time
    var speakOutput = 'Say end timer when you want to finish. Starting the timer now. ';
    sessionAttributes.startTime = new Date().getTime();
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    speakOutput += soundLib;
    
    return speakOutput;
}

module.exports = {
      getSpokenWords,
      getResolvedWords,
      startStopWatch
}
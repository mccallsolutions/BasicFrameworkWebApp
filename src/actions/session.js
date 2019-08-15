import { CLEAR_SESSION, SET_SESSION } from "../constants/actionTypes";
import cognitoUtils from "../lib/cognitoUtils";

export const clearSession = () => ({
  type: CLEAR_SESSION
});

// Initialise the Cognito sesson from a callback href
export function initSessionFromCallbackURI(callbackHref) {
  console.info("3:" + callbackHref);
  return function(dispatch) {
    console.info("dispatch");
    return cognitoUtils
      .parseCognitoWebResponse(callbackHref) // parse the callback URL
      .then(() => cognitoUtils.getCognitoSession()) // get a new session
      .then(session => {
        dispatch({ type: SET_SESSION, session });
      });
  };
}

export const setSession = session => ({
  type: SET_SESSION,
  session
});
